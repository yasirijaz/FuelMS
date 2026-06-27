# ADR-008: Modular Plugin Architecture for Extensibility

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-003 (Clean Architecture), ADR-004 (DDD) |

---

## Context

FuelERP must evolve over 10+ years: new modules (branches, multi-company, hardware integration, cloud sync, AI analytics) will be added without rewriting the financial kernel, inventory engine, or core business rules.

A monolithic codebase where every feature directly imports and mutates every other feature will collapse under its own coupling. The architecture must define **extension points** where new capabilities plug in without violating existing boundaries.

This ADR defines a **modular plugin architecture** — not third-party runtime plugin loading (Version 1), but a composable system of bounded modules connected through contracts and events.

---

## Decision

Adopt a **modular plugin architecture** with defined extension points, feature modules, and a shared platform layer.

### Architecture model

```text
┌─────────────────────────────────────────────────────┐
│                  Presentation (React)                │
│   Feature pages plug into router + app shell         │
├─────────────────────────────────────────────────────┤
│              Application Services (use cases)        │
│   Each feature module owns its orchestration         │
├─────────────────────────────────────────────────────┤
│     Domain (aggregates, policies, domain events)     │
│   Bounded contexts: Fuel, Inventory, Accounting, …   │
├─────────────────────────────────────────────────────┤
│   Platform (@fuelms/core, domain, infrastructure)    │
│   Shared primitives — zero business knowledge        │
├─────────────────────────────────────────────────────┤
│   Infrastructure (repositories, Tauri, SQLite)       │
│   Swappable adapters behind domain contracts         │
└─────────────────────────────────────────────────────┘
```

### Extension points

New capabilities integrate through these contracts — never by reaching into another module's internals:

| Extension point | Purpose | Example |
| --- | --- | --- |
| **Feature module** | Self-contained business area with 4 layers | Add `Branches/` module without modifying `Fuel/` |
| **Domain events + event bus** | Cross-context reactions without direct coupling | Accounting subscribes to `fuel.purchased` |
| **Posting rule registry** | New business actions register accounting behavior | Financial Posting Matrix entry for new action |
| **Repository contract** | New aggregates get persistence without changing existing repos | `BranchRepository implements IRepository` |
| **Application service** | New use cases orchestrate domain + infra | `RecordBranchTransferService` |
| **Route registration** | New screens plug into app router | `/branches` route in feature presentation |
| **Tauri command adapter** | New backend capabilities exposed to frontend | `invoke('create_branch', …)` |
| **Tauri plugin (future)** | Hardware/OS integrations | Pump meter reader, receipt printer |

### Monorepo package structure

```text
apps/
  desktop/          ← Tauri + React shell (consumes packages)
packages/
  core/             ← Result, UniqueId, errors, Logger
  domain/           ← Entity, AggregateRoot, ValueObject, DomainEvent
  infrastructure/   ← IUnitOfWork, IEventBus contracts
  testing/          ← Test doubles (devDependency only)
  ui/               ← Shared React components (future)
  shared/           ← Legacy shared types (migrate to core over time)
```

New platform capabilities become new packages. New business capabilities become new feature modules in `apps/desktop/src/features/`.

### Module addition rules

When adding a new module:

1. Create `Feature/application|domain|infrastructure|presentation/` structure
2. Define aggregates, events, and repository contracts in domain layer
3. Register posting rules if the module has financial impact
4. Subscribe to relevant domain events from other contexts (read-only reactions)
5. Register routes in app router
6. **Never** duplicate logic owned by another domain (Accounting, Inventory, Posting)
7. **Never** mutate another context's aggregates directly

### What is NOT a plugin in Version 1

- No dynamic third-party plugin marketplace or runtime DLL loading
- No user-installable extensions
- No plugin sandboxing (all code is first-party, reviewed, and tested)

Version 1 plugins are **compile-time modules** connected through architecture contracts. Runtime plugin loading may be evaluated for hardware integrations (Tauri plugins) in a future phase.

### Future external actors

Hardware and external systems are **external actors** that produce business facts — they do not own business rules:

| Actor | Integration pattern |
| --- | --- |
| Pump meter | Tauri plugin → emits quantity reading → Fuel sale use case |
| Tank sensor | Tauri plugin → emits level reading → Tank reconciliation use case |
| Receipt printer | Tauri plugin → receives print command from application service |
| Cloud sync (future) | Reads outbox events + stable IDs → sync protocol |
| AI analytics (future) | Read-only access to reports → suggestions, never source of truth |

---

## Consequences

### Positive

- New modules (Branches, Multi-company, Hardware) can be added incrementally
- Event-driven coupling prevents spaghetti imports between features
- Platform packages (`@fuelms/core`, `@fuelms/domain`) stabilize while business modules evolve
- Posting rule registry centralizes financial behavior — one place to audit accounting impact
- Monorepo enables shared CI, linting, and type-checking across all modules

### Negative

- Compile-time modularity requires rebuild to add features (acceptable for first-party ERP)
- Event-driven flows are harder to trace than direct calls (mitigated by correlation IDs and audit logs)
- Extension point contracts must be designed carefully — breaking changes affect all consumers

### Constraints introduced

- Features communicate across boundaries via events and application services, not shared mutable state
- Platform packages remain generic — no petrol pump or accounting code in `@fuelms/core`
- Every new module must follow the same 4-layer structure and pass architecture review

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **Monolith (no module boundaries)** | Features become entangled; accounting rules duplicate across screens |
| **Microservices** | Absurd for offline single-station V1; network dependency violates offline-first |
| **Runtime plugin marketplace** | Security and testing burden too high for financial system of record in V1 |
| **Micro-frontends** | Unnecessary complexity for desktop single-process app |

---

## Compliance

Binding per `IMPLEMENTATION_GUIDE.md` §4–§5, §22 (Future Readiness), DDD bounded context rules, and EDA event ownership principles.
