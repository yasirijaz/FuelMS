import type { AccountType } from '../valueObjects/AccountType'
import type { NormalBalance } from '../valueObjects/NormalBalance'

export type LedgerAccountId = string & { readonly __brand: 'LedgerAccountId' }
export const LedgerAccountId = {
  fromPersisted(value: string): LedgerAccountId {
    return value as LedgerAccountId
  },
  toString(id: LedgerAccountId): string {
    return id
  },
}

export type LedgerAccount = {
  id: LedgerAccountId
  code: string
  name: string
  accountType: AccountType
  parentId?: string
  isSystem: boolean
  isActive: boolean
  normalBalance: NormalBalance
  displayOrder: number
  notes?: string
  balanceMinor: number
  createdAt: Date
  updatedAt: Date
  version: number
}
