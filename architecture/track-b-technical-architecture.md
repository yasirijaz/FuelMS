# Track B - Technical Architecture

FuelMS is a local-first Tauri application. Durable infrastructure should live in the Rust backend, while the React frontend should consume typed commands through feature services and repository contracts. This keeps SQLite, filesystem, backups, and transaction behavior outside browser-facing code.

## Physical SQLite Schema

Use one application database at Tauri app data scope, for example `FuelMS/fuelms.sqlite3`.

Baseline database settings:

- `PRAGMA foreign_keys = ON`
- `PRAGMA journal_mode = WAL`
- `PRAGMA synchronous = NORMAL`
- `PRAGMA busy_timeout = 5000`

Recommended shared columns:

- `id TEXT PRIMARY KEY`: stable UUID or ULID.
- `created_at TEXT NOT NULL`: UTC ISO-8601 timestamp.
- `updated_at TEXT NOT NULL`: UTC ISO-8601 timestamp.
- `deleted_at TEXT NULL`: soft delete marker for business records.
- `version INTEGER NOT NULL DEFAULT 1`: optimistic concurrency token.

Core tables:

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE persons (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('customer', 'supplier', 'employee', 'owner', 'other')),
  display_name TEXT NOT NULL,
  phone TEXT NULL,
  email TEXT NULL,
  tax_id TEXT NULL,
  notes TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id TEXT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  memo TEXT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE ledger_lines (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  debit_minor INTEGER NOT NULL DEFAULT 0,
  credit_minor INTEGER NOT NULL DEFAULT 0,
  CHECK (debit_minor >= 0),
  CHECK (credit_minor >= 0),
  CHECK ((debit_minor = 0 AND credit_minor > 0) OR (credit_minor = 0 AND debit_minor > 0))
);

CREATE TABLE fuel_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'liter',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES fuel_products(id),
  occurred_at TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity_milliunits INTEGER NOT NULL,
  unit_cost_minor INTEGER NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE stored_files (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  content_type TEXT NULL,
  byte_size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  processed_at TEXT NULL
);

CREATE INDEX idx_persons_display_name ON persons(display_name);
CREATE INDEX idx_ledger_entries_source ON ledger_entries(source_type, source_id);
CREATE INDEX idx_ledger_lines_entry_id ON ledger_lines(entry_id);
CREATE INDEX idx_inventory_movements_product_time ON inventory_movements(product_id, occurred_at);
CREATE INDEX idx_outbox_events_unprocessed ON outbox_events(processed_at, occurred_at);
```

Feature migrations can add narrower tables later, but every mutation that affects money or inventory should produce auditable ledger, inventory, and outbox rows in the same transaction.

## Repository Contracts

Repository interfaces should model persistence operations, not UI workflows. Keep them small and aggregate-oriented.

Frontend contracts:

- `src/shared/contracts/repositories.ts`: shared result, pagination, and concurrency types.
- `src/features/<Feature>/domain/*.ts`: feature entities and command/query DTOs.
- `src/features/<Feature>/data/*Repository.ts`: Tauri-backed repository implementations.

Backend contracts:

- `src-tauri/src/db`: connection pool, migrations, transaction helpers.
- `src-tauri/src/repositories`: SQLite repository implementations.
- `src-tauri/src/commands`: Tauri command boundary that serializes/deserializes DTOs.

Contract rules:

- Repositories receive an executor/transaction handle, never open their own connection.
- Writes require the caller to provide expected `version` for existing records.
- Repositories return domain DTOs, not raw SQL rows.
- Soft-deleted records are excluded by default and opt-in for audit/reporting queries.

## Service Layer

Services coordinate use cases and enforce business invariants. They are the only layer that should call multiple repositories for one user action.

Recommended structure:

- `src-tauri/src/services/accounting_service.rs`
- `src-tauri/src/services/fuel_service.rs`
- `src-tauri/src/services/inventory_service.rs`
- `src-tauri/src/services/person_service.rs`
- `src-tauri/src/services/backup_service.rs`
- `src-tauri/src/services/file_storage_service.rs`

Service rules:

- Validate command DTOs before starting expensive work.
- Start one unit of work per user command.
- Call repositories through the unit of work.
- Append domain events before commit.
- Return read models that match frontend needs.

The React side may still have feature services, but those should be thin adapters around `invoke` and React Query cache behavior.

## Unit Of Work

The unit of work owns one SQLite transaction and the repositories bound to it.

Responsibilities:

- Begin transaction.
- Expose repositories using the same transaction handle.
- Collect local domain events.
- Commit database changes atomically.
- Roll back on any error.

Rust sketch:

```rust
pub struct UnitOfWork<'a> {
  tx: sqlx::Transaction<'a, sqlx::Sqlite>,
  events: Vec<DomainEvent>,
}

impl<'a> UnitOfWork<'a> {
  pub fn persons(&mut self) -> PersonRepository<'_, sqlx::Sqlite> {
    PersonRepository::new(&mut self.tx)
  }

  pub fn push_event(&mut self, event: DomainEvent) {
    self.events.push(event);
  }

  pub async fn commit(mut self) -> Result<(), AppError> {
    OutboxRepository::new(&mut self.tx).append_many(&self.events).await?;
    self.tx.commit().await?;
    Ok(())
  }
}
```

## Transaction Manager

The transaction manager is a small wrapper around the database pool. It centralizes retry behavior, transaction mode, and error mapping.

Behavior:

- Use `BEGIN IMMEDIATE` for write commands to avoid late write-lock failures.
- Use normal read connections for pure queries.
- Map SQLite constraint errors into typed application errors.
- Keep transactions short; do not perform filesystem copy or backup compression while holding a DB transaction unless the file metadata and file move must be atomic.

Recommended API:

```rust
pub async fn write<T, F, Fut>(&self, operation: F) -> Result<T, AppError>
where
  F: FnOnce(UnitOfWork<'_>) -> Fut,
  Fut: Future<Output = Result<T, AppError>>;
```

## Backup Engine

Backups should create a consistent snapshot of the SQLite database and managed file store.

Backup layout:

```text
backup-2026-06-26T03-15-00Z.fuelms-backup/
  manifest.json
  fuelms.sqlite3
  files/
    <sha256-prefix>/<sha256>
```

Manifest fields:

- `app_version`
- `schema_version`
- `created_at`
- `database_sha256`
- `file_count`
- `files_sha256`

Backup rules:

- Use SQLite backup API or `VACUUM INTO` for database snapshot consistency.
- Include only files referenced by `stored_files`.
- Write backup to a temporary location, verify checksums, then move into final destination.
- Restore must validate manifest, schema compatibility, database integrity, and file hashes before replacing active data.

## File Storage

Store binary attachments outside SQLite and track metadata in `stored_files`.

Storage root:

```text
<app-data>/files/
  ab/
    abcdef...sha256
```

Write flow:

1. Copy the source file to a temporary path under app data.
2. Stream and hash the file.
3. Move it to content-addressed storage by SHA-256.
4. Insert `stored_files` metadata in SQLite.
5. Link the file id from feature tables as needed.

Deletion should be logical first. Physical garbage collection can remove unreferenced files after a retention window.

## Local Event Store

Use `outbox_events` as the local event store for audit-friendly domain events and future integrations.

Event examples:

- `person.created`
- `ledger.entry.posted`
- `fuel.purchase.recorded`
- `inventory.movement.recorded`
- `backup.created`

Rules:

- Events are inserted in the same transaction as the state change.
- Payloads are JSON DTOs with stable field names.
- Event consumers must be idempotent.
- Processed events get `processed_at`; historical events are not deleted by default.

## Recommended Implementation Order

1. Add Rust persistence dependencies and database bootstrap.
2. Implement migrations and schema version tracking.
3. Add transaction manager and unit of work.
4. Implement repository contracts for one vertical slice, preferably `persons`.
5. Add service and Tauri commands for that slice.
6. Add file storage primitives.
7. Add outbox event writes to mutating services.
8. Add backup and restore engine after schema and file storage stabilize.
