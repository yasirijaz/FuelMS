import { formatMoneyDisplay } from '@fuelms/shared'
import type { OperatingIncome } from '../../domain/entities/OperatingIncome'
import { OperatingIncomeId } from '../../domain/entities/OperatingIncome'
import { incomeCategoryLabel } from '../../domain/valueObjects/IncomeCategory'
import { incomePaymentStatusLabel } from '../../domain/valueObjects/IncomePaymentStatus'

export type IncomeListItem = {
  id: string
  incomeDateIso: string
  categoryCode: OperatingIncome['categoryCode']
  categoryLabel: string
  amountMinor: number
  amountDisplay: string
  paymentStatus: OperatingIncome['paymentStatus']
  paymentStatusLabel: string
  sourceName: string
  cashAccountName?: string
  reference?: string
  status: OperatingIncome['status']
  version: number
}

export function mapIncomeToListItem(income: OperatingIncome): IncomeListItem {
  return {
    id: OperatingIncomeId.toString(income.id),
    incomeDateIso: income.incomeDate.toISOString(),
    categoryCode: income.categoryCode,
    categoryLabel: incomeCategoryLabel(income.categoryCode),
    amountMinor: income.amountMinor,
    amountDisplay: formatMoneyDisplay(income.amountMinor),
    paymentStatus: income.paymentStatus,
    paymentStatusLabel: incomePaymentStatusLabel(income.paymentStatus),
    sourceName: income.sourceName,
    cashAccountName: income.cashAccountName,
    reference: income.reference,
    status: income.status,
    version: income.version,
  }
}

export type IncomeListFilters = {
  search: string
  status: 'posted' | 'void' | 'all'
}

export const DEFAULT_INCOME_LIST_FILTERS: IncomeListFilters = {
  search: '',
  status: 'posted',
}

export function toIncomeListQuery(filters: IncomeListFilters) {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status,
  }
}
