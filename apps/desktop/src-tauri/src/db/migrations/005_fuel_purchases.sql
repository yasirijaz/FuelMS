-- Migration 005: Fuel Purchases + FIFO inventory batches
--
-- Scope: record fuel purchases and create traceable inventory batches on post.
-- Does NOT include accounting journal entries (Accounting kernel owns posting later).
--
-- Design principles (Financial Posting Matrix + ADR-005 FIFO):
--   - Purchase records business facts: supplier, product, quantity, rate, payment status
--   - Posting a purchase creates an inventory batch for FIFO traceability
--   - Amounts stored as integer minor units; quantities as milli-litres (3 decimal places)
--   - Historical posted purchases are immutable (status void only from draft)

CREATE TABLE IF NOT EXISTS fuel_inventory_batches (
  id                          TEXT    PRIMARY KEY,
  product_id                  TEXT    NOT NULL REFERENCES fuel_products(id),
  purchase_id                 TEXT    NULL,
  supplier_partner_id         TEXT    NULL REFERENCES business_partners(id),
  received_at                 TEXT    NOT NULL,
  quantity_milli_litres       INTEGER NOT NULL CHECK (quantity_milli_litres > 0),
  remaining_milli_litres      INTEGER NOT NULL CHECK (remaining_milli_litres >= 0),
  unit_cost_minor_per_litre   INTEGER NOT NULL CHECK (unit_cost_minor_per_litre > 0),
  created_at                  TEXT    NOT NULL,
  updated_at                  TEXT    NOT NULL,
  version                     INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_fuel_batches_product_received
  ON fuel_inventory_batches(product_id, received_at ASC);

CREATE INDEX IF NOT EXISTS idx_fuel_batches_purchase
  ON fuel_inventory_batches(purchase_id)
  WHERE purchase_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fuel_purchases (
  id                          TEXT    PRIMARY KEY,
  purchase_date               TEXT    NOT NULL,
  product_id                  TEXT    NOT NULL REFERENCES fuel_products(id),
  supplier_partner_id         TEXT    NULL REFERENCES business_partners(id),
  quantity_milli_litres       INTEGER NOT NULL CHECK (quantity_milli_litres > 0),
  unit_cost_minor_per_litre   INTEGER NOT NULL CHECK (unit_cost_minor_per_litre > 0),
  total_cost_minor            INTEGER NOT NULL CHECK (total_cost_minor > 0),
  invoice_reference           TEXT    NULL,
  payment_status              TEXT    NOT NULL CHECK (payment_status IN ('paid', 'credit')),
  notes                       TEXT    NULL,
  status                      TEXT    NOT NULL CHECK (status IN ('draft', 'posted', 'void')),
  batch_id                    TEXT    NULL REFERENCES fuel_inventory_batches(id),
  recorded_by                 TEXT    NOT NULL,
  created_at                  TEXT    NOT NULL,
  updated_at                  TEXT    NOT NULL,
  version                     INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_fuel_purchases_date
  ON fuel_purchases(purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_fuel_purchases_status
  ON fuel_purchases(status, purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_fuel_purchases_supplier
  ON fuel_purchases(supplier_partner_id)
  WHERE supplier_partner_id IS NOT NULL;
