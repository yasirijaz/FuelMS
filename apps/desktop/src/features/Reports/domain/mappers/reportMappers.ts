import type {
  CashPositionReportDto,
  FuelProductLedgerReportDto,
  FuelSalesSummaryReportDto,
  PersonLedgerSummaryReportDto,
  ProfitLossReportDto,
  TrialBalanceReportDto,
} from '../dtos/ReportDtos'
import type { CashPositionReport } from '../entities/CashPositionReport'
import type { FuelProductLedgerReport } from '../entities/FuelProductLedgerReport'
import type { FuelSalesSummaryReport } from '../entities/FuelSalesSummaryReport'
import type { PersonLedgerSummaryReport } from '../entities/PersonLedgerSummaryReport'
import type { ProfitLossReport } from '../entities/ProfitLossReport'
import type { TrialBalanceReport } from '../entities/TrialBalanceReport'

export function mapProfitLossReportDtoToDomain(dto: ProfitLossReportDto): ProfitLossReport {
  return {
    fromDate: new Date(dto.fromDateIso),
    toDate: new Date(dto.toDateIso),
    fuelSalesRevenueMinor: dto.fuelSalesRevenueMinor,
    fuelCogsMinor: dto.fuelCogsMinor,
    grossProfitMinor: dto.grossProfitMinor,
    otherIncomeMinor: dto.otherIncomeMinor,
    operatingExpensesMinor: dto.operatingExpensesMinor,
    netOperatingProfitMinor: dto.netOperatingProfitMinor,
    postedSaleCount: dto.postedSaleCount,
    postedExpenseCount: dto.postedExpenseCount,
    postedIncomeCount: dto.postedIncomeCount,
  }
}

export function mapFuelSalesSummaryReportDtoToDomain(
  dto: FuelSalesSummaryReportDto,
): FuelSalesSummaryReport {
  return {
    fromDate: new Date(dto.fromDateIso),
    toDate: new Date(dto.toDateIso),
    lines: dto.lines.map((line) => ({
      productCode: line.productCode,
      saleCount: line.saleCount,
      quantityMilliLitres: line.quantityMilliLitres,
      revenueMinor: line.revenueMinor,
      cogsMinor: line.cogsMinor,
      grossProfitMinor: line.grossProfitMinor,
    })),
    totalRevenueMinor: dto.totalRevenueMinor,
    totalCogsMinor: dto.totalCogsMinor,
    totalGrossProfitMinor: dto.totalGrossProfitMinor,
  }
}

export function mapFuelProductLedgerReportDtoToDomain(
  dto: FuelProductLedgerReportDto,
): FuelProductLedgerReport {
  return {
    fromDate: new Date(dto.fromDateIso),
    toDate: new Date(dto.toDateIso),
    periodGrossProfitMinor: dto.periodGrossProfitMinor,
    allTimeGrossProfitMinor: dto.allTimeGrossProfitMinor,
    products: dto.products.map((product) => ({
      productCode: product.productCode,
      stockMilliLitres: product.stockMilliLitres,
      periodRevenueMinor: product.periodRevenueMinor,
      periodCogsMinor: product.periodCogsMinor,
      periodGrossProfitMinor: product.periodGrossProfitMinor,
      allTimeRevenueMinor: product.allTimeRevenueMinor,
      allTimeCogsMinor: product.allTimeCogsMinor,
      allTimeGrossProfitMinor: product.allTimeGrossProfitMinor,
      lines: product.lines.map((line) => ({
        occurredAt: new Date(line.occurredAtIso),
        kind: line.kind,
        referenceId: line.referenceId,
        label: line.label,
        notes: line.notes,
        status: line.status,
        quantityMilliLitres: line.quantityMilliLitres,
        moneyInMinor: line.moneyInMinor,
        moneyOutMinor: line.moneyOutMinor,
        grossProfitMinor: line.grossProfitMinor,
      })),
    })),
  }
}

export function mapCashPositionReportDtoToDomain(dto: CashPositionReportDto): CashPositionReport {
  return {
    asOf: new Date(dto.asOfIso),
    lines: dto.lines.map((line) => ({
      accountId: line.accountId,
      accountName: line.accountName,
      accountType: line.accountType,
      balanceMinor: line.balanceMinor,
    })),
    totalBalanceMinor: dto.totalBalanceMinor,
  }
}

export function mapPersonLedgerSummaryReportDtoToDomain(
  dto: PersonLedgerSummaryReportDto,
): PersonLedgerSummaryReport {
  return {
    asOf: new Date(dto.asOfIso),
    receivableTotalMinor: dto.receivableTotalMinor,
    payableTotalMinor: dto.payableTotalMinor,
    lines: dto.lines.map((line) => ({
      partnerId: line.partnerId,
      partnerName: line.partnerName,
      balanceMinor: line.balanceMinor,
      entryCount: line.entryCount,
    })),
  }
}

export function mapTrialBalanceReportDtoToDomain(dto: TrialBalanceReportDto): TrialBalanceReport {
  return {
    asOf: new Date(dto.asOfIso),
    lines: dto.lines.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      accountType: line.accountType,
      balanceMinor: line.balanceMinor,
    })),
    totalDebitMinor: dto.totalDebitMinor,
    totalCreditMinor: dto.totalCreditMinor,
    isBalanced: dto.isBalanced,
  }
}
