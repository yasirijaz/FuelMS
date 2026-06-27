-- Migration 006: Fuel Sales + FIFO batch consumption
--
-- Scope: record fuel sales with price-at-time-of-sale and FIFO inventory consumption on post.
-- Does NOT include accounting journal entries (Accounting kernel owns posting later).
--
-- Design principles (Financial Posting Matrix + ADR-005):
--   - Selling price and COGS are frozen when the sale is posted
--   - FIFO consumption traceability via fuel_sale_batch_consumptions
--   - Negative inventory blocked at post time
--   - fuel_price_record_id links to the active price context at sale time

CREATE TABLE IF NOT EXISTS fuel_sales (
  id                          TEXT    PRIMARY KEY,
  sale_date                   TEXT    NOT NULL,
  product_id                  TEXT    NOT NULL REFERENCES fuel_products(id),
  customer_partner_id         TEXT    NULL REFERENCES business_partners(id),
  quantity_milli_litres       INTEGER NOT NULL CHECK (quantity_milli_litres > 0),
  unit_price_minor_per_litre  INTEGER NOT NULL CHECK (unit_price_minor_per_litre > 0),
  fuel_price_record_id        TEXT    NOT NULL REFERENCES fuel_price_records(id),
  total_revenue_minor         INTEGER NOT NULL CHECK (total_revenue_minor > 0),
  total_cogs_minor            INTEGER NOT NULL DEFAULT 0 CHECK (total_cogs_minor >= 0),
  payment_method              TEXT    NOT NULL CHECK (payment_method IN ('cash', 'credit', 'card')),
  reference                   TEXT    NULL,
  notes                       TEXT    NULL,
  status                      TEXT    NOT NULL CHECK (status IN ('draft', 'posted', 'void')),
  recorded_by                 TEXT    NOT NULL,
  created_at                  TEXT    NOT NULL,
  updated_at                  TEXT    NOT NULL,
  version                     INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_fuel_sales_date
  ON fuel_sales(sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_fuel_sales_status
  ON fuel_sales(status, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_fuel_sales_product
  ON fuel_sales(product_id, sale_date DESC);

CREATE TABLE IF NOT EXISTS fuel_sale_batch_consumptions (
  id                          TEXT    PRIMARY KEY,
  sale_id                     TEXT    NOT NULL REFERENCES fuel_sales(id) ON DELETE RESTRICT,
  batch_id                    TEXT    NOT NULL REFERENCES fuel_inventory_batches(id),
  quantity_milli_litres       INTEGER NOT NULL CHECK (quantity_milli_litres > 0),
  unit_cost_minor_per_litre   INTEGER NOT NULL CHECK (unit_cost_minor_per_litre > 0),
  cost_minor                  INTEGER NOT NULL CHECK (cost_minor > 0),
  created_at                  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_sale_consumptions_sale
  ON fuel_sale_batch_consumptions(sale_id);

CREATE INDEX IF NOT EXISTS idx_fuel_sale_consumptions_batch
  ON fuel_sale_batch_consumptions(batch_id);
