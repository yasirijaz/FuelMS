import type { PostingStatus } from '@fuelms/shared'
import type { AccountType } from '../valueObjects/AccountType'
import type { NormalBalance } from '../valueObjects/NormalBalance'
import type { PeriodStatus } from '../valueObjects/PeriodStatus'
import type { PeriodType } from '../valueObjects/PeriodType'

export type AccountingCommandErrorDto = { code: string; message: string; kind: string }
export type AccountingCommandResult<T> = {
  ok: boolean
  value?: T
  error?: AccountingCommandErrorDto
}

export type LedgerAccountDto = {
  id: string
  code: string
  name: string
  accountType: AccountType
  parentId?: string | null
  isSystem: boolean
  isActive: boolean
  normalBalance: NormalBalance
  displayOrder: number
  notes?: string | null
  balanceMinor: number
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type JournalLineDto = {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  lineMemo?: string | null
  debitMinor: number
  creditMinor: number
}

export type JournalEntryDto = {
  id: string
  entryDateIso: string
  memo?: string | null
  sourceType: string
  sourceId: string
  postingStatus: PostingStatus
  postedAtIso?: string | null
  postedBy?: string | null
  totalDebitMinor: number
  totalCreditMinor: number
  lineCount: number
  createdAtIso: string
  updatedAtIso: string
  version: number
  lines?: JournalLineDto[]
}

export type AccountingPeriodDto = {
  id: string
  periodKey: string
  periodType: PeriodType
  startDateIso: string
  endDateIso: string
  status: PeriodStatus
  closedAtIso?: string | null
  closedBy?: string | null
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type JournalListQueryDto = {
  search?: string
  postingStatus?: string
  fromDateIso?: string
  toDateIso?: string
  limit?: number
}

export type AccountingPeriodVersionInputDto = {
  periodId: string
  version: number
  actor: string
}
