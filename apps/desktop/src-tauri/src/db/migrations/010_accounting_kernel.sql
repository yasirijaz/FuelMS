-- Migration 010: Accounting kernel — chart of accounts, journals, period controls
--
-- Scope: double-entry ledger foundation for automatic posting from business modules.
-- Does NOT retroactively post existing purchases/sales/expenses (integration follows).
--
-- Design principles (ADR-007 + Financial Posting Matrix):
--   - Every posted journal balances: total debits = total credits
--   - Posted journals are immutable — corrections use reversals (future)
--   - Closed accounting periods block new postings
--   - Amounts in integer minor units (paisa)

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id              TEXT    PRIMARY KEY,
  code            TEXT    NOT NULL UNIQUE CHECK (length(trim(code)) > 0),
  name            TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  account_type    TEXT    NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id       TEXT    NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  is_system       INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  normal_balance  TEXT    NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  display_order   INTEGER NOT NULL DEFAULT 0,
  notes           TEXT    NULL,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_type
  ON ledger_accounts(account_type, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_parent
  ON ledger_accounts(parent_id);

CREATE TABLE IF NOT EXISTS journal_entries (
  id              TEXT    PRIMARY KEY,
  entry_date      TEXT    NOT NULL,
  memo            TEXT    NULL,
  source_type     TEXT    NOT NULL CHECK (length(trim(source_type)) > 0),
  source_id       TEXT    NOT NULL CHECK (length(trim(source_id)) > 0),
  posting_status  TEXT    NOT NULL CHECK (posting_status IN ('draft', 'posted', 'reversed', 'void')),
  posted_at       TEXT    NULL,
  posted_by       TEXT    NULL,
  reversed_at     TEXT    NULL,
  reversed_by     TEXT    NULL,
  reversal_of_id  TEXT    NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date
  ON journal_entries(entry_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_source
  ON journal_entries(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_status
  ON journal_entries(posting_status, entry_date DESC);

CREATE TABLE IF NOT EXISTS journal_lines (
  id            TEXT    PRIMARY KEY,
  entry_id      TEXT    NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id    TEXT    NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  line_memo     TEXT    NULL,
  debit_minor   INTEGER NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor  INTEGER NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  CHECK ((debit_minor = 0 AND credit_minor > 0) OR (credit_minor = 0 AND debit_minor > 0))
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry
  ON journal_lines(entry_id);

CREATE INDEX IF NOT EXISTS idx_journal_lines_account
  ON journal_lines(account_id);

CREATE TABLE IF NOT EXISTS accounting_periods (
  id           TEXT    PRIMARY KEY,
  period_key   TEXT    NOT NULL UNIQUE CHECK (length(trim(period_key)) > 0),
  period_type  TEXT    NOT NULL CHECK (period_type IN ('month')),
  start_date   TEXT    NOT NULL,
  end_date     TEXT    NOT NULL,
  status       TEXT    NOT NULL CHECK (status IN ('open', 'closed')),
  closed_at    TEXT    NULL,
  closed_by    TEXT    NULL,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_accounting_periods_status
  ON accounting_periods(status, start_date DESC);

-- Seed chart of accounts for petrol pump operations
INSERT OR IGNORE INTO ledger_accounts
  (id, code, name, account_type, parent_id, is_system, is_active, normal_balance, display_order, created_at, updated_at, version)
VALUES
  ('la-root-assets',      '1000', 'Assets',                  'asset',     NULL,               1, 1, 'debit',  100, datetime('now'), datetime('now'), 1),
  ('la-cash-drawer',      '1100', 'Cash Drawer',             'asset',     'la-root-assets',   1, 1, 'debit',  110, datetime('now'), datetime('now'), 1),
  ('la-bank',             '1110', 'Bank',                    'asset',     'la-root-assets',   1, 1, 'debit',  111, datetime('now'), datetime('now'), 1),
  ('la-safe',             '1120', 'Safe',                    'asset',     'la-root-assets',   1, 1, 'debit',  112, datetime('now'), datetime('now'), 1),
  ('la-receivable',       '1200', 'Accounts Receivable',     'asset',     'la-root-assets',   1, 1, 'debit',  120, datetime('now'), datetime('now'), 1),
  ('la-fuel-inventory',   '1300', 'Fuel Inventory',          'asset',     'la-root-assets',   1, 1, 'debit',  130, datetime('now'), datetime('now'), 1),

  ('la-root-liabilities', '2000', 'Liabilities',             'liability', NULL,               1, 1, 'credit', 200, datetime('now'), datetime('now'), 1),
  ('la-payable',          '2100', 'Accounts Payable',        'liability', 'la-root-liabilities', 1, 1, 'credit', 210, datetime('now'), datetime('now'), 1),
  ('la-loans',            '2200', 'Loans Payable',         'liability', 'la-root-liabilities', 1, 1, 'credit', 220, datetime('now'), datetime('now'), 1),

  ('la-root-equity',      '3000', 'Owner Equity',            'equity',    NULL,               1, 1, 'credit', 300, datetime('now'), datetime('now'), 1),
  ('la-owner-drawings',   '3100', 'Owner Drawings',          'equity',    'la-root-equity',   1, 1, 'debit',  310, datetime('now'), datetime('now'), 1),

  ('la-root-income',      '4000', 'Income',                  'income',    NULL,               1, 1, 'credit', 400, datetime('now'), datetime('now'), 1),
  ('la-fuel-sales',       '4100', 'Fuel Sales Revenue',      'income',    'la-root-income',   1, 1, 'credit', 410, datetime('now'), datetime('now'), 1),
  ('la-rent-income',      '4200', 'Rent Income',             'income',    'la-root-income',   1, 1, 'credit', 420, datetime('now'), datetime('now'), 1),
  ('la-property-income',  '4300', 'Property Income',         'income',    'la-root-income',   1, 1, 'credit', 430, datetime('now'), datetime('now'), 1),
  ('la-commission-income','4400', 'Commission Income',       'income',    'la-root-income',   1, 1, 'credit', 440, datetime('now'), datetime('now'), 1),
  ('la-service-income',   '4500', 'Service Income',          'income',    'la-root-income',   1, 1, 'credit', 450, datetime('now'), datetime('now'), 1),
  ('la-other-income',     '4600', 'Other Income',            'income',    'la-root-income',   1, 1, 'credit', 460, datetime('now'), datetime('now'), 1),

  ('la-root-expenses',    '5000', 'Expenses',                'expense',   NULL,               1, 1, 'debit',  500, datetime('now'), datetime('now'), 1),
  ('la-cogs',             '5100', 'Cost of Goods Sold',      'expense',   'la-root-expenses', 1, 1, 'debit',  510, datetime('now'), datetime('now'), 1),
  ('la-maint-expense',    '5200', 'Maintenance Expense',     'expense',   'la-root-expenses', 1, 1, 'debit',  520, datetime('now'), datetime('now'), 1),
  ('la-elec-expense',     '5300', 'Electricity Expense',     'expense',   'la-root-expenses', 1, 1, 'debit',  530, datetime('now'), datetime('now'), 1),
  ('la-salary-expense',   '5400', 'Salary Expense',          'expense',   'la-root-expenses', 1, 1, 'debit',  540, datetime('now'), datetime('now'), 1),
  ('la-gen-expense',      '5500', 'Generator Expense',       'expense',   'la-root-expenses', 1, 1, 'debit',  550, datetime('now'), datetime('now'), 1),
  ('la-transport-expense','5600', 'Transport Expense',       'expense',   'la-root-expenses', 1, 1, 'debit',  560, datetime('now'), datetime('now'), 1),
  ('la-stationery-expense','5700','Stationery Expense',      'expense',   'la-root-expenses', 1, 1, 'debit',  570, datetime('now'), datetime('now'), 1),
  ('la-vehicle-expense',  '5800', 'Vehicle Repair Expense',  'expense',   'la-root-expenses', 1, 1, 'debit',  580, datetime('now'), datetime('now'), 1),
  ('la-other-expense',    '5900', 'Other Operating Expense', 'expense',   'la-root-expenses', 1, 1, 'debit',  590, datetime('now'), datetime('now'), 1),
  ('la-inv-gain',         '6000', 'Inventory Adjustment Gain','income',   'la-root-income',   1, 1, 'credit', 600, datetime('now'), datetime('now'), 1),
  ('la-inv-loss',         '6100', 'Inventory Adjustment Loss','expense',  'la-root-expenses', 1, 1, 'debit',  610, datetime('now'), datetime('now'), 1);

-- Open the current month period (June 2026)
INSERT OR IGNORE INTO accounting_periods
  (id, period_key, period_type, start_date, end_date, status, created_at, updated_at, version)
VALUES
  ('period-2026-06', '2026-06', 'month', '2026-06-01', '2026-06-30', 'open', datetime('now'), datetime('now'), 1);
