-- Migration 003: Business Partner Engine
--
-- Scope: partner identity, contact details, and role assignments only.
-- Does NOT include accounting, ledgers, purchases, sales, or financial balances.
--
-- Design principles (Business Partner Engine + track-b persistence conventions):
--   - Generic partner model: one partner may hold multiple roles (customer, supplier, etc.)
--   - Roles live in a separate table; partner identity is role-agnostic
--   - is_active controls whether the partner appears in operational pickers
--   - deleted_at is soft-delete for archival; distinct from deactivation
--   - Optimistic concurrency via version on business_partners
--   - Amounts and balances are NOT stored here (Accounting / Ledgers own those later)
--
-- Application-layer invariants (enforced in domain + services, not all in SQL):
--   - display_name is required and non-blank after trim
--   - An active partner must have at least one role
--   - Cannot assign the same role twice to one partner (DB unique index)
--   - Cannot remove the last role from an active partner
--   - Deactivated partners retain roles for audit and future transaction linkage

-- ─── Business partners (aggregate root) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_partners (
  id              TEXT    PRIMARY KEY,
  display_name    TEXT    NOT NULL CHECK (length(trim(display_name)) > 0),
  legal_name      TEXT    NULL,
  phone           TEXT    NULL,
  email           TEXT    NULL,
  tax_id          TEXT    NULL,
  address         TEXT    NULL,
  notes           TEXT    NULL,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  deleted_at      TEXT    NULL,
  version         INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

-- List/search by name (primary operator workflow).
CREATE INDEX IF NOT EXISTS idx_business_partners_display_name
  ON business_partners(display_name COLLATE NOCASE);

-- Filter active partners for pickers and default list views.
CREATE INDEX IF NOT EXISTS idx_business_partners_active_name
  ON business_partners(is_active, display_name COLLATE NOCASE)
  WHERE deleted_at IS NULL;

-- Optional lookup fields used in search.
CREATE INDEX IF NOT EXISTS idx_business_partners_phone
  ON business_partners(phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_partners_tax_id
  ON business_partners(tax_id)
  WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

-- ─── Partner roles (child collection; one partner → many roles) ──────────────
--
-- role_code values align with Persons & Ledgers bounded context (ADR-004):
--   customer, supplier, employee, owner, other
--
-- A partner may combine roles (e.g. supplier + customer for a fleet operator).

CREATE TABLE IF NOT EXISTS partner_roles (
  id              TEXT    PRIMARY KEY,
  partner_id      TEXT    NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
  role_code       TEXT    NOT NULL CHECK (role_code IN ('customer', 'supplier', 'employee', 'owner', 'other')),
  assigned_at     TEXT    NOT NULL,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  UNIQUE (partner_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_roles_partner
  ON partner_roles(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_roles_role
  ON partner_roles(role_code);

-- Filter partners by role in list/search (e.g. show all suppliers).
CREATE INDEX IF NOT EXISTS idx_partner_roles_role_partner
  ON partner_roles(role_code, partner_id);
