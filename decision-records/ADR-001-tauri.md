# ADR-001: Tauri as the Desktop Application Platform

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-002 (SQLite), ADR-006 (Offline-first) |

---

## Context

FuelERP is an enterprise desktop ERP for petrol pumps. It must run reliably on Windows workstations at fuel stations — often on modest hardware, with intermittent power and no guaranteed internet connectivity.

The system requires:

- A native desktop shell with filesystem and local database access
- A modern UI capable of complex business workflows
- A security boundary between UI code and durable infrastructure (SQLite, backups, file storage)
- A small install footprint suitable for single-station deployments
- Long-term maintainability (10+ year product lifecycle)

Alternatives considered: Electron, .NET WPF/WinUI, pure web app (PWA), Flutter desktop.

---

## Decision

Adopt **Tauri 2** as the desktop application platform with:

- **React + TypeScript + Vite** for the presentation layer (`apps/desktop`)
- **Rust** for durable infrastructure in `src-tauri/` (SQLite, transactions, repositories, backups, file storage)
- **Tauri commands** as the typed boundary between the React frontend and the Rust backend

The React frontend must never access SQLite, the filesystem, or backup mechanics directly. All durable operations flow through Tauri command adapters that implement domain/infrastructure contracts.

---

## Consequences

### Positive

- Rust backend provides memory safety and performance for financial and inventory operations
- Tauri produces smaller binaries than Electron (~10× smaller typical footprint)
- Clear security boundary: browser-facing code cannot bypass repositories or manipulate balances
- WebView-based UI allows reuse of React ecosystem (TanStack Query, React Hook Form, Zod, Tailwind)
- Tauri plugin ecosystem supports logging, future hardware integrations

### Negative

- Team must maintain Rust and TypeScript skill sets
- Tauri command serialization adds latency vs. in-process SQLite (acceptable for ERP workflows)
- WebView rendering differs slightly across Windows versions; must test on target OS builds

### Constraints introduced

- All write operations must go through Rust services with explicit transaction boundaries
- Frontend repositories are thin adapters around `invoke()`, not direct database clients
- Backup/restore, migrations, and file storage live exclusively in `src-tauri/`

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **Electron** | Larger bundle size, higher memory use; Node.js SQLite bindings less suitable for transactional financial kernel |
| **.NET WPF** | Strong on Windows but limits future cross-platform expansion; smaller React/TypeScript talent pool for UI |
| **PWA / browser-only** | Cannot guarantee offline durability, filesystem access, or backup integrity without a native shell |
| **Flutter desktop** | Mature UI but smaller ERP ecosystem; team already committed to React/TypeScript stack |

---

## Compliance

This decision is binding per `IMPLEMENTATION_GUIDE.md` §3 (Infrastructure Layer) and `architecture/track-b-technical-architecture.md`.
