export const PERSON_LEDGER_ENTRY_STATUSES = ['posted', 'void'] as const

export type PersonLedgerEntryStatus = (typeof PERSON_LEDGER_ENTRY_STATUSES)[number]

export function isPersonLedgerEntryStatus(value: string): value is PersonLedgerEntryStatus {
  return (PERSON_LEDGER_ENTRY_STATUSES as readonly string[]).includes(value)
}
