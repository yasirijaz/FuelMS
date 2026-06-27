-- Migration 008: Cash accounts and internal transfers
--
-- Scope: money location balances and transfer audit trail.
-- Does NOT post accounting journals (deferred to Accounting kernel).
-- Transfers redistribute balances only — no profit impact.

CREATE TABLE IF NOT EXISTS cash_accounts (
  id                TEXT    PRIMARY KEY,
  name              TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  account_type      TEXT    NOT NULL CHECK (account_type IN ('drawer', 'bank', 'safe', 'mobile_wallet', 'other')),
  balance_minor     INTEGER NOT NULL DEFAULT 0 CHECK (balance_minor >= 0),
  is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  display_order     INTEGER NOT NULL DEFAULT 0,
  notes             TEXT    NULL,
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_cash_accounts_active
  ON cash_accounts(is_active, display_order ASC);

CREATE TABLE IF NOT EXISTS cash_transfers (
  id                  TEXT    PRIMARY KEY,
  from_account_id     TEXT    NOT NULL REFERENCES cash_accounts(id) ON DELETE RESTRICT,
  to_account_id       TEXT    NOT NULL REFERENCES cash_accounts(id) ON DELETE RESTRICT,
  amount_minor        INTEGER NOT NULL CHECK (amount_minor > 0),
  transferred_at      TEXT    NOT NULL,
  reference           TEXT    NULL,
  notes               TEXT    NULL,
  recorded_by         TEXT    NOT NULL,
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL,
  version             INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (from_account_id != to_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cash_transfers_at
  ON cash_transfers(transferred_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_transfers_from
  ON cash_transfers(from_account_id, transferred_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_transfers_to
  ON cash_transfers(to_account_id, transferred_at DESC);

INSERT OR IGNORE INTO cash_accounts
  (id, name, account_type, balance_minor, is_active, display_order, created_at, updated_at, version)
VALUES
  ('cash-drawer-main', 'Cash Drawer', 'drawer', 0, 1, 1, datetime('now'), datetime('now'), 1),
  ('cash-bank-main',   'Bank',        'bank',   0, 1, 2, datetime('now'), datetime('now'), 1),
  ('cash-safe-main',   'Safe',        'safe',   0, 1, 3, datetime('now'), datetime('now'), 1);
