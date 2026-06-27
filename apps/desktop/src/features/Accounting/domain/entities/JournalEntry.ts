import type { PostingStatus } from '@fuelms/shared'

export type JournalEntryId = string & { readonly __brand: 'JournalEntryId' }
export const JournalEntryId = {
  fromPersisted(value: string): JournalEntryId {
    return value as JournalEntryId
  },
  toString(id: JournalEntryId): string {
    return id
  },
}

export type JournalLine = {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  lineMemo?: string
  debitMinor: number
  creditMinor: number
}

export type JournalEntry = {
  id: JournalEntryId
  entryDate: Date
  memo?: string
  sourceType: string
  sourceId: string
  postingStatus: PostingStatus
  postedAt?: Date
  postedBy?: string
  totalDebitMinor: number
  totalCreditMinor: number
  lineCount: number
  createdAt: Date
  updatedAt: Date
  version: number
  lines?: JournalLine[]
}
