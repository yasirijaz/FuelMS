-- Migration 001: Migration tracking bootstrap
-- Required by ADR-002 and track-b technical architecture.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  applied_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS app_metadata (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

INSERT OR IGNORE INTO app_metadata (key, value, updated_at)
VALUES ('schema_version', '1', datetime('now'));
