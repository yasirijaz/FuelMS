-- Repair migration for databases that reached schema v10+ before migration 004 existed.
-- Idempotent: safe to run on fresh and already-migrated databases.

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  active_organization_id TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT NULL,
  address TEXT NULL,
  city TEXT NULL,
  phone TEXT NULL,
  tax_id TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations (status);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations (name);

INSERT OR IGNORE INTO workspaces (id, name, active_organization_id, created_at, updated_at, version)
VALUES ('workspace-default', 'Default Workspace', NULL, datetime('now'), datetime('now'), 1);
