-- Migration 009: Operating expenses and non-fuel income
--
-- Scope: record operating costs and other business income.
-- Paid/received entries update cash_accounts balances atomically.
-- Does NOT post accounting journals (deferred to Accounting kernel).
-- Fuel sales revenue remains owned by the Sales module only.

CREATE TABLE IF NOT EXISTS operating_expenses (
  id                  TEXT    PRIMARY KEY,
  expense_date        TEXT    NOT NULL,
  category_code       TEXT    NOT NULL CHECK (category_code IN (
                        'maintenance', 'electricity', 'salary', 'generator',
                        'transport', 'stationery', 'vehicle_repair', 'other'
                      )),
  amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
  payment_status      TEXT    NOT NULL CHECK (payment_status IN ('paid', 'credit')),
  payee_name          TEXT    NOT NULL CHECK (length(trim(payee_name)) > 0),
  cash_account_id     TEXT    NULL REFERENCES cash_accounts(id) ON DELETE RESTRICT,
  reference           TEXT    NULL,
  notes               TEXT    NULL,
  status              TEXT    NOT NULL CHECK (status IN ('posted', 'void')) DEFAULT 'posted',
  recorded_by         TEXT    NOT NULL,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (
    (payment_status = 'paid' AND cash_account_id IS NOT NULL)
    OR (payment_status = 'credit' AND cash_account_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_operating_expenses_date
  ON operating_expenses(expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_operating_expenses_status
  ON operating_expenses(status, expense_date DESC);

CREATE TABLE IF NOT EXISTS operating_income (
  id                  TEXT    PRIMARY KEY,
  income_date         TEXT    NOT NULL,
  category_code       TEXT    NOT NULL CHECK (category_code IN (
                        'rent', 'property', 'commission', 'service', 'other'
                      )),
  amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
  payment_status      TEXT    NOT NULL CHECK (payment_status IN ('received', 'credit')),
  source_name         TEXT    NOT NULL CHECK (length(trim(source_name)) > 0),
  cash_account_id     TEXT    NULL REFERENCES cash_accounts(id) ON DELETE RESTRICT,
  reference           TEXT    NULL,
  notes               TEXT    NULL,
  status              TEXT    NOT NULL CHECK (status IN ('posted', 'void')) DEFAULT 'posted',
  recorded_by         TEXT    NOT NULL,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (
    (payment_status = 'received' AND cash_account_id IS NOT NULL)
    OR (payment_status = 'credit' AND cash_account_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_operating_income_date
  ON operating_income(income_date DESC);

CREATE INDEX IF NOT EXISTS idx_operating_income_status
  ON operating_income(status, income_date DESC);
