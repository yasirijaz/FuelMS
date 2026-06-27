# ADR-004: Domain-Driven Design as the Business Modeling Approach

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-003 (Clean Architecture), ADR-005 (FIFO), ADR-007 (Double-entry accounting) |

---

## Context

A petrol pump ERP spans multiple interconnected business areas: fuel inventory, accounting, cash management, person ledgers, expenses, income, and reporting. If these areas share one undifferentiated data model, business rules become unclear, duplicated, and impossible to audit.

Fuel station operators think in domain language: *Fuel Batch*, *Sale*, *Owner Withdrawal*, *Posting*, *Variance* — not in table names or screen IDs.

---

## Decision

Model FuelERP using **Domain-Driven Design (DDD)** with bounded contexts, aggregates, ubiquitous language, and domain events.

### Bounded contexts (Version 1)

| Context | Owns |
| --- | --- |
| **Fuel Operations** | Purchases, sales, pricing, batches |
| **Inventory** | Stock movements, tank reconciliation, FIFO consumption |
| **Accounting** | Chart of accounts, journals, postings, reversals, period close |
| **Cash Management** | Cash accounts, transfers, balances |
| **Persons & Ledgers** | Customers, suppliers, employees, owners, personal/business ledgers |
| **Expenses & Income** | Operating costs, non-fuel revenue |
| **Reporting** | Read-only projections of posted data |
| **Settings & Administration** | Configuration, users, permissions, backup |

Each context owns its aggregates. Cross-context coordination happens through **domain events** and **application services** — never through direct aggregate mutation across boundaries.

### Aggregate design rules

- One **aggregate root** per consistency boundary (e.g., `FuelBatch`, `JournalEntry`, `Sale`)
- External code modifies an aggregate only through the root's methods
- Invariants are enforced inside the aggregate before state changes
- Meaningful state changes raise **domain events** (past tense: `FuelPurchased`, `SaleCompleted`)
- Events are collected by `AggregateRoot`, persisted, then dispatched post-commit

### Ubiquitous language

Code, documentation, UI copy, and tests use the same business terms:

| Use | Avoid |
| --- | --- |
| Record Sale | Post Revenue Entry |
| Owner Withdrawal | Equity Drawdown |
| Purchase Fuel | Create Inventory Journal |
| Transfer Cash | Move Between Asset Accounts |

### Platform building blocks (`@fuelms/domain`)

| Type | Purpose |
| --- | --- |
| `ValueObject` | Immutable objects equal by value (Money, FuelQuantity, FuelPrice) |
| `Entity` | Objects equal by identity (JournalLine within a JournalEntry) |
| `AggregateRoot` | Consistency boundary + domain event collection |
| `DomainEvent` | Immutable record of something that happened |
| `IRepository` | Persistence contract per aggregate |

---

## Consequences

### Positive

- Business rules live in explicit, named domain objects — not scattered SQL or UI handlers
- Bounded contexts prevent Reporting from mutating Fuel or Accounting data
- Domain events enable loose coupling between contexts (Accounting reacts to `SaleCompleted`)
- Ubiquitous language reduces miscommunication between owners, accountants, and developers
- Aggregates make concurrency and invariant enforcement tractable

### Negative

- Higher upfront modeling cost than CRUD scaffolding
- Requires aggregate boundary decisions upfront (wrong boundaries are expensive to fix)
- Event-driven coordination adds complexity vs. direct cross-table updates

### Constraints introduced

- No feature may duplicate validation, posting, or inventory logic owned by another domain
- Domain layer must not depend on React, SQLite, Tauri, or any framework
- Historical domain facts (events, posted journals) are immutable

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **Anemic domain model** | Business logic drifts to services and UI; invariants become untestable |
| **Single unified model** | Fuel, Accounting, and Reporting concerns collide; changes ripple unpredictably |
| **Event Sourcing (full)** | Over-engineered for V1; outbox + domain events provide sufficient audit trail |

---

## Compliance

Binding per DDD architecture document, `IMPLEMENTATION_GUIDE.md` §5–§9, and `AI_DEVELOPMENT_PROTOCOL.md` §3.
