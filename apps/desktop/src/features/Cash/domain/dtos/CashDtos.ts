import type { CashAccountType } from '../valueObjects/CashAccountType'

export type CashCommandErrorDto = {
  code: string
  message: string
  kind: string
}

export type CashCommandResult<T> = {
  ok: boolean
  value?: T
  error?: CashCommandErrorDto
}

export type CashAccountDto = {
  id: string
  name: string
  accountType: CashAccountType
  balanceMinor: number
  isActive: boolean
  displayOrder: number
  notes?: string | null
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type CashTransferDto = {
  id: string
  fromAccountId: string
  fromAccountName: string
  toAccountId: string
  toAccountName: string
  amountMinor: number
  transferredAtIso: string
  reference?: string | null
  notes?: string | null
  recordedBy: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export type CreateCashAccountInputDto = {
  name: string
  accountType: CashAccountType
  openingBalanceMinor?: number
  displayOrder?: number
  notes?: string
}

export type UpdateCashAccountInputDto = {
  id: string
  name: string
  displayOrder: number
  notes?: string
  version: number
}

export type CashAccountVersionInputDto = {
  accountId: string
  version: number
}

export type RecordCashTransferInputDto = {
  fromAccountId: string
  toAccountId: string
  amountMinor: number
  transferredAtIso: string
  reference?: string
  notes?: string
  recordedBy: string
}

export type CashTransferListQueryDto = {
  accountId?: string
  limit?: number
}
