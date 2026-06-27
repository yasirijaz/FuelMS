-- Organization & Workspace Engine (migration 004)
-- Every future business record must reference organizations.id.

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  active_organization_id TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE organizations (
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

CREATE INDEX idx_organizations_status ON organizations (status);
CREATE INDEX idx_organizations_name ON organizations (name);

-- V1: single workspace row bootstrapped on first migration.
INSERT INTO workspaces (id, name, active_organization_id, created_at, updated_at, version)
VALUES ('workspace-default', 'Default Workspace', NULL, datetime('now'), datetime('now'), 1);
