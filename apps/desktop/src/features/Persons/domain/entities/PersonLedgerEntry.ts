import type { PersonLedgerEntryStatus } from '../valueObjects/PersonLedgerEntryStatus'
import type { PersonLedgerEntryType } from '../valueObjects/PersonLedgerEntryType'

export type PersonLedgerEntryId = string & { readonly __brand: 'PersonLedgerEntryId' }
export const PersonLedgerEntryId = {
  fromPersisted(value: string): PersonLedgerEntryId {
    return value as PersonLedgerEntryId
  },
  toString(id: PersonLedgerEntryId): string {
    return id
  },
}

export type PersonLedgerEntry = {
  id: PersonLedgerEntryId
  partnerId: string
  partnerName: string
  entryDate: Date
  entryType: PersonLedgerEntryType
  signedAmountMinor: number
  balanceAfterMinor: number
  cashAccountId?: string
  cashAccountName?: string
  sourceType: string
  sourceId: string
  reference?: string
  notes?: string
  status: PersonLedgerEntryStatus
  recordedBy: string
  createdAt: Date
  updatedAt: Date
  version: number
}
