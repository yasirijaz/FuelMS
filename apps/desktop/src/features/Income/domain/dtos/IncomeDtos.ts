import type { IncomeCategory } from '../valueObjects/IncomeCategory'
import type { IncomePaymentStatus } from '../valueObjects/IncomePaymentStatus'
import type { IncomeStatus } from '../valueObjects/IncomeStatus'

export type IncomeCommandErrorDto = { code: string; message: string; kind: string }
export type IncomeCommandResult<T> = { ok: boolean; value?: T; error?: IncomeCommandErrorDto }

export type OperatingIncomeDto = {
  id: string
  incomeDateIso: string
  categoryCode: IncomeCategory
  amountMinor: number
  paymentStatus: IncomePaymentStatus
  sourceName: string
  cashAccountId?: string | null
  cashAccountName?: string | null
  reference?: string | null
  notes?: string | null
  status: IncomeStatus
  recordedBy: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type OperatingIncomeListQueryDto = { search?: string; status?: string }
export type RecordOperatingIncomeInputDto = {
  incomeDateIso: string
  categoryCode: IncomeCategory
  amountMinor: number
  paymentStatus: IncomePaymentStatus
  sourceName: string
  cashAccountId?: string
  reference?: string
  notes?: string
  recordedBy: string
}
export type VoidOperatingIncomeInputDto = { incomeId: string; version: number }
