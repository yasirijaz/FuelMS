# ADR-002: SQLite as the Version 1 Persistence Engine

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-001 (Tauri), ADR-006 (Offline-first), ADR-007 (Double-entry accounting) |

---

## Context

FuelERP Version 1 is a single-station, offline-first desktop application. It must store all business data locally: fuel inventory, sales, expenses, journals, person ledgers, cash accounts, audit history, and file attachments metadata.

Requirements:

- Zero network dependency for normal operation
- ACID transactions for atomic financial + inventory + event writes
- Single-file database suitable for backup/restore
- Proven reliability for embedded and desktop workloads
- Hidden behind repository abstractions so a future database or sync layer can replace it without rewriting domain rules

Alternatives considered: PostgreSQL (local), IndexedDB, embedded LevelDB, flat files.

---

## Decision

Use **SQLite** as the sole persistence engine for Version 1, accessed exclusively from the **Tauri Rust backend**.

### Database location

One application database at Tauri app-data scope: `FuelMS/fuelms.sqlite3`.

### Baseline PRAGMA settings

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

### Access rules

- SQLite is **never** accessed from React, Zustand, or TanStack Query code
- All reads and writes go through **repository implementations** in `src-tauri/src/repositories/`
- Repositories receive a **transaction handle**; they never open their own connection
- **Unit of Work** owns transaction boundaries; application services coordinate multi-repository writes
- Mutations affecting money or inventory produce auditable ledger, inventory, and outbox rows in the **same transaction**

### Shared column conventions

| Column | Purpose |
| --- | --- |
| `id TEXT PRIMARY KEY` | Stable UUID |
| `created_at TEXT NOT NULL` | UTC ISO-8601 |
| `updated_at TEXT NOT NULL` | UTC ISO-8601 |
| `deleted_at TEXT NULL` | Soft delete marker |
| `version INTEGER NOT NULL DEFAULT 1` | Optimistic concurrency token |

---

## Consequences

### Positive

- Single-file database simplifies backup (`VACUUM INTO` / SQLite backup API)
- WAL mode supports concurrent reads during writes (reports while sales are recorded)
- Foreign keys enforce referential integrity at persistence level
- Repository pattern keeps domain logic persistence-agnostic
- `outbox_events` table supports event store and future sync

### Negative

- Write concurrency limited to one writer (acceptable for single-station V1)
- No built-in replication; cloud sync requires a future sync layer
- Schema migrations must be versioned and tested carefully

### Constraints introduced

- `BEGIN IMMEDIATE` for write commands to avoid late write-lock failures
- Transactions must stay short; no filesystem/backup work inside open DB transactions unless atomicity requires it
- SQLite constraint errors must be mapped to business-readable application errors before UI exposure

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **PostgreSQL (local)** | Requires separate server process; overkill for single-station offline V1 |
| **IndexedDB** | No ACID multi-table transactions suitable for financial kernel; browser-only access violates Tauri boundary |
| **Flat files / JSON** | No transactional guarantees; unacceptable for financial system of record |
| **DuckDB** | Less mature embedded-desktop ecosystem; SQLite has stronger backup/portability story |

---

## Compliance

Binding per `AI_DEVELOPMENT_PROTOCOL.md` §7 (SQLite Rules), `IMPLEMENTATION_GUIDE.md` §2, and `architecture/track-b-technical-architecture.md`.
