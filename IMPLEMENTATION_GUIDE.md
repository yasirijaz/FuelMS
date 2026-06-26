# IMPLEMENTATION GUIDE

## Enterprise Desktop ERP for Petrol Pumps

This guide is mandatory reading before any code changes are made.

It defines how FuelMS is built, how code is organized, and which architectural rules must never be violated. Every future Cursor session, implementation task, code review, refactor, and feature request must comply with this guide and the Enterprise Blueprint.

If a requested implementation conflicts with this guide, the Enterprise Blueprint, the business invariants, the accounting architecture, the financial posting matrix, or the user experience architecture, stop and explain the conflict before changing code.

---

## 1. Project Philosophy

### Business First

FuelMS exists to solve petrol pump business problems: financial accuracy, inventory traceability, cash control, auditability, and simple daily operation.

The system must use business language. Users record sales, purchases, transfers, expenses, income, borrowings, repayments, stock adjustments, and backups. They should not be forced to think in technical or accounting implementation terms during routine work.

### Architecture First

FuelMS is an enterprise ERP, not a CRUD application. Architecture protects the business from hidden financial corruption, duplicated rules, untraceable stock, unreliable reports, and unmaintainable code.

Architectural boundaries are not optional. They exist so the system can grow for 10+ years without rewriting core business behavior.

### Code Second

Code is only valuable when it faithfully implements the business model. Do not write code until the business rule, domain boundary, accounting impact, validation behavior, and audit requirement are understood.

Technical convenience must never override financial integrity, inventory accuracy, historical accuracy, or auditability.

---

## 2. Architecture Rules

These rules are permanent.

- UI never contains business logic.
- Repositories never contain UI logic.
- Business logic never depends on React.
- SQLite is hidden behind repositories and backend persistence services.
- Accounting is the financial kernel of the ERP.
- No module bypasses accounting for financial operations.
- Reporting is read-only.
- Historical data is immutable after posting.
- Posted financial records are corrected through reversals or adjustments, never silent edits.
- Inventory must never become negative unless a formally approved future policy allows a controlled exception.
- Fuel prices used by historical sales must never be changed retroactively.
- Every sale must permanently store the selling price used at the time of sale.
- Business actions generate domain events where meaningful.
- Every mutation affecting money or inventory must be auditable.
- Routine users perform business actions; the ERP performs accounting automatically.
- No feature may duplicate accounting, inventory, validation, or posting logic owned by another domain.

---

## 3. Clean Architecture Rules

FuelMS follows Clean Architecture with strict dependency direction.

### Presentation Layer

Responsible for:

- Pages, screens, dialogs, tables, and visual components.
- User input collection.
- User feedback and loading states.
- Calling application-facing hooks or services.
- Displaying business-friendly errors and summaries.

Presentation must not:

- Calculate accounting impact.
- Calculate inventory valuation.
- Decide business rules.
- Access SQLite.
- Mutate balances.
- Decide posting behavior.

### Application Layer

Responsible for:

- Coordinating use cases.
- Calling domain behavior.
- Managing transaction boundaries through infrastructure abstractions.
- Coordinating repositories.
- Mapping business commands to domain operations.
- Raising domain events through the approved event mechanism.
- Enforcing workflow-level rules.

Application services are the normal entry point for business use cases.

### Domain Layer

Responsible for:

- Business entities.
- Value objects.
- Aggregates.
- Domain services.
- Domain policies.
- Business invariants.
- Domain events.

The domain layer owns the permanent business truth. It must not depend on React, SQLite, Tauri commands, HTTP, local storage, UI state, or external frameworks.

### Infrastructure Layer

Responsible for:

- Repository implementations.
- SQLite persistence.
- File storage.
- Backup/restore mechanics.
- Tauri command adapters.
- External integration adapters in future phases.

Infrastructure implements contracts defined by the application/domain layers. It does not own business rules.

### Allowed Dependencies

Allowed direction:

```text
Presentation -> Application -> Domain
Infrastructure -> Application / Domain contracts
```

Forbidden direction:

```text
Domain -> Application
Domain -> Presentation
Domain -> Infrastructure
Application -> Presentation
Repository -> UI
UI -> SQLite
```

---

## 4. Folder Structure

The project should remain organized by business feature and architectural layer.

```text
src/
  app/
    layouts/
    providers/
    router/
  features/
    Accounting/
      application/
      domain/
      infrastructure/
      presentation/
    Fuel/
      application/
      domain/
      infrastructure/
      presentation/
    Inventory/
      application/
      domain/
      infrastructure/
      presentation/
    Expenses/
      application/
      domain/
      infrastructure/
      presentation/
    Income/
      application/
      domain/
      infrastructure/
      presentation/
    Persons/
      application/
      domain/
      infrastructure/
      presentation/
    Reports/
      application/
      domain/
      infrastructure/
      presentation/
    Settings/
      application/
      domain/
      infrastructure/
      presentation/
  shared/
    components/
    hooks/
    lib/
    schemas/
    stores/
    types/
    utils/
  styles/
src-tauri/
  src/
    commands/
    db/
    repositories/
    services/
```

### `src/app`

Application composition only:

- Routing.
- Layouts.
- Providers.
- App shell concerns.

Do not place business logic here.

### `src/features`

Each feature owns its domain language, use cases, infrastructure adapters, and presentation.

Future modules must be added as feature modules, not as unrelated global folders.

### `src/shared`

Reusable non-business infrastructure:

- Generic UI components.
- Generic hooks.
- Shared library configuration.
- Shared schemas and types.
- Generic utilities.

Do not place feature-specific business rules in `shared`.

### `src-tauri`

Backend and durable infrastructure:

- SQLite access.
- Transactions.
- Repositories.
- Services.
- File storage.
- Backup and restore.
- Tauri command boundary.

Durable infrastructure belongs here. Browser-facing code must not own SQLite, filesystem, backup, or transaction behavior.

---

## 5. Module Structure

Every feature module must follow the same structure.

```text
Feature/
  application/
  domain/
  infrastructure/
  presentation/
```

### `application`

Contains use cases, application services, command/query models, and orchestration logic.

Examples:

- Record fuel purchase.
- Complete fuel sale.
- Post expense.
- Transfer cash.
- Create backup.

### `domain`

Contains business concepts and rules.

Examples:

- Aggregates.
- Entities.
- Value objects.
- Domain policies.
- Domain events.
- Domain services.

### `infrastructure`

Contains adapters that connect the feature to persistence, backend commands, file storage, or future integrations.

Infrastructure must satisfy contracts. It must not invent business rules.

### `presentation`

Contains UI-facing feature entry points and components.

Presentation must remain thin and business-language oriented.

---

## 6. Coding Standards

### Naming

Use business-first names.

Good:

- `FuelSale`
- `FuelBatch`
- `OwnerWithdrawal`
- `CashTransfer`
- `JournalPosting`
- `InventoryAdjustment`
- `PersonLedger`

Avoid vague technical names:

- `DataItem`
- `RecordManager`
- `CommonHandler`
- `ProcessData`
- `UpdateThing`

### Files

- One main concept per file.
- File names should match the exported concept.
- Avoid large mixed-purpose files.
- Keep feature code inside its feature boundary.

### Folders

- Folder names should reflect domain or layer meaning.
- Do not create generic dumping grounds such as `misc`, `helpers2`, or `new`.

### Variables

- Use clear business names.
- Avoid abbreviations unless they are established domain language.
- Avoid magic numbers and unexplained constants.

### Classes and Types

- Use nouns for entities and value objects.
- Use verb phrases for commands and use cases.
- Keep types explicit at boundaries.

### Interfaces

Interface names should describe business capability, not technical storage.

Examples:

- `FuelBatchRepository`
- `JournalRepository`
- `PersonLedgerRepository`

### Enums

Enums should represent stable business classifications. Avoid using enums for values likely to become configurable business data.

### DTOs

DTOs are boundary contracts. They must not contain domain behavior.

### Services

Application services coordinate use cases. Domain services express domain behavior that does not belong to a single entity.

### Repositories

Repository names must match aggregate ownership.

### Hooks

Hooks are presentation/application adapters. They must not contain business rules or persistence logic.

### Events

Domain events use past-tense business names.

Good:

- `FuelPurchased`
- `SaleCompleted`
- `JournalPosted`
- `MoneyBorrowed`
- `BackupCompleted`

Bad:

- `PurchaseFuel`
- `PostJournal`
- `UpdateRecord`
- `SaveData`

---

## 7. Business Logic Rules

Business rules belong only in the Domain or Application layers.

Never place business rules inside:

- React components.
- Pages.
- Dialogs.
- Tables.
- Forms.
- Hooks that are presentation-only.
- Repositories.
- SQLite queries.
- Tauri command serializers.

Reasons:

- UI changes should not change business behavior.
- Persistence changes should not change accounting rules.
- Business rules must be testable without rendering UI.
- Business behavior must remain reusable for future REST APIs, mobile apps, cloud sync, and hardware integrations.
- Duplicated business logic creates inconsistent financial and inventory results.

---

## 8. Repository Rules

Repositories perform persistence only.

Repositories may:

- Load aggregates.
- Save aggregate state.
- Retrieve business-oriented query results.
- Enforce persistence-level consistency.
- Map stored data to domain/application DTOs.

Repositories must not:

- Calculate accounting postings.
- Calculate profit.
- Decide inventory valuation.
- Determine whether a withdrawal is an expense.
- Apply business approval rules.
- Manipulate UI state.
- Open unrelated transactions independently.
- Return raw persistence rows to the UI.

Repository operations should be business-oriented, not generic CRUD.

Good:

- `findAvailableFuelBatches`
- `getPostedJournalsForPeriod`
- `loadPersonLedger`
- `findSalesByBusinessDate`

Avoid:

- `getAll`
- `updateAny`
- `deleteRecord`
- `saveData`

---

## 9. Service Rules

### Application Services

Application services coordinate use cases.

They may:

- Validate command completeness.
- Load aggregates through repositories.
- Call domain behavior.
- Coordinate multiple repositories.
- Start and complete business transactions.
- Append domain events.
- Return read models required by presentation.

Application services should be the only layer coordinating multiple repositories for one user action.

### Domain Services

Domain services contain business behavior that does not naturally belong inside one entity or aggregate.

Examples:

- Profit calculation.
- Inventory valuation.
- FIFO consumption.
- Tank reconciliation.
- Cash reconciliation.
- Posting policy interpretation.

Domain services must remain independent from UI and persistence technology.

---

## 10. State Management Rules

Zustand is for client-side UI state, not durable business truth.

### Belongs In Global State

- Sidebar state.
- Theme preference.
- Current lightweight UI context.
- Non-sensitive navigation preferences.
- Temporary app shell state.

### Belongs In Local Component State

- Open/closed dialog state.
- Draft field interaction state.
- Active tab.
- Local filters before submission.
- Temporary display-only controls.

### Belongs In TanStack Query

- Server/backend query results.
- Cached read models.
- Lists and detail views loaded from durable business data.

### Must Never Be Stored Globally As Source Of Truth

- Accounting balances.
- Inventory balances.
- Cash balances.
- Person ledger balances.
- Fuel prices as authoritative data.
- Posted transactions.
- Audit history.
- Permissions as bypassable flags.

Global state must never become a shadow database.

---

## 11. Form Rules

Forms must follow business-first UX principles.

### Validation

- Use Zod for structural validation.
- Use React Hook Form for form state and user feedback.
- Domain validation still belongs in domain/application layers.
- UI validation improves usability but is not authoritative.

### Default Values

Defaults should reduce effort but must remain visible and changeable when authorized.

Examples:

- Last used payment account.
- Active fuel price.
- Current business date.
- Frequent supplier or expense category.

### Error Messages

Errors must be business-readable and corrective.

Bad:

- `Invalid transaction`
- `Constraint failed`

Good:

- `This sale cannot be saved because diesel stock is insufficient.`
- `This expense cannot be posted because no payment account was selected.`

### User Feedback

Users must understand what will happen when they save:

- Stock updated.
- Cash received.
- Supplier due increased.
- Loan reduced.
- Backup completed.

### Consistency

Similar workflows must behave similarly across modules.

---

## 12. Error Handling

Errors must be classified consistently.

### Business Errors

Violation of business rules.

Examples:

- Negative inventory.
- Closed period posting.
- Owner withdrawal categorized as expense.
- Historical sale modification attempt.

Business errors should show clear user-facing messages and prevent the action.

### Validation Errors

Invalid or missing input.

Examples:

- Missing fuel product.
- Negative price.
- Missing payment method.
- Invalid date.

### Unexpected Errors

Unknown failures that were not expected by business flow.

These should be logged and shown as safe, non-technical messages.

### SQLite Errors

SQLite errors must be mapped into application-level errors before reaching UI.

Users should not see raw database messages.

### Application Errors

Workflow coordination failures.

Examples:

- Missing posting configuration.
- Repository unavailable.
- Backup validation failed.

### User Messages

User messages must explain:

- What failed.
- Why it matters.
- What the user can do next.

### Logging

Unexpected and system-level errors should be logged with enough context to diagnose, without exposing sensitive data unnecessarily.

---

## 13. Logging Rules

Logging is not the same as audit.

### Business Logs

Capture business flow milestones useful for support and diagnosis.

### System Logs

Capture technical health, failures, performance, startup, backup, restore, and storage issues.

### Audit Logs

Audit logs are official business trace records.

Audit logs must capture:

- User.
- Action.
- Business object.
- Time.
- Reason where applicable.
- Authorization where applicable.
- Reversal/correction history.

Audit history must not be casually edited or deleted.

### Debug Logs

Debug logs are temporary diagnostic tools. They must not become business truth and must not leak sensitive financial information.

---

## 14. Transaction Rules

Business transactions must be atomic. A business action is either fully accepted or not accepted.

Partial financial or inventory truth is forbidden.

### Fuel Purchase

Must preserve purchase fact, inventory increase, cost basis, supplier/payment status, accounting impact, and audit trail together.

### Fuel Sale

Must preserve sale fact, applied historical price, payment effect, stock consumption, cost recognition, accounting impact, and audit trail together.

### Expense

Must preserve expense category, amount, payment/payable effect, accounting impact, approval state, and audit trail together.

### Borrow Money

Must preserve received funds, lender/person ledger impact, liability increase, accounting impact, and audit trail together.

### Return Money

Must preserve repayment amount, cash decrease, liability decrease, person ledger impact, accounting impact, and audit trail together.

### Cash Transfer

Must preserve source decrease, destination increase, no profit impact, and audit trail together.

### Inventory Adjustment

Must preserve product, quantity change, reason, authorization, inventory effect, accounting effect where value changes, and audit trail together.

### Atomicity Requirements

- Do not commit financial data without its source business event.
- Do not commit inventory changes without their source business event.
- Do not emit events without the corresponding state change.
- Do not finalize a user action if required accounting impact cannot be produced.

---

## 15. Testing Strategy

Testing must prioritize business correctness.

### Unit Tests

Test individual domain rules, value objects, and policies.

### Integration Tests

Test application services with repository boundaries and transaction behavior.

### Business Rule Tests

Mandatory for:

- Negative inventory prevention.
- Historical price immutability.
- Journal balancing.
- Owner withdrawal classification.
- Borrowing and repayment.
- Cash transfer profit neutrality.
- Report reproducibility.

### Regression Tests

Every bug involving money, inventory, posting, reporting, or audit must receive a regression test.

### Acceptance Tests

Validate complete business scenarios from user action to accounting/inventory/reporting/audit consequence.

---

## 16. Performance Rules

Performance must support daily petrol pump operation.

### Large Lists

- Use pagination or virtualized display where appropriate.
- Avoid loading unnecessary records.
- Keep filtering business-oriented.

### Searching

- Search should be fast and forgiving.
- Common searches should target business fields such as person name, reference, product, date, amount, and report name.

### Filtering

- Filters should be explicit and stable.
- Date filters must respect business date rules.

### Reports

- Daily reports should feel fast.
- Heavy reports should communicate progress.
- Reports must remain read-only.

### SQLite Access

- UI must not access SQLite directly.
- Queries should be performed through repositories/services.
- Avoid long write transactions.

### Memory Usage

- Do not mirror durable data into global state.
- Avoid loading full historical datasets into the frontend unnecessarily.

---

## 17. Security Rules

FuelMS is local-first, but security still matters.

### Authentication

Every business action must be attributable to an authenticated user.

### Permissions

Sensitive operations require authorization:

- Price changes.
- Reversals.
- Inventory adjustments.
- Owner withdrawals.
- Backup restore.
- Closing adjustments.
- User and role changes.

### Sensitive Data

Financial, personal, backup, and audit data must be handled carefully.

### Backups

Backup and restore are sensitive operations. Restore must require elevated authorization and explicit confirmation.

### Database Protection

Users must never be encouraged to modify the database directly. Any direct manipulation risks accounting corruption and loss of auditability.

---

## 18. Documentation Rules

Every feature must include:

- Business purpose.
- Business rules.
- Accounting impact.
- Inventory impact where applicable.
- Domain events.
- Permissions.
- Validation rules.
- Edge cases.
- Failure scenarios.
- Architecture notes.
- Future improvements.

Documentation must be updated when behavior changes.

---

## 19. Code Review Checklist

Every review must ask:

- Are business rules followed?
- Are Clean Architecture boundaries respected?
- Is domain logic free from React, UI, and persistence dependencies?
- Is UI free from business logic?
- Is SQLite hidden behind repositories/services?
- Is accounting respected?
- Is the financial posting matrix followed?
- Is historical data protected?
- Is inventory protected from invalid states?
- Is audit maintained for important actions?
- Are domain events named and raised correctly?
- Is there duplicated business logic?
- Are permissions enforced at the correct layer?
- Are errors business-readable?
- Are tests added or updated?
- Is performance acceptable?
- Is naming business-first?
- Is documentation updated?
- Does this change preserve future cloud/API/mobile readiness?

---

## 20. Definition Of Done

A feature is complete only when:

- Business rules are implemented.
- Architecture boundaries are followed.
- Accounting impact is implemented and verified.
- Inventory impact is implemented and verified where applicable.
- Domain events are handled where applicable.
- Validation is complete at UI, application, domain, and persistence boundaries as appropriate.
- Error handling is complete.
- Audit logging is complete for important actions.
- Tests are written.
- Documentation is updated.
- Performance is acceptable.
- Security and permissions are reviewed.
- Historical data remains protected.
- No technical debt or architectural violation is introduced.

---

## 21. Things Cursor Must Never Do

Cursor and future developers must never:

- Place business logic inside React components.
- Place business logic inside pages.
- Place business logic inside dialogs.
- Place business logic inside tables.
- Place business logic inside forms.
- Bypass repositories.
- Access SQLite directly from UI.
- Manipulate accounting balances directly.
- Manipulate inventory balances directly.
- Edit historical financial records silently.
- Edit historical fuel sales silently.
- Recalculate historical sales using current fuel prices.
- Delete posted accounting history.
- Delete inventory movement history.
- Duplicate accounting logic across modules.
- Calculate accounting inside UI.
- Calculate inventory valuation inside UI.
- Treat owner withdrawals as expenses.
- Treat borrowing as income.
- Treat loan principal repayment as expense.
- Treat cash transfers as profit or loss.
- Allow routine manual journals for normal operations.
- Allow reports to modify data.
- Use cached report totals as source of truth.
- Store authoritative balances in Zustand.
- Hide business errors behind generic technical messages.
- Ignore audit requirements.
- Skip tests for financial or inventory behavior.
- Change architecture to satisfy a quick feature request.
- Introduce cloud assumptions into Version 1 offline workflows.
- Violate the Enterprise Blueprint.

---

## 22. Future Readiness

Every implementation must remain compatible with future expansion.

### Cloud Sync

Use stable identities, domain events, clear ownership, and idempotent business behavior so records can synchronize later.

### REST API

Keep business logic outside UI so future APIs can reuse application/domain behavior.

### Multi Company

Avoid assumptions that only one legal business entity can ever exist.

### Multi Branch

Avoid hard-coding single-branch assumptions into domain rules where branch context may later matter.

### Hardware Integration

Pump machines, tank sensors, printers, and cash drawers should become external actors producing business facts. They must not own business rules.

### AI Modules

AI may analyze reports, detect anomalies, or assist decisions. AI must never become the source of accounting, inventory, or audit truth.

Future channels may change. Business rules must remain stable.

---

## 23. Final Development Contract

Every future implementation must comply with this guide.

This guide, the Enterprise Blueprint, the Business Invariants, the Domain-Driven Design document, the Event-Driven Architecture document, the Data Architecture document, the Accounting Architecture document, the Financial Posting Matrix, and the User Experience Architecture are binding project governance.

If a requested implementation conflicts with this guide or the Enterprise Blueprint, stop and explain the conflict instead of violating the architecture.

No feature is worth corrupting accounting, inventory, audit history, or maintainability.

