-- Migration 012: Backup and restore audit trail
--
-- Scope: operational audit for backup, verify, and restore events.
-- Does NOT store backup file bytes — manifests live on disk under app backups/.

CREATE TABLE IF NOT EXISTS backup_audit_events (
  id              TEXT    PRIMARY KEY,
  event_type      TEXT    NOT NULL CHECK (event_type IN ('backup', 'verify', 'restore')),
  status          TEXT    NOT NULL CHECK (status IN ('completed', 'failed')),
  backup_id       TEXT    NULL,
  backup_path     TEXT    NULL,
  schema_version  INTEGER NULL,
  database_sha256 TEXT    NULL,
  message         TEXT    NULL,
  actor           TEXT    NOT NULL,
  created_at      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backup_audit_created
  ON backup_audit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_audit_backup_id
  ON backup_audit_events(backup_id, created_at DESC);
