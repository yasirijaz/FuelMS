# ADR-006: Offline-First as the Version 1 Deployment Model

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-001 (Tauri), ADR-002 (SQLite) |

---

## Context

Petrol pump operations run in environments where:

- Internet connectivity is unreliable or absent
- Power interruptions are common during busy shifts
- Business cannot stop because a cloud service is unreachable
- Owners need immediate access to stock, cash, and sales data at the station

FuelERP Version 1 serves a **single offline station**. Cloud sync, multi-branch, and mobile access are future capabilities — not Version 1 assumptions.

---

## Decision

Design and implement FuelERP Version 1 as **offline-first**:

- All business data lives locally in SQLite on the workstation
- No network call is required for any routine operation (sales, purchases, expenses, reports, backup)
- The local database is the **authoritative system of record** for Version 1
- UI state (TanStack Query cache, Zustand) is never treated as durable business truth

### Offline-first principles

| Principle | Implementation |
| --- | --- |
| **Local authority** | SQLite at Tauri app-data scope is the source of truth |
| **No cloud dependency** | No feature blocks on network availability in V1 |
| **Atomic local writes** | Financial + inventory + events commit in one SQLite transaction |
| **Local backup** | Backup/restore operates on local database + file store without cloud |
| **Stable identities** | UUIDs on all aggregates enable future sync without ID remapping |
| **Event outbox** | `outbox_events` table records domain events for audit and future replication |

### What "offline-first" does NOT mean

- It does not mean "never sync." Future cloud sync is anticipated but not implemented in V1
- It does not mean "no network ever." Software updates and optional future integrations may use network
- It does not mean "local-only UI state is fine." Cached query results must be refreshed from repositories

### Future-readiness constraints (without implementing sync now)

- Use stable UUID identities on all aggregates
- Raise domain events for meaningful mutations
- Design idempotent business operations where possible
- Keep clear data ownership per bounded context
- Avoid hard-coded single-branch assumptions in domain rules where branch context may later matter

---

## Consequences

### Positive

- Station operates 24/7 regardless of ISP reliability
- Sub-millisecond local queries for sales entry and daily reports
- Simple deployment: install desktop app, no server infrastructure
- Backup is a local file operation the owner controls
- Architecture supports future sync layer without rewriting domain rules

### Negative

- No real-time multi-station visibility in V1
- Backup responsibility falls on the station owner (must be guided by UX)
- Conflict resolution for future multi-device sync is deferred (must be designed carefully later)

### Constraints introduced

- Do not introduce cloud assumptions into V1 offline workflows
- Do not store authoritative balances in global UI state (Zustand)
- Do not treat cached TanStack Query results as source of truth
- All durability goes through repositories and Unit of Work

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **Cloud-first with offline cache** | Unacceptable for V1: station cannot depend on connectivity for sales or stock checks |
| **Hybrid (online required for reports)** | Violates offline reality; owners review daily reports at shift end without guaranteed internet |
| **Peer-to-peer sync in V1** | Scope creep; adds conflict resolution complexity before core business rules are proven |

---

## Compliance

Binding per Vision document, `PROJECT_PRINCIPLES.md` §4, `IMPLEMENTATION_GUIDE.md` §22, and `AI_DEVELOPMENT_PROTOCOL.md` §7.
