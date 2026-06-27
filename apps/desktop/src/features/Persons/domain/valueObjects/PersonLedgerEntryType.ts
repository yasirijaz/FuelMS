export const PERSON_LEDGER_ENTRY_TYPES = [
  'borrow_from_person',
  'repay_borrowed',
  'lend_to_person',
  'collect_loan_repayment',
  'credit_fuel_purchase',
  'credit_fuel_sale',
] as const

export type PersonLedgerEntryType = (typeof PERSON_LEDGER_ENTRY_TYPES)[number]

export const PERSON_LEDGER_ENTRY_TYPE_LABELS: Record<PersonLedgerEntryType, string> = {
  borrow_from_person: 'Borrow from person',
  repay_borrowed: 'Repay borrowed',
  lend_to_person: 'Lend to person',
  collect_loan_repayment: 'Collect loan repayment',
  credit_fuel_purchase: 'Credit fuel purchase',
  credit_fuel_sale: 'Credit fuel sale',
}

export function isPersonLedgerEntryType(value: string): value is PersonLedgerEntryType {
  return (PERSON_LEDGER_ENTRY_TYPES as readonly string[]).includes(value)
}

export function personLedgerEntryTypeLabel(type: PersonLedgerEntryType): string {
  return PERSON_LEDGER_ENTRY_TYPE_LABELS[type]
}
