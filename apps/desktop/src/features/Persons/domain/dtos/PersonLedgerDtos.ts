import type { PersonLedgerEntryStatus } from '../valueObjects/PersonLedgerEntryStatus'
import type { PersonLedgerEntryType } from '../valueObjects/PersonLedgerEntryType'

export type PersonLedgerCommandErrorDto = { code: string; message: string; kind: string }
export type PersonLedgerCommandResult<T> = {
  ok: boolean
  value?: T
  error?: PersonLedgerCommandErrorDto
}

export type PersonLedgerEntryDto = {
  id: string
  partnerId: string
  partnerName: string
  entryDateIso: string
  entryType: PersonLedgerEntryType | string
  signedAmountMinor: number
  balanceAfterMinor: number
  cashAccountId?: string | null
  cashAccountName?: string | null
  sourceType: string
  sourceId: string
  reference?: string | null
  notes?: string | null
  status: PersonLedgerEntryStatus | string
  recordedBy: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type PersonLedgerBalanceDto = {
  partnerId: string
  partnerName: string
  roles: string[]
  balanceMinor: number
  entryCount: number
  lastEntryDateIso?: string | null
}

export type PersonLedgerBalanceListQueryDto = {
  search?: string
  roleCode?: string
  nonZeroOnly?: boolean
}

export type PersonLedgerEntryListQueryDto = {
  partnerId: string
  limit?: number
}

export type RecordPersonBorrowInputDto = {
  partnerId: string
  amountMinor: number
  entryDateIso: string
  cashAccountId: string
  reference?: string
  notes?: string
  recordedBy: string
}

export type RecordPersonRepayBorrowedInputDto = RecordPersonBorrowInputDto
export type RecordPersonLendInputDto = RecordPersonBorrowInputDto
export type RecordPersonCollectLoanInputDto = RecordPersonBorrowInputDto
