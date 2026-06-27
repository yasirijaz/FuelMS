-- Migration 011: Person ledger — running balances per business partner
--
-- Scope: traceable receivable/payable positions per partner (suppliers, customers, owners, family).
-- Signed balance convention (business perspective):
--   positive = partner owes the business (receivable)
--   negative = business owes the partner (payable / liability)
--
-- Does NOT post accounting journals (deferred to posting integration).
-- Cash movements for borrow/lend flows update cash_accounts atomically.

CREATE TABLE IF NOT EXISTS person_ledger_entries (
  id                    TEXT    PRIMARY KEY,
  partner_id            TEXT    NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
  entry_date            TEXT    NOT NULL,
  entry_type            TEXT    NOT NULL CHECK (entry_type IN (
                          'borrow_from_person',
                          'repay_borrowed',
                          'lend_to_person',
                          'collect_loan_repayment',
                          'credit_fuel_purchase',
                          'credit_fuel_sale'
                        )),
  signed_amount_minor     INTEGER NOT NULL CHECK (signed_amount_minor != 0),
  balance_after_minor     INTEGER NOT NULL,
  cash_account_id       TEXT    NULL REFERENCES cash_accounts(id) ON DELETE RESTRICT,
  source_type           TEXT    NOT NULL CHECK (length(trim(source_type)) > 0),
  source_id             TEXT    NOT NULL CHECK (length(trim(source_id)) > 0),
  reference             TEXT    NULL,
  notes                 TEXT    NULL,
  status                TEXT    NOT NULL CHECK (status IN ('posted', 'void')),
  recorded_by           TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  version               INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_person_ledger_partner_date
  ON person_ledger_entries(partner_id, entry_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_person_ledger_status
  ON person_ledger_entries(status, entry_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_person_ledger_source_posted
  ON person_ledger_entries(source_type, source_id)
  WHERE status = 'posted';
