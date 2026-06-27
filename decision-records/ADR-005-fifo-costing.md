# ADR-005: FIFO as the Default Inventory Costing Method

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-06-26 |
| **Deciders** | Architecture team |
| **Related** | ADR-004 (DDD), ADR-007 (Double-entry accounting) |

---

## Context

Fuel stations receive fuel in discrete deliveries (batches) at different purchase costs. When fuel is sold, the ERP must determine **cost of goods sold (COGS)** to calculate accurate profit margins.

Petrol pump operators and accountants expect:

- Every liter traceable from purchase to sale
- Cost recognized in the order stock was received (First-In, First-Out)
- Deterministic, reproducible COGS — the same sale history must always produce the same cost
- COGS posted automatically to accounting when a sale is recorded

Alternatives considered: weighted average cost, specific identification, LIFO.

---

## Decision

Adopt **FIFO (First-In, First-Out)** as the default and primary inventory costing method for fuel inventory in Version 1.

### Core rules

1. **Batch traceability** — Every fuel purchase creates or adds to a traceable batch with quantity and unit cost
2. **Consumption order** — Sales consume available batches in receipt order (earliest batch first; same-day batches ordered by receipt timestamp)
3. **Deterministic allocation** — Given the same batch inventory state and sale quantity, FIFO allocation must always produce identical results
4. **Immutable sale cost** — Once a sale is posted, its COGS and consumed batch references are permanent
5. **No negative inventory** — Sales cannot consume more than available stock (unless a formally approved future policy allows controlled exceptions)
6. **Accounting integration** — FIFO-derived COGS drives automatic journal posting: Debit COGS / Credit Inventory at consumed batch costs

### Domain ownership

| Concern | Owner |
| --- | --- |
| Batch creation on purchase | Fuel Operations context |
| FIFO consumption algorithm | Inventory domain service |
| COGS calculation on sale | Inventory + Accounting coordination |
| Journal posting of COGS | Accounting context (via posting rules) |

FIFO consumption logic lives in a **domain service** (`InventoryValuationService` or equivalent), not in UI or repository code.

### Example behavior

Two diesel batches received on the same day:

| Batch | Received | Quantity | Unit Cost |
| --- | --- | --- | --- |
| AM delivery | 08:00 | 5,000 L | Rs. 280/L |
| PM delivery | 14:00 | 3,000 L | Rs. 285/L |

Sale of 6,000 L consumes: 5,000 L @ Rs. 280 + 1,000 L @ Rs. 285.

COGS = (5,000 × 280) + (1,000 × 285) = Rs. 1,685,000.

---

## Consequences

### Positive

- Matches common petrol pump accounting practice in Pakistan and similar markets
- Batch traceability satisfies audit requirements ("where did this liter come from?")
- Deterministic algorithm is fully unit-testable
- Aligns with Financial Posting Matrix: sale → revenue + FIFO COGS + inventory reduction

### Negative

- More complex than weighted average (must track batch-level quantities)
- Price volatility across batches produces varying margins even at constant selling price
- Multi-batch sales require careful transaction atomicity (inventory + accounting in one Unit of Work)

### Future considerations

- A **configured valuation method** per product may be supported in a future version (e.g., weighted average for non-fuel items)
- Any change to costing method requires explicit architectural approval and documentation update
- Historical sales must never be recalculated when costing policy changes — only future sales use the new method

---

## Alternatives Considered

| Option | Rejected because |
| --- | --- |
| **Weighted average** | Obscures batch traceability; harder to reconcile physical deliveries with system stock |
| **LIFO** | Not standard practice for fuel retail in target market; complicates audit narrative |
| **Specific identification** | Impractical at pump scale where individual liters are not tracked to specific delivery trucks at sale time |

---

## Compliance

Binding per Business Invariants (inventory traceability), `AI_DEVELOPMENT_PROTOCOL.md` §6, Financial Posting Matrix (Sell Fuel), and `BUSINESS_EXAMPLES.md` (FIFO scenarios).
