# ADR-003: Clean Architecture with Strict Layer Boundaries

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-004 (DDD), ADR-008 (Plugin architecture) |

---

## Context

FuelERP is a financial operating system, not a CRUD application. Business rules for accounting, inventory, cash, and ledgers must remain correct, testable, and independent of UI frameworks and persistence technology for 10+ years.

Without enforced layer boundaries, ERP systems accumulate:

- Accounting calculations inside React components
- Duplicated business rules across features
- Direct database access from UI code
- Untestable logic coupled to SQLite or Tauri APIs

---

## Decision

Adopt **Clean Architecture** with four layers per feature module and strict dependency direction.

### Layer responsibilities

| Layer | Owns | Must NOT |
| --- | --- | --- |
| **Presentation** | Pages, forms, tables, loading states, user feedback | Business rules, accounting, inventory valuation, SQLite access |
| **Application** | Use-case orchestration, transaction boundaries, command/query mapping | UI rendering, persistence implementation |
| **Domain** | Entities, value objects, aggregates, invariants, domain events | React, SQLite, Tauri, HTTP |
| **Infrastructure** | Repository implementations, Tauri adapters, file storage, backups | Business rule invention |

### Dependency direction (allowed)

```text
Presentation → Application → Domain
Infrastructure → Application / Domain contracts
```

### Dependency direction (forbidden)

```text
Domain → Application | Presentation | Infrastructure
Application → Presentation
UI → SQLite
Repository → UI
```

### Feature module structure

Every business feature follows:

```text
Feature/
  application/
  domain/
  infrastructure/
  presentation/
```

Current features: Accounting, Fuel, Inventory, Expenses, Income, Persons, Reports, Settings.

### Platform packages (shared building blocks)

Generic, framework-free primitives live in workspace packages — not in feature folders:

| Package | Layer equivalent |
| --- | --- |
| `@fuelms/core` | Cross-cutting primitives (Result, errors, Logger) |
| `@fuelms/domain` | DDD building blocks (Entity, AggregateRoot, ValueObject) |
| `@fuelms/infrastructure` | Infrastructure contracts (IUnitOfWork, IEventBus) |
| `@fuelms/testing` | Test doubles (devDependency only) |

---

## Consequences

### Positive

- Domain rules are unit-testable without React or SQLite
- UI can be redesigned without touching business logic
- Persistence can be replaced (cloud DB, sync) without rewriting domain
- New features follow a repeatable, reviewable structure
- AI and human contributors have an unambiguous place for every piece of code

### Negative

- More folders and indirection than a simple CRUD app
- Requires discipline during code review to prevent boundary violations
- Thin adapter layers (Tauri invoke wrappers) add boilerplate

### Permanent rules

- UI never contains business logic
- Repositories never contain UI logic
- Business logic never depends on React
- Reporting is read-only
- Historical posted data is immutable (corrected via reversals, not silent edits)

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **MVC / feature-only folders** | No enforcement of dependency direction; business logic drifts into controllers/components |
| **Transaction Script** | Acceptable for prototypes; fails at ERP scale when rules multiply and duplicate |
| **Hexagonal-only (no feature modules)** | Loses business-domain grouping; Fuel and Accounting rules become scattered |

---

## Compliance

Binding per `IMPLEMENTATION_GUIDE.md` §3, `AI_DEVELOPMENT_PROTOCOL.md` §3, and `ENGINEERING_STANDARDS.md`.
