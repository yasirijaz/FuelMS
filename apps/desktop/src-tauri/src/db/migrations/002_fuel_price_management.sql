-- Migration 002: Fuel Price Management
--
-- Scope: selling prices for petrol, diesel, HOBC only.
-- Does NOT include purchases, sales, inventory, or accounting tables.
--
-- Design principles (Fuel Price Management spec + Business Invariants):
--   - Append-only price history; no DELETE on price records
--   - Price changes affect future sales only (sales module stores applied price separately)
--   - One active price per product at any moment (partial unique index)
--   - Scheduled prices activate at effective_from (exact UTC timestamp)
--   - Amounts stored as integer minor units (paisa per liter) — no floats
--   - is_locked set when a sale references this record (future Sales module)

-- ─── Reference data: fuel products ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fuel_products (
  id              TEXT    PRIMARY KEY,
  code            TEXT    NOT NULL UNIQUE,
  name            TEXT    NOT NULL,
  unit            TEXT    NOT NULL DEFAULT 'liter',
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1
);

-- Stable IDs for seed data — deterministic for tests and migrations.
INSERT OR IGNORE INTO fuel_products (id, code, name, unit, display_order, is_active, created_at, updated_at, version)
VALUES
  ('fuel-product-petrol', 'petrol', 'Petrol', 'liter', 1, 1, datetime('now'), datetime('now'), 1),
  ('fuel-product-diesel', 'diesel', 'Diesel', 'liter', 2, 1, datetime('now'), datetime('now'), 1),
  ('fuel-product-hobc',   'hobc',   'HOBC',   'liter', 3, 1, datetime('now'), datetime('now'), 1);

-- ─── Batch grouping for multi-product price updates (spec scenario A3) ───────

CREATE TABLE IF NOT EXISTS fuel_price_change_batches (
  id            TEXT PRIMARY KEY,
  reason        TEXT NULL,
  reference     TEXT NULL,
  recorded_by   TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

-- ─── Price records: append-only history ──────────────────────────────────────
--
-- status lifecycle:
--   scheduled  → future effective_from; editable/cancellable before activation
--   active     → currently governing sales for this product
--   superseded → replaced by a newer record; effective_to marks end of validity
--   cancelled  → scheduled record withdrawn before activation
--
-- Immutability rule (enforced in application layer + is_locked):
--   active/superseded records with is_locked=1 cannot be updated or deleted.

CREATE TABLE IF NOT EXISTS fuel_price_records (
  id                    TEXT    PRIMARY KEY,
  product_id            TEXT    NOT NULL REFERENCES fuel_products(id),
  batch_id              TEXT    NULL REFERENCES fuel_price_change_batches(id),
  price_per_litre_minor INTEGER NOT NULL CHECK (price_per_litre_minor > 0),
  effective_from        TEXT    NOT NULL,
  effective_to          TEXT    NULL,
  status                TEXT    NOT NULL CHECK (status IN ('scheduled', 'active', 'superseded', 'cancelled')),
  reason                TEXT    NULL,
  reference             TEXT    NULL,
  recorded_by           TEXT    NOT NULL,
  superseded_by_id      TEXT    NULL REFERENCES fuel_price_records(id),
  is_locked             INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  version               INTEGER NOT NULL DEFAULT 1
);

-- At most one active price per product.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fuel_price_one_active_per_product
  ON fuel_price_records(product_id)
  WHERE status = 'active';

-- Prevent duplicate scheduled records for the same product + effective moment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fuel_price_unique_scheduled_slot
  ON fuel_price_records(product_id, effective_from)
  WHERE status = 'scheduled';

-- Query patterns: current price, history by product, activation sweep.
CREATE INDEX IF NOT EXISTS idx_fuel_price_product_effective
  ON fuel_price_records(product_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_fuel_price_product_status
  ON fuel_price_records(product_id, status);

CREATE INDEX IF NOT EXISTS idx_fuel_price_batch
  ON fuel_price_records(batch_id)
  WHERE batch_id IS NOT NULL;

-- ─── Audit log for blocked or exceptional actions (spec scenario A5) ───────────

CREATE TABLE IF NOT EXISTS fuel_price_audit_log (
  id              TEXT PRIMARY KEY,
  action          TEXT NOT NULL,
  product_id      TEXT NULL REFERENCES fuel_products(id),
  price_record_id TEXT NULL REFERENCES fuel_price_records(id),
  actor_id        TEXT NOT NULL,
  detail_json     TEXT NOT NULL,
  occurred_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_price_audit_product
  ON fuel_price_audit_log(product_id, occurred_at DESC);
