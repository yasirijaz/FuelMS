import { ok } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import type { IReportsRepository } from '../domain/repositories/IReportsRepository'
import type { CashPositionReport } from '../domain/entities/CashPositionReport'
import type { FuelProductLedgerReport } from '../domain/entities/FuelProductLedgerReport'
import type { FuelSalesSummaryReport } from '../domain/entities/FuelSalesSummaryReport'
import type { PersonLedgerSummaryReport } from '../domain/entities/PersonLedgerSummaryReport'
import type { ProfitLossReport } from '../domain/entities/ProfitLossReport'
import type { TrialBalanceReport } from '../domain/entities/TrialBalanceReport'
import type { ReportDateRangeQuery } from '../domain/validation/reportSchemas'

type SeedPurchase = {
  purchaseDateIso: string
  productCode: string
  costMinor: number
  quantityMilliLitres: number
  label: string
  notes?: string
}

type SeedSale = {
  saleDateIso: string
  productCode: string
  revenueMinor: number
  cogsMinor: number
  quantityMilliLitres: number
  label: string
  notes?: string
}

type SeedExpense = {
  expenseDateIso: string
  amountMinor: number
}

type SeedIncome = {
  incomeDateIso: string
  amountMinor: number
}

function dateOnly(iso: string): string {
  return iso.split('T')[0] ?? iso
}

function isInRange(dateIso: string, fromIso: string, toIso: string): boolean {
  const date = dateOnly(dateIso)
  return date >= dateOnly(fromIso) && date <= dateOnly(toIso)
}

function computeTrialBalanceTotals(
  lines: TrialBalanceReport['lines'],
): Pick<TrialBalanceReport, 'totalDebitMinor' | 'totalCreditMinor' | 'isBalanced'> {
  let totalDebit = 0
  let totalCredit = 0

  for (const line of lines) {
    const abs = Math.abs(line.balanceMinor)
    const isDebitNormal = line.accountType === 'asset' || line.accountType === 'expense'

    if (line.balanceMinor >= 0) {
      if (isDebitNormal) totalDebit += line.balanceMinor
      else totalCredit += line.balanceMinor
    } else if (isDebitNormal) {
      totalCredit += abs
    } else {
      totalDebit += abs
    }
  }

  return {
    totalDebitMinor: totalDebit,
    totalCreditMinor: totalCredit,
    isBalanced: totalDebit === totalCredit,
  }
}

export class InMemoryReportsRepository implements IReportsRepository {
  private readonly purchases: SeedPurchase[] = [
    {
      purchaseDateIso: '2026-06-15T08:00:00.000Z',
      productCode: 'diesel',
      costMinor: 20_000_000,
      quantityMilliLitres: 10_000_000,
      label: 'Purchase · Ali Petroleum',
    },
  ]

  private readonly sales: SeedSale[] = [
    {
      saleDateIso: '2026-06-20T10:00:00.000Z',
      productCode: 'diesel',
      revenueMinor: 28_000_000,
      cogsMinor: 20_000_000,
      quantityMilliLitres: 10_000_000,
      label: 'Sale · Walk-in',
    },
  ]

  private readonly expenses: SeedExpense[] = [
    {
      expenseDateIso: '2026-06-18T10:00:00.000Z',
      amountMinor: rupeesToMinor(15_000),
    },
  ]

  private readonly incomes: SeedIncome[] = [
    {
      incomeDateIso: '2026-06-22T10:00:00.000Z',
      amountMinor: rupeesToMinor(50_000),
    },
  ]

  async getProfitLoss(query: ReportDateRangeQuery): Promise<Result<ProfitLossReport, AppError>> {
    const salesInRange = this.sales.filter((sale) =>
      isInRange(sale.saleDateIso, query.fromDateIso, query.toDateIso),
    )
    const expensesInRange = this.expenses.filter((expense) =>
      isInRange(expense.expenseDateIso, query.fromDateIso, query.toDateIso),
    )
    const incomesInRange = this.incomes.filter((income) =>
      isInRange(income.incomeDateIso, query.fromDateIso, query.toDateIso),
    )

    const fuelSalesRevenueMinor = salesInRange.reduce((sum, sale) => sum + sale.revenueMinor, 0)
    const fuelCogsMinor = salesInRange.reduce((sum, sale) => sum + sale.cogsMinor, 0)
    const grossProfitMinor = fuelSalesRevenueMinor - fuelCogsMinor
    const otherIncomeMinor = incomesInRange.reduce((sum, income) => sum + income.amountMinor, 0)
    const operatingExpensesMinor = expensesInRange.reduce(
      (sum, expense) => sum + expense.amountMinor,
      0,
    )

    return ok({
      fromDate: new Date(query.fromDateIso),
      toDate: new Date(query.toDateIso),
      fuelSalesRevenueMinor,
      fuelCogsMinor,
      grossProfitMinor,
      otherIncomeMinor,
      operatingExpensesMinor,
      netOperatingProfitMinor: grossProfitMinor + otherIncomeMinor - operatingExpensesMinor,
      postedSaleCount: salesInRange.length,
      postedExpenseCount: expensesInRange.length,
      postedIncomeCount: incomesInRange.length,
    })
  }

  async getFuelSalesSummary(
    query: ReportDateRangeQuery,
  ): Promise<Result<FuelSalesSummaryReport, AppError>> {
    const salesInRange = this.sales.filter((sale) =>
      isInRange(sale.saleDateIso, query.fromDateIso, query.toDateIso),
    )

    const grouped = new Map<
      string,
      {
        saleCount: number
        quantityMilliLitres: number
        revenueMinor: number
        cogsMinor: number
      }
    >()

    for (const sale of salesInRange) {
      const existing = grouped.get(sale.productCode) ?? {
        saleCount: 0,
        quantityMilliLitres: 0,
        revenueMinor: 0,
        cogsMinor: 0,
      }
      grouped.set(sale.productCode, {
        saleCount: existing.saleCount + 1,
        quantityMilliLitres: existing.quantityMilliLitres + sale.quantityMilliLitres,
        revenueMinor: existing.revenueMinor + sale.revenueMinor,
        cogsMinor: existing.cogsMinor + sale.cogsMinor,
      })
    }

    const lines = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([productCode, totals]) => ({
        productCode,
        saleCount: totals.saleCount,
        quantityMilliLitres: totals.quantityMilliLitres,
        revenueMinor: totals.revenueMinor,
        cogsMinor: totals.cogsMinor,
        grossProfitMinor: totals.revenueMinor - totals.cogsMinor,
      }))

    const totalRevenueMinor = lines.reduce((sum, line) => sum + line.revenueMinor, 0)
    const totalCogsMinor = lines.reduce((sum, line) => sum + line.cogsMinor, 0)

    return ok({
      fromDate: new Date(query.fromDateIso),
      toDate: new Date(query.toDateIso),
      lines,
      totalRevenueMinor,
      totalCogsMinor,
      totalGrossProfitMinor: totalRevenueMinor - totalCogsMinor,
    })
  }

  async getFuelProductLedger(
    query: ReportDateRangeQuery,
  ): Promise<Result<FuelProductLedgerReport, AppError>> {
    const productCodes = ['diesel', 'petrol', 'hobc'] as const
    const allTimeGrossProfitMinor = this.sales.reduce(
      (sum, sale) => sum + sale.revenueMinor - sale.cogsMinor,
      0,
    )
    const periodSales = this.sales.filter((sale) =>
      isInRange(sale.saleDateIso, query.fromDateIso, query.toDateIso),
    )
    const periodGrossProfitMinor = periodSales.reduce(
      (sum, sale) => sum + sale.revenueMinor - sale.cogsMinor,
      0,
    )

    const products = productCodes.map((productCode) => {
      const allSales = this.sales.filter((sale) => sale.productCode === productCode)
      const rangeSales = allSales.filter((sale) =>
        isInRange(sale.saleDateIso, query.fromDateIso, query.toDateIso),
      )
      const rangePurchases = this.purchases.filter(
        (purchase) =>
          purchase.productCode === productCode &&
          isInRange(purchase.purchaseDateIso, query.fromDateIso, query.toDateIso),
      )

      const lines = [
        ...rangePurchases.map((purchase) => ({
          occurredAt: new Date(purchase.purchaseDateIso),
          kind: 'purchase' as const,
          referenceId: `purchase-${purchase.purchaseDateIso}`,
          label: purchase.label,
          notes: purchase.notes ?? null,
          status: 'posted' as const,
          quantityMilliLitres: purchase.quantityMilliLitres,
          moneyInMinor: 0,
          moneyOutMinor: purchase.costMinor,
          grossProfitMinor: 0,
        })),
        ...rangeSales.map((sale) => ({
          occurredAt: new Date(sale.saleDateIso),
          kind: 'sale' as const,
          referenceId: `sale-${sale.saleDateIso}`,
          label: sale.label,
          notes: sale.notes ?? null,
          status: 'posted' as const,
          quantityMilliLitres: sale.quantityMilliLitres,
          moneyInMinor: sale.revenueMinor,
          moneyOutMinor: sale.cogsMinor,
          grossProfitMinor: sale.revenueMinor - sale.cogsMinor,
        })),
      ].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())

      const allTimeRevenueMinor = allSales.reduce((sum, sale) => sum + sale.revenueMinor, 0)
      const allTimeCogsMinor = allSales.reduce((sum, sale) => sum + sale.cogsMinor, 0)
      const periodRevenueMinor = rangeSales.reduce((sum, sale) => sum + sale.revenueMinor, 0)
      const periodCogsMinor = rangeSales.reduce((sum, sale) => sum + sale.cogsMinor, 0)

      return {
        productCode,
        stockMilliLitres: productCode === 'diesel' ? 0 : 0,
        periodRevenueMinor,
        periodCogsMinor,
        periodGrossProfitMinor: periodRevenueMinor - periodCogsMinor,
        allTimeRevenueMinor,
        allTimeCogsMinor,
        allTimeGrossProfitMinor: allTimeRevenueMinor - allTimeCogsMinor,
        lines,
      }
    })

    return ok({
      fromDate: new Date(query.fromDateIso),
      toDate: new Date(query.toDateIso),
      periodGrossProfitMinor,
      allTimeGrossProfitMinor,
      products,
    })
  }

  async getCashPosition(): Promise<Result<CashPositionReport, AppError>> {
    const lines = [
      {
        accountId: 'cash-drawer-main',
        accountName: 'Cash Drawer',
        accountType: 'drawer',
        balanceMinor: rupeesToMinor(200_000),
      },
      {
        accountId: 'cash-bank-main',
        accountName: 'Bank',
        accountType: 'bank',
        balanceMinor: rupeesToMinor(500_000),
      },
      {
        accountId: 'cash-safe-main',
        accountName: 'Safe',
        accountType: 'safe',
        balanceMinor: 0,
      },
    ]

    return ok({
      asOf: new Date(),
      lines,
      totalBalanceMinor: lines.reduce((sum, line) => sum + line.balanceMinor, 0),
    })
  }

  async getPersonLedgerSummary(): Promise<Result<PersonLedgerSummaryReport, AppError>> {
    const lines = [
      {
        partnerId: 'bp-supplier-abc',
        partnerName: 'ABC Petroleum',
        balanceMinor: rupeesToMinor(100_000),
        entryCount: 3,
      },
      {
        partnerId: 'bp-employee-ahmed',
        partnerName: 'Ahmed Khan',
        balanceMinor: -rupeesToMinor(25_000),
        entryCount: 2,
      },
    ]

    let receivableTotalMinor = 0
    let payableTotalMinor = 0
    for (const line of lines) {
      if (line.balanceMinor > 0) receivableTotalMinor += line.balanceMinor
      else payableTotalMinor += Math.abs(line.balanceMinor)
    }

    return ok({
      asOf: new Date(),
      receivableTotalMinor,
      payableTotalMinor,
      lines,
    })
  }

  async getTrialBalance(): Promise<Result<TrialBalanceReport, AppError>> {
    const lines = [
      {
        accountCode: '1100',
        accountName: 'Cash Drawer',
        accountType: 'asset',
        balanceMinor: 50_000,
      },
      {
        accountCode: '4100',
        accountName: 'Fuel Sales Revenue',
        accountType: 'income',
        balanceMinor: 50_000,
      },
    ]

    return ok({
      asOf: new Date(),
      lines,
      ...computeTrialBalanceTotals(lines),
    })
  }
}
