-- Migration 007: Tank configuration + dip readings
--
-- Scope: physical tank setup and dip reconciliation observations.
-- Does NOT auto-adjust book inventory from dips (reconciliation is informational).
--
-- Book stock remains owned by fuel_inventory_batches (Purchases/Sales FIFO).

CREATE TABLE IF NOT EXISTS fuel_tanks (
  id                      TEXT    PRIMARY KEY,
  name                    TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  product_id              TEXT    NOT NULL REFERENCES fuel_products(id),
  capacity_milli_litres   INTEGER NOT NULL CHECK (capacity_milli_litres > 0),
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  display_order           INTEGER NOT NULL DEFAULT 0,
  notes                   TEXT    NULL,
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_fuel_tanks_product
  ON fuel_tanks(product_id, display_order ASC);

CREATE INDEX IF NOT EXISTS idx_fuel_tanks_active
  ON fuel_tanks(is_active, display_order ASC);

CREATE TABLE IF NOT EXISTS tank_dip_readings (
  id                      TEXT    PRIMARY KEY,
  tank_id                 TEXT    NOT NULL REFERENCES fuel_tanks(id) ON DELETE RESTRICT,
  reading_at              TEXT    NOT NULL,
  quantity_milli_litres   INTEGER NOT NULL CHECK (quantity_milli_litres >= 0),
  recorded_by             TEXT    NOT NULL,
  notes                   TEXT    NULL,
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL,
  version                 INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_tank_dip_readings_tank
  ON tank_dip_readings(tank_id, reading_at DESC);

-- Default tanks (one per product) — operators can edit capacity/names later.
INSERT OR IGNORE INTO fuel_tanks
  (id, name, product_id, capacity_milli_litres, is_active, display_order, created_at, updated_at, version)
VALUES
  ('tank-petrol-main', 'Petrol Tank 1', 'fuel-product-petrol', 20000000, 1, 1, datetime('now'), datetime('now'), 1),
  ('tank-diesel-main', 'Diesel Tank 1', 'fuel-product-diesel', 30000000, 1, 2, datetime('now'), datetime('now'), 1),
  ('tank-hobc-main',   'HOBC Tank 1',   'fuel-product-hobc',   10000000, 1, 3, datetime('now'), datetime('now'), 1);
