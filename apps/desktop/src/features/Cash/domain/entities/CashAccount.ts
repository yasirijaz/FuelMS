import type { CashAccountType } from '../valueObjects/CashAccountType'

export type CashAccountId = string & { readonly __brand: 'CashAccountId' }

export const CashAccountId = {
  fromPersisted(value: string): CashAccountId {
    return value as CashAccountId
  },
  toString(id: CashAccountId): string {
    return id
  },
}

export type CashAccount = {
  id: CashAccountId
  name: string
  accountType: CashAccountType
  balanceMinor: number
  isActive: boolean
  displayOrder: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  version: number
}

export type CashTransfer = {
  id: string
  fromAccountId: string
  fromAccountName: string
  toAccountId: string
  toAccountName: string
  amountMinor: number
  transferredAt: Date
  reference?: string
  notes?: string
  recordedBy: string
  createdAt: Date
  updatedAt: Date
  version: number
}
