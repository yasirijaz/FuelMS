import type { FuelProductCode } from '@fuelms/shared'
import {
  formatFuelQuantity,
  formatMoneyDisplay,
  fuelProductDisplayName,
  isFuelProductCode,
} from '@fuelms/shared'
import type { CashPositionLine, CashPositionReport } from '../../domain/entities/CashPositionReport'
import type {
  FuelProductLedgerLine,
  FuelProductLedgerProduct,
  FuelProductLedgerReport,
} from '../../domain/entities/FuelProductLedgerReport'
import type {
  FuelSalesSummaryLine,
  FuelSalesSummaryReport,
} from '../../domain/entities/FuelSalesSummaryReport'
import type {
  PersonBalanceLine,
  PersonLedgerSummaryReport,
} from '../../domain/entities/PersonLedgerSummaryReport'
import type { ProfitLossReport } from '../../domain/entities/ProfitLossReport'
import type { TrialBalanceLine, TrialBalanceReport } from '../../domain/entities/TrialBalanceReport'
import { formatDate } from '@shared/utils/format'

export type ReportDateRange = {
  fromDateIso: string
  toDateIso: string
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCurrentMonthDateRange(): ReportDateRange {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    fromDateIso: formatDateInputValue(from),
    toDateIso: formatDateInputValue(to),
  }
}

export const DEFAULT_REPORT_DATE_RANGE = getCurrentMonthDateRange()

export type ProfitLossReportView = {
  fromDateLabel: string
  toDateLabel: string
  fuelSalesRevenueDisplay: string
  fuelCogsDisplay: string
  grossProfitDisplay: string
  otherIncomeDisplay: string
  operatingExpensesDisplay: string
  netOperatingProfitDisplay: string
  postedSaleCount: number
  postedExpenseCount: number
  postedIncomeCount: number
  isEmpty: boolean
}

export function mapProfitLossToView(report: ProfitLossReport): ProfitLossReportView {
  const isEmpty =
    report.postedSaleCount === 0 &&
    report.postedExpenseCount === 0 &&
    report.postedIncomeCount === 0

  return {
    fromDateLabel: formatDate(report.fromDate.toISOString()),
    toDateLabel: formatDate(report.toDate.toISOString()),
    fuelSalesRevenueDisplay: formatMoneyDisplay(report.fuelSalesRevenueMinor),
    fuelCogsDisplay: formatMoneyDisplay(report.fuelCogsMinor),
    grossProfitDisplay: formatMoneyDisplay(report.grossProfitMinor),
    otherIncomeDisplay: formatMoneyDisplay(report.otherIncomeMinor),
    operatingExpensesDisplay: formatMoneyDisplay(report.operatingExpensesMinor),
    netOperatingProfitDisplay: formatMoneyDisplay(report.netOperatingProfitMinor),
    postedSaleCount: report.postedSaleCount,
    postedExpenseCount: report.postedExpenseCount,
    postedIncomeCount: report.postedIncomeCount,
    isEmpty,
  }
}

export type FuelSalesSummaryLineView = {
  id: string
  productLabel: string
  saleCount: number
  quantityDisplay: string
  revenueDisplay: string
  cogsDisplay: string
  grossProfitDisplay: string
}

export type FuelSalesSummaryReportView = {
  lines: FuelSalesSummaryLineView[]
  totalRevenueDisplay: string
  totalCogsDisplay: string
  totalGrossProfitDisplay: string
  isEmpty: boolean
}

function mapFuelSalesLineToView(line: FuelSalesSummaryLine): FuelSalesSummaryLineView {
  const productLabel = isFuelProductCode(line.productCode)
    ? fuelProductDisplayName(line.productCode)
    : line.productCode

  return {
    id: line.productCode,
    productLabel,
    saleCount: line.saleCount,
    quantityDisplay: formatFuelQuantity(line.quantityMilliLitres / 1000),
    revenueDisplay: formatMoneyDisplay(line.revenueMinor),
    cogsDisplay: formatMoneyDisplay(line.cogsMinor),
    grossProfitDisplay: formatMoneyDisplay(line.grossProfitMinor),
  }
}

export function mapFuelSalesSummaryToView(report: FuelSalesSummaryReport): FuelSalesSummaryReportView {
  return {
    lines: report.lines.map(mapFuelSalesLineToView),
    totalRevenueDisplay: formatMoneyDisplay(report.totalRevenueMinor),
    totalCogsDisplay: formatMoneyDisplay(report.totalCogsMinor),
    totalGrossProfitDisplay: formatMoneyDisplay(report.totalGrossProfitMinor),
    isEmpty: report.lines.length === 0,
  }
}

export type CashPositionLineView = {
  id: string
  accountName: string
  accountType: string
  balanceDisplay: string
}

export type CashPositionReportView = {
  asOfLabel: string
  lines: CashPositionLineView[]
  totalBalanceMinor: number
  totalBalanceDisplay: string
  isEmpty: boolean
}

function formatAccountType(accountType: string): string {
  return accountType.charAt(0).toUpperCase() + accountType.slice(1)
}

export function mapCashPositionToView(report: CashPositionReport): CashPositionReportView {
  return {
    asOfLabel: formatDate(report.asOf.toISOString()),
    lines: report.lines.map((line: CashPositionLine) => ({
      id: line.accountId,
      accountName: line.accountName,
      accountType: formatAccountType(line.accountType),
      balanceDisplay: formatMoneyDisplay(line.balanceMinor),
    })),
    totalBalanceMinor: report.totalBalanceMinor,
    totalBalanceDisplay: formatMoneyDisplay(report.totalBalanceMinor),
    isEmpty: report.lines.length === 0,
  }
}

export type PersonBalanceLineView = {
  id: string
  partnerName: string
  balanceDisplay: string
  balanceKind: 'receivable' | 'payable'
  entryCount: number
}

export type PersonLedgerSummaryReportView = {
  asOfLabel: string
  receivableTotalDisplay: string
  payableTotalDisplay: string
  lines: PersonBalanceLineView[]
  isEmpty: boolean
}

export function mapPersonLedgerSummaryToView(
  report: PersonLedgerSummaryReport,
): PersonLedgerSummaryReportView {
  return {
    asOfLabel: formatDate(report.asOf.toISOString()),
    receivableTotalDisplay: formatMoneyDisplay(report.receivableTotalMinor),
    payableTotalDisplay: formatMoneyDisplay(report.payableTotalMinor),
    lines: report.lines.map((line: PersonBalanceLine) => ({
      id: line.partnerId,
      partnerName: line.partnerName,
      balanceDisplay: formatMoneyDisplay(Math.abs(line.balanceMinor)),
      balanceKind: line.balanceMinor >= 0 ? 'receivable' : 'payable',
      entryCount: line.entryCount,
    })),
    isEmpty: report.lines.length === 0,
  }
}

export type TrialBalanceLineView = {
  id: string
  accountCode: string
  accountName: string
  accountType: string
  debitDisplay: string
  creditDisplay: string
}

export type TrialBalanceReportView = {
  asOfLabel: string
  lines: TrialBalanceLineView[]
  totalDebitDisplay: string
  totalCreditDisplay: string
  isBalanced: boolean
  isEmpty: boolean
}

function mapTrialBalanceLineToView(line: TrialBalanceLine): TrialBalanceLineView {
  const isDebitNormal = line.accountType === 'asset' || line.accountType === 'expense'
  let debitMinor = 0
  let creditMinor = 0

  if (line.balanceMinor >= 0) {
    if (isDebitNormal) debitMinor = line.balanceMinor
    else creditMinor = line.balanceMinor
  } else {
    const abs = Math.abs(line.balanceMinor)
    if (isDebitNormal) creditMinor = abs
    else debitMinor = abs
  }

  return {
    id: line.accountCode,
    accountCode: line.accountCode,
    accountName: line.accountName,
    accountType: formatAccountType(line.accountType),
    debitDisplay: debitMinor > 0 ? formatMoneyDisplay(debitMinor) : '—',
    creditDisplay: creditMinor > 0 ? formatMoneyDisplay(creditMinor) : '—',
  }
}

export function mapTrialBalanceToView(report: TrialBalanceReport): TrialBalanceReportView {
  return {
    asOfLabel: formatDate(report.asOf.toISOString()),
    lines: report.lines.map(mapTrialBalanceLineToView),
    totalDebitDisplay: formatMoneyDisplay(report.totalDebitMinor),
    totalCreditDisplay: formatMoneyDisplay(report.totalCreditMinor),
    isBalanced: report.isBalanced,
    isEmpty: report.lines.length === 0,
  }
}

export type ReportTabId =
  | 'profitLoss'
  | 'fuelSales'
  | 'fuelLedger'
  | 'cashPosition'
  | 'personBalances'
  | 'trialBalance'

export const REPORT_TABS: { id: ReportTabId; label: string }[] = [
  { id: 'profitLoss', label: 'Profit & Loss' },
  { id: 'fuelSales', label: 'Fuel Sales' },
  { id: 'fuelLedger', label: 'Fuel Ledger' },
  { id: 'cashPosition', label: 'Cash Position' },
  { id: 'personBalances', label: 'Person Balances' },
  { id: 'trialBalance', label: 'Trial Balance' },
]

export type FuelProductLedgerLineView = {
  id: string
  dateLabel: string
  kind: 'purchase' | 'sale'
  status: 'draft' | 'posted'
  isDraft: boolean
  notesDisplay: string
  debitDisplay: string
  creditDisplay: string
}

export type FuelProductLedgerProductView = {
  productCode: FuelProductCode
  productLabel: string
  stockDisplay: string
  periodProfitDisplay: string
  periodProfitMinor: number
  allTimeProfitDisplay: string
  allTimeProfitMinor: number
  totalPurchaseDisplay: string
  totalPurchaseMinor: number
  totalSalesDisplay: string
  totalSalesMinor: number
  lines: FuelProductLedgerLineView[]
  isEmpty: boolean
}

export type FuelProductLedgerReportView = {
  fromDateLabel: string
  toDateLabel: string
  periodProfitDisplay: string
  periodProfitMinor: number
  allTimeProfitDisplay: string
  allTimeProfitMinor: number
  products: FuelProductLedgerProductView[]
}

function formatSignedProfit(minor: number): string {
  const formatted = formatMoneyDisplay(Math.abs(minor))
  if (minor > 0) return `+${formatted}`
  if (minor < 0) return `−${formatted}`
  return formatted
}

function buildLedgerNotesDisplay(line: FuelProductLedgerLine): string {
  const quantity = formatFuelQuantity(line.quantityMilliLitres / 1000)
  const parts = [`${line.label} · ${quantity}`]
  const trimmedNotes = line.notes?.trim()
  if (trimmedNotes) parts.push(trimmedNotes)
  return parts.join(' — ')
}

function mapLedgerLineToView(line: FuelProductLedgerLine): FuelProductLedgerLineView {
  const isDraft = line.status === 'draft'
  const debitMinor = line.kind === 'purchase' ? line.moneyOutMinor : 0
  const creditMinor = line.kind === 'sale' ? line.moneyInMinor : 0

  return {
    id: `${line.kind}-${line.referenceId}`,
    dateLabel: formatDate(line.occurredAt.toISOString()),
    kind: line.kind,
    status: line.status,
    isDraft,
    notesDisplay: buildLedgerNotesDisplay(line),
    debitDisplay: debitMinor > 0 ? formatMoneyDisplay(debitMinor) : '—',
    creditDisplay: creditMinor > 0 ? formatMoneyDisplay(creditMinor) : '—',
  }
}

function mapProductLedgerToView(product: FuelProductLedgerProduct): FuelProductLedgerProductView {
  const productCode = isFuelProductCode(product.productCode)
    ? product.productCode
    : ('diesel' as FuelProductCode)

  const lines = product.lines.map(mapLedgerLineToView)

  let totalPurchaseMinor = 0
  let totalSalesMinor = 0
  for (const line of product.lines) {
    if (line.status !== 'posted') continue
    if (line.kind === 'purchase') totalPurchaseMinor += line.moneyOutMinor
    if (line.kind === 'sale') totalSalesMinor += line.moneyInMinor
  }

  return {
    productCode,
    productLabel: fuelProductDisplayName(productCode),
    stockDisplay: formatFuelQuantity(product.stockMilliLitres / 1000),
    periodProfitDisplay: formatSignedProfit(product.periodGrossProfitMinor),
    periodProfitMinor: product.periodGrossProfitMinor,
    allTimeProfitDisplay: formatSignedProfit(product.allTimeGrossProfitMinor),
    allTimeProfitMinor: product.allTimeGrossProfitMinor,
    totalPurchaseDisplay: formatMoneyDisplay(totalPurchaseMinor),
    totalPurchaseMinor,
    totalSalesDisplay: formatMoneyDisplay(totalSalesMinor),
    totalSalesMinor,
    lines,
    isEmpty: lines.length === 0,
  }
}

export function mapFuelProductLedgerToView(
  report: FuelProductLedgerReport,
): FuelProductLedgerReportView {
  return {
    fromDateLabel: formatDate(report.fromDate.toISOString()),
    toDateLabel: formatDate(report.toDate.toISOString()),
    periodProfitDisplay: formatSignedProfit(report.periodGrossProfitMinor),
    periodProfitMinor: report.periodGrossProfitMinor,
    allTimeProfitDisplay: formatSignedProfit(report.allTimeGrossProfitMinor),
    allTimeProfitMinor: report.allTimeGrossProfitMinor,
    products: report.products.map(mapProductLedgerToView),
  }
}
