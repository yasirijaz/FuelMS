import type { IncomeCategory } from '../valueObjects/IncomeCategory'
import type { IncomePaymentStatus } from '../valueObjects/IncomePaymentStatus'
import type { IncomeStatus } from '../valueObjects/IncomeStatus'

export type OperatingIncomeId = string & { readonly __brand: 'OperatingIncomeId' }
export const OperatingIncomeId = {
  fromPersisted(value: string): OperatingIncomeId {
    return value as OperatingIncomeId
  },
  toString(id: OperatingIncomeId): string {
    return id
  },
}

export type OperatingIncome = {
  id: OperatingIncomeId
  incomeDate: Date
  categoryCode: IncomeCategory
  amountMinor: number
  paymentStatus: IncomePaymentStatus
  sourceName: string
  cashAccountId?: string
  cashAccountName?: string
  reference?: string
  notes?: string
  status: IncomeStatus
  recordedBy: string
  createdAt: Date
  updatedAt: Date
  version: number
}
