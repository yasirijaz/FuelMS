# Engineering Standards

## FuelERP — Enterprise Desktop ERP for Petrol Pumps

**Priority:** Equal to the Enterprise Blueprint.  
If any implementation conflicts with this document, stop, explain the conflict, and resolve before proceeding.

**Scope:** Every developer, AI assistant, tester, and reviewer contributing to FuelERP must follow these standards.

---

## 1. Engineering Philosophy

Engineering exists to implement business requirements **safely, predictably, and durably**.

The engineering team is not a feature factory. It is the guardian of a financial system that real businesses depend on every day. A bug in revenue calculation, an untraced inventory movement, or a corrupted backup is not a technical inconvenience—it is a business failure.

Engineering discipline means:

- Understanding the business requirement before writing a line of code.
- Choosing the simplest correct approach, not the cleverest one.
- Writing code that a colleague can understand and modify safely in five years.
- Treating data integrity as a non-negotiable constraint, not an afterthought.
- Preferring clear failures over silent corruption.

Speed matters only after correctness is established. Shortcuts that compromise data integrity, accounting accuracy, or architectural boundaries are rejected regardless of delivery pressure.

---

## 2. Repository Standards

### Responsibility

A repository is responsible for one thing: **persisting and loading aggregates** for its owning domain.

Repositories translate between the domain model and durable storage. They do not own business rules, perform calculations, or drive UI behavior.

### Naming

Repository interfaces are named by aggregate:

```
FuelBatchRepository
SaleRepository
ExpenseRepository
JournalRepository
PersonLedgerRepository
CashAccountRepository
BackupRepository
```

Implementations carry an infrastructure qualifier:

```
SqliteFuelBatchRepository
SqliteSaleRepository
```

### Boundaries

- One repository per aggregate root.
- A repository must not load data owned by another domain's aggregate without explicit justification.
- Repositories must return domain or application DTOs, never raw persistence rows.
- Soft-deleted records are excluded by default. Audit and reporting queries may opt in explicitly.

### Operations

Repository operations must be **business-oriented**, not generic CRUD.

Preferred:

```
findAvailableBatchesByProduct(productId, neededQuantity)
getPostedEntriesForPeriod(accountId, dateRange)
loadPersonLedger(personId)
findSalesByBusinessDate(date)
```

Avoided:

```
getAll()
updateById()
deleteRecord()
save(data)
```

### Transactions

- Repositories **receive** a transaction or executor handle. They never open their own connection.
- A repository must never commit or roll back a transaction it did not start.
- The application service or Unit of Work controls transaction boundaries.
- Multiple repositories participating in one business action must share the same transaction handle.

---

## 3. Service Standards

### Application Services

Application services coordinate use cases. They are the entry point for business actions initiated by users.

Responsibilities:

- Validate command completeness before starting work.
- Load aggregates through repositories.
- Invoke domain behavior or domain services.
- Coordinate multiple repositories within one unit of work.
- Append domain events before commit.
- Return read models shaped for the presentation layer.

Rules:

- One application service per feature use case group (e.g., `FuelSaleService`, `ExpenseService`).
- Application services must not contain domain business rules.
- Application services must not know about UI state, React components, or presentation concerns.
- Application services must not access SQLite directly.

### Domain Services

Domain services contain **business behavior** that does not belong inside a single entity or aggregate.

Examples:

- `ProfitCalculationService` — spans sales, COGS, expenses, income.
- `InventoryValuationService` — determines stock value across batches.
- `FifoConsumptionService` — determines which batches a sale consumes.
- `TankReconciliationService` — compares physical reading to system stock.
- `PostingPolicyService` — maps a business action to its accounting consequence.
- `PriceEffectivityService` — determines which price was active at a given time.

Rules:

- Domain services must not depend on React, SQLite, Tauri, HTTP, or infrastructure.
- Domain services must be fully testable without a database or UI.
- Domain services must use only domain types and value objects.

### Infrastructure Services

Infrastructure services implement external concerns: file storage, backup mechanics, Tauri command adapters, future HTTP clients.

Rules:

- Infrastructure services satisfy contracts defined by the application or domain layer.
- Infrastructure services must not invent business rules.
- Infrastructure services must not be called directly from presentation.

---

## 4. UI Standards

The UI layer is **presentation only**. It collects user input, displays business results, and calls application-layer services or hooks. It owns no business logic.

### Pages

- One page component per major route.
- Pages compose feature components; they do not implement business workflows inline.
- Pages must not contain validation logic beyond display formatting.
- Pages must not calculate totals, balances, or inventory positions.

### Components

- Components are reusable visual units.
- A component must have a single, clear display purpose.
- Business logic must never live inside a component.
- Props must use domain-language names (e.g., `saleAmount`, `fuelQuantity`, not `val1`, `data`).

### Dialogs

- Dialogs are focused workflows for one business action (record expense, confirm reversal).
- Dialogs must not chain into multiple unrelated actions without clear UX justification.
- Destructive or irreversible actions require an explicit confirmation step.

### Forms

- Forms use React Hook Form for state management.
- Forms use Zod schemas for structural validation.
- Domain validation remains in the application/domain layer; form validation improves usability only.
- Every form must define default values explicitly.
- Error messages must be business-readable (see Section 7).
- Required fields must be clearly indicated.
- Tab order must be logical and keyboard-complete.

### Tables

- Tables display read-only data.
- Tables must not perform calculations beyond formatting.
- Pagination or virtual scrolling is required for lists that may exceed 200 rows.
- Columns must use business-language headers.

### Navigation

- Navigation is shallow: common tasks reachable in one or two actions.
- Navigation labels use business terminology (Purchases, Sales, Cash, Reports — not Modules, Data, CRUD).
- Active route must be visually clear.
- Navigation must respect role-based visibility.

---

## 5. Database Standards

### Migration Philosophy

- Every schema change is a numbered, named migration.
- Migrations are append-only: never edit or delete an applied migration.
- Every migration is tested forward before release.
- Migrations must be backward-safe: old application code must not crash on a partially migrated schema when possible.
- Schema version is tracked in `schema_migrations`.

### Indexes

- Every foreign key column must have an index.
- Columns used in frequent filters (product, date, status, source_type) must have an index.
- Composite indexes must be documented with the query pattern they support.
- Unused indexes must be removed; they slow writes without benefit.

### Constraints

- Foreign key constraints enforced: `PRAGMA foreign_keys = ON`.
- Non-null constraints applied to all required business fields.
- Check constraints used for business-critical value ranges (e.g., quantity, amounts ≥ 0).
- Unique constraints on business identity fields (invoice reference, account code, document number).

### Transactions

- Every business mutation runs inside a transaction.
- Transactions are `BEGIN IMMEDIATE` for writes to prevent late write-lock failures.
- Transactions are kept short: no filesystem operations, backup compression, or UI waiting inside a database transaction.
- Transactions roll back completely on any error; partial writes are not allowed.

### Naming

- Tables: `snake_case` plural nouns matching aggregate language (`fuel_batches`, `ledger_entries`, `outbox_events`).
- Columns: `snake_case` descriptive names (`purchase_rate_minor`, `occurred_at`, `source_type`).
- Money: stored as integer minor units (e.g., `amount_minor` in paisa or smallest unit). Never floating point.
- Timestamps: `TEXT NOT NULL` in UTC ISO-8601 format.
- IDs: `TEXT PRIMARY KEY` using UUID or ULID.
- Soft delete: `deleted_at TEXT NULL` — absent means active.
- Optimistic concurrency: `version INTEGER NOT NULL DEFAULT 1`.

### Performance

- WAL journal mode: `PRAGMA journal_mode = WAL`.
- Synchronous mode: `PRAGMA synchronous = NORMAL`.
- Busy timeout: `PRAGMA busy_timeout = 5000`.
- Avoid `SELECT *`; name required columns explicitly.
- Avoid loading full historical datasets into the frontend; paginate or summarize in the query.
- Explain query plans for any query touching more than 10,000 rows.

---

## 6. Event Standards

### Domain Events

Domain events are **business facts that have already happened**. They are named in past tense, owned by the domain where the fact occurred.

```
FuelPurchased        SaleCompleted        JournalPosted
FuelPriceChanged     ExpensePosted        MoneyBorrowed
FuelConsumed         IncomePosted         BackupCompleted
StockAdjusted        MoneyReturned        RestoreCompleted
```

Never use command-style names for events:

```
PurchaseFuel     ← command, not event
PostJournal      ← command, not event
```

### Application Events

Application events communicate between bounded contexts within the same process. They carry enough business context for consumers to act without querying back to the source.

Every event payload must include:

- Stable aggregate identity.
- Business date of the event.
- Actor (user) identity.
- Correlation identifier linking related events from the same business action.
- Causation identifier linking the event to its trigger.
- Version number of the event schema.

### Ordering

Events within a single business transaction must be appended in the correct causal sequence.

Critical ordering rules:

- `FuelPurchased` before `FuelBatchCreated`.
- `FuelAvailable` before `SaleCompleted`.
- `SaleCompleted` before `FuelConsumed` and `JournalPosted`.
- `ExpenseApproved` before `ExpensePosted`.

Out-of-order processing that produces invalid inventory or accounting state is a defect.

### Versioning

- Event schemas must be versioned from the first release.
- New fields may be added in a backward-compatible way.
- Removing or renaming fields requires a new event version.
- Old event versions must remain processable by audit and reporting for the lifetime of the data.

### Idempotency

Every event consumer must be **idempotent**: processing the same event twice must not double-post revenue, double-reduce inventory, or duplicate ledger entries.

Implement idempotency by checking a unique event or correlation identifier before applying state changes.

---

## 7. Error Standards

### Business Errors

A business error occurs when a valid user action violates a business rule.

Examples: insufficient stock, closed period, unauthorized action.

Requirements:

- Show a specific, actionable message in business language.
- Never show stack traces, constraint names, or internal identifiers.
- The action must not partially commit.
- Log the error with context for support diagnosis.

Good: `Diesel stock is insufficient. Available: 120 L. Requested: 200 L.`  
Bad: `SQLITE_CONSTRAINT: CHECK constraint failed: quantity_milliunits`

### Validation Errors

A validation error occurs when user input is structurally or logically invalid before a business action is attempted.

Requirements:

- Display inline near the relevant field.
- Use plain business language.
- List all errors at once where possible; do not reveal them one at a time.

### Unexpected Errors

An unexpected error occurs when an unhandled condition arises.

Requirements:

- Show a calm, non-technical message: `Something went wrong. Your data has not been changed. Please try again or contact support.`
- Log the full error context, including stack trace, user, action, and business state.
- Do not allow partial state changes to persist.

### Recovery

- The application must recover cleanly from unexpected shutdown: no partial transactions, no corrupted records.
- On restart, the UI should show the current business state, any pending recovery notice, and any recent actions.
- Users must never be left guessing whether their last action was saved.

### Logging

- Log levels: `ERROR` for unexpected failures; `WARN` for business rule violations; `INFO` for significant business events; `DEBUG` for development tracing.
- Debug logs must not appear in production builds.
- Logs must never contain passwords, full financial records, or personal data unnecessarily.
- Audit events are separate from application logs and have their own permanent retention policy.

---

## 8. Performance Standards

### Target Response Times

| Operation | Target |
| --- | --- |
| Open daily screen (Dashboard, Sales, Cash) | < 300ms |
| Save routine transaction (sale, expense, purchase) | < 500ms |
| Search with partial text input | < 200ms |
| Daily summary report (today's sales, cash, stock) | < 500ms |
| Monthly P&L or inventory report | < 3 seconds |
| Backup (standard size) | < 60 seconds with progress indication |

Performance targets are measured on the reference hardware profile for the deployment environment.

### Memory Limits

- Do not load full historical datasets into frontend memory.
- Paginate lists exceeding 200 rows by default.
- Release TanStack Query cache for routes no longer active when memory pressure is relevant.

### Startup Time

- Application cold start to interactive dashboard: target < 3 seconds.
- Database connection and migration check must complete before any user action.

### Large Dataset Handling

- Reports for long periods must stream or paginate results.
- Heavy reports must show progress and allow the user to continue other work.
- Never block the UI thread during report generation or backup.

---

## 9. Security Standards

### Authentication

- Every session requires a valid authenticated user.
- No business action may be attributed to an anonymous or unauthenticated user.
- Session inactivity policy must lock the application and require re-authentication.
- Authentication state is managed in the application layer, not in UI global state.

### Authorization

- Permissions are checked at the application service layer, not only in the UI.
- Hiding a button in the UI is not authorization; the underlying service must reject the action if the user lacks permission.
- Permission checks must be consistent: the same rule enforced in the same layer for every entry point to a sensitive action.

### Sensitive Data

- Financial amounts, personal information, and authentication credentials must not appear in application logs.
- Backup files must be treated as sensitive business data.
- Restore operations require elevated authorization and explicit user confirmation.

### Encryption

- Database encryption may be introduced in a future phase; the design must not assume plaintext is permanent.
- Backup files must support future encryption without requiring backup format redesign.

### Audit

- Security-sensitive actions (login, permission change, restore, reversal, closing adjustment) must produce audit records.
- Audit records are append-only: they must not be editable through the normal application flow.

---

## 10. Testing Standards

### Unit Tests

- Target: domain entities, value objects, policies, and domain services.
- Must run without a database, network, or UI.
- Every business invariant must have at least one unit test that proves violation is rejected.

### Integration Tests

- Target: application services with repository implementations.
- Use an in-memory or test SQLite instance.
- Verify that a business action produces the correct database state, events, and return values.

### Business Acceptance Tests

Mandatory for:

- Fuel price immutability on historical sales.
- Inventory never going negative.
- Journal balance (debits = credits).
- Owner withdrawal not appearing in operating expenses.
- Borrowing not appearing as income.
- Transfer not affecting P&L.
- Report reproducibility for the same date range.
- Reversal preserving original history.

### Regression Tests

- Every bug involving money, inventory, posting, or audit must produce a regression test before the fix is merged.
- Regression tests are named to describe the original defect scenario.

### Performance Tests

- Daily report benchmarks run against a seeded dataset of 6 months of realistic transactions.
- Response time regressions are treated as defects.

---

## 11. Git Standards

### Branching

- `main` — stable, releasable code only.
- `develop` — integration branch for completed features.
- `feature/<scope>-<short-description>` — one feature or focused change.
- `fix/<scope>-<short-description>` — bug fix.
- `release/<version>` — release preparation.

### Commits

- Commits are small and focused: one logical change per commit.
- Commit messages follow the pattern: `<type>(<scope>): <short description>`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- Example: `feat(fuel-sale): store applied selling price on completion`
- No commit may introduce a failing test, lint error, or known broken state.
- No WIP commits merged to `develop` or `main`.

### Pull Requests

- PRs are small: prefer one feature or one fix per PR.
- Large features must be split into incremental, independently mergeable PRs.
- Every PR must include: what changed, why it changed, accounting/inventory impact where applicable.
- PRs must not contain unrelated changes.

### Code Reviews

Every PR review must verify:

- Architecture boundaries respected.
- Business rules correct and tested.
- Accounting/inventory impact understood.
- No duplicate logic.
- Naming business-first.
- No direct SQLite access from UI.
- Error handling complete.
- Documentation updated where behavior changed.

---

## 12. Documentation Standards

Every implemented feature must include:

### Specification Reference

Link or inline the governing functional specification and business rules.

### Architecture Notes

- Which domain owns the behavior.
- Which events are raised.
- Which accounting/inventory impact applies.
- Which repositories are involved.

### Acceptance Criteria

Directly map to `BUSINESS_EXAMPLES.md` scenarios or define new ones if none exist.

### Tests

- List of unit tests covering business rules.
- List of integration tests covering the use case.
- Any regression tests added.

### Developer Notes

- Known edge cases and how they are handled.
- Decisions made and alternatives rejected (with brief rationale).
- Any open questions for future phases.

---

## 13. Release Standards

### Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`.

- `PATCH`: Bug fix with no schema change.
- `MINOR`: New feature, backward-compatible schema migration.
- `MAJOR`: Breaking change, major architectural shift, or incompatible migration.

### Pre-Release Backup

A verified backup must be created and confirmed before any release that includes a schema migration.

### Migration Verification

Every schema migration must be:

- Applied to a copy of a production-like database before release.
- Verified to complete without error.
- Verified to preserve existing data integrity.
- Verified to allow the new application version to start correctly.

### Release Checklist

- [ ] All acceptance tests pass.
- [ ] All unit and integration tests pass.
- [ ] No known critical defects open.
- [ ] Schema migrations verified on realistic data.
- [ ] Pre-release backup completed and verified.
- [ ] Documentation updated.
- [ ] Release notes prepared.
- [ ] Rollback strategy confirmed.

### Rollback Strategy

- Every release must have a documented rollback path.
- If a migration is irreversible, the rollback strategy must describe the restore procedure.
- The pre-release backup is the primary rollback mechanism for schema-breaking releases.

---

## 14. Definition of Done

A feature is **complete** only when all of the following are true:

- [ ] Business requirements fully implemented per governing specification.
- [ ] Domain events raised where applicable.
- [ ] Accounting impact implemented and verified against Financial Posting Matrix.
- [ ] Inventory impact implemented and verified where applicable.
- [ ] Validation complete at UI, application, domain, and persistence layers as appropriate.
- [ ] Error handling complete: business errors, validation errors, and unexpected errors.
- [ ] Audit trail implemented for sensitive or significant actions.
- [ ] Unit tests written for business rules.
- [ ] Integration tests written for use case.
- [ ] Regression tests written if fixing a defect.
- [ ] All tests pass.
- [ ] Performance within targets.
- [ ] No architectural violations.
- [ ] No duplicate business or posting logic introduced.
- [ ] Documentation updated: spec reference, architecture notes, acceptance criteria, developer notes.
- [ ] Code reviewed and approved.
- [ ] No known critical defects.

---

## 15. Engineering Principles

**1. Small commits, small pull requests.**  
Large changes are hard to review, hard to revert, and hide mistakes. Break work into the smallest independently correct increment.

**2. No hidden logic.**  
If behavior cannot be found by reading the module it belongs to, it is hidden. Hidden logic becomes untested, duplicated, or forgotten.

**3. Explicit naming over clever abbreviation.**  
`fuelQuantityInMilliliters` is always better than `fqml`. Code is read far more often than it is written.

**4. Deterministic behavior.**  
Given the same inputs, the system must always produce the same output. Non-determinism in business logic is a defect.

**5. High cohesion.**  
Things that change together must live together. A module that does ten unrelated things is ten hidden modules waiting to break independently.

**6. Low coupling.**  
Domains must communicate through contracts, events, or defined interfaces—not by reaching into each other's internals.

**7. Code should be easy to delete.**  
If replacing a module requires touching twenty unrelated files, the design is wrong. Boundaries must be real.

**8. Prefer composition over inheritance.**  
Compose behavior from small, focused units. Inheritance hierarchies are difficult to change and test.

**9. Keep modules independent.**  
A module must be buildable, testable, and understandable without loading the whole system.

**10. Fail loudly, fail clearly.**  
Silent failures corrupt data. A clear error that stops a business action is always preferable to a quiet one that produces wrong results.

**11. Test behavior, not implementation.**  
Tests must survive refactoring. Test what the system does for the business, not how it does it internally.

**12. One source of truth per concept.**  
Inventory balance lives in inventory movements. Cash balance lives in cash movements. Duplicating truth creates contradiction.

**13. Optimize only after measurement.**  
Premature optimization produces complex code that solves imaginary performance problems. Measure first; optimize the proven bottleneck.

**14. No magic values.**  
Unexplained numbers and strings in code are traps. Named constants, enums, or configuration must explain their meaning.

**15. Every input must be validated at the boundary it enters.**  
UI validation improves usability. Domain validation protects business truth. Both are required; neither replaces the other.

**16. Write for the next developer, not the current deadline.**  
The code you write today will be read, debugged, and modified by someone who was not in the room when you made your decisions. Be kind to them.

**17. Avoid premature abstraction.**  
An abstraction that does not yet have two concrete uses is probably wrong. Wait for the second use case before generalizing.

**18. Respect module ownership.**  
Do not reach into another module's internals. If you need data from another domain, request it through its public interface.

**19. Make the default path the correct path.**  
Configuration, defaults, and scaffolding should make it easier to do the right thing than the wrong thing.

**20. Engineering decisions are documented.**  
A decision not documented is a decision that will be relitigated, accidentally reversed, or misunderstood. Record the reasoning, not just the outcome.

---

*Engineering Standards — FuelERP*
