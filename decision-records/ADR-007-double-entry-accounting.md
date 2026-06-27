# ADR-007: Double-Entry Accounting as the Financial Kernel

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-004 (DDD), ADR-005 (FIFO costing) |

---

## Context

FuelERP is a financial operating system. Owners, accountants, and auditors must trust that every rupee is accounted for, every business action has a traceable financial consequence, and profit figures reconcile with reality.

Petrol pump operators should record business actions — *Purchase Fuel*, *Record Sale*, *Pay Salary* — not construct manual journal entries. Accounting complexity must remain internal while financial integrity is enforced automatically.

---

## Decision

Implement **double-entry accounting** as the financial kernel of FuelERP. Every financial operation produces balanced journal entries through centralized posting rules.

### Core principle

> **Users perform business actions. The ERP performs accounting.**

### Accounting architecture

| Component | Responsibility |
| --- | --- |
| **Chart of Accounts** | Asset, liability, equity, income, expense accounts |
| **Journal Entry** | Aggregate root: header + balanced debit/credit lines |
| **Posting Engine** | Maps business actions → journal entries via Financial Posting Matrix |
| **Accounting Service** | Validates, creates, and persists journals within transaction boundaries |
| **Reversal/Adjustment** | Corrects posted entries — never silent edits |

### Double-entry rules

1. Every journal entry must balance: total debits = total credits
2. Each line posts to exactly one account — debit OR credit, never both
3. Amounts stored in minor units (integer) to avoid floating-point errors
4. Business actions trigger automatic posting; routine users do not create manual journals
5. Historical posted journals are **immutable** — corrections use reversals or authorized adjustments
6. Owner withdrawals, borrowings, transfers, and loan repayments follow distinct posting rules (not misclassified as expenses/income)

### Posting flow

```text
Business Action (e.g. Record Sale)
        ↓
Domain validation (stock, price, payment)
        ↓
Inventory impact (FIFO consumption)
        ↓
Posting rule lookup (Financial Posting Matrix)
        ↓
Balanced journal entry created
        ↓
Persisted atomically with business record + inventory + outbox event
```

### Example: Sell Fuel posting

| Account | Debit | Credit |
| --- | --- | --- |
| Cash / Receivable | Sale amount | |
| Fuel Sales Revenue | | Sale amount |
| Cost of Goods Sold | FIFO COGS | |
| Fuel Inventory | | FIFO COGS |

### Manual journals

Reserved for **accountant-only** operations: period-end adjustments, accruals, reclassifications, opening balances. Never for routine daily operations.

---

## Consequences

### Positive

- Enterprise-grade financial integrity from day one
- Automatic posting eliminates duplicate data entry and classification errors
- Audit trail: business event → posting rule → journal → report impact
- Accountants can inspect full ledger behind any business action
- Financial Posting Matrix provides a single policy document for all posting behavior

### Negative

- Every business feature must declare its accounting impact before implementation
- Posting engine adds development complexity vs. simple income/expense tracking
- Classification errors in posting rules affect all stations — requires rigorous testing

### Permanent prohibitions

- No module bypasses Accounting for financial operations
- No direct manipulation of account balances
- No accounting calculations in UI (React components, forms, tables)
- No silent edits to historical posted transactions
- No treating owner withdrawals as expenses, borrowings as income, or transfers as profit/loss

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **Single-entry cash book** | Insufficient for enterprise audit; cannot produce balance sheet or reconcile payables/receivables |
| **Manual journal for all operations** | Violates business-first UX; error-prone for non-accountant operators |
| **External accounting integration (QuickBooks)** | Breaks offline-first; loses integrated inventory-to-COGS traceability |

---

## Compliance

Binding per Accounting Architecture document, Financial Posting Matrix, Business Invariants (Financial), `AI_DEVELOPMENT_PROTOCOL.md` §5, and `IMPLEMENTATION_GUIDE.md` §2.
