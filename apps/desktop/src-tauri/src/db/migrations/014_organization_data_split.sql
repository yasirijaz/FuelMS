-- Migration 014: mark registry-only phase after per-organization business databases.
-- Legacy monolith business tables are migrated to organizations/{id}/business.sqlite3 at startup.

INSERT OR REPLACE INTO app_metadata (key, value, updated_at)
VALUES ('business_data_split', 'pending', datetime('now'));
