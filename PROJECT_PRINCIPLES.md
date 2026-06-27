   # Project Principles

## Enterprise Desktop ERP for Petrol Pumps

This document is the **cultural and decision-making guide** for FuelERP.

It is not a technical specification, architecture document, or coding standard. It defines **why** we build the way we do and **how** we choose when trade-offs arise.

Every developer, architect, tester, AI assistant, product owner, and future contributor must read this document before making changes.

---

## 1. Our Mission

FuelERP exists to help petrol pump and fuel station owners make **accurate decisions** with confidence.

A fuel station is not only a place where fuel is sold. It is a business where cash moves constantly, stock must be trusted, prices change with government policy, personal and business money can blur, and small mistakes can become large financial errors.

Our mission is to provide **trustworthy financial and operational information**—so owners know what they earned, what they owe, what stock they hold, and what happened to every important rupee and every important liter.

We build software that owners can rely on when the day ends, when the month closes, and when they look back years later.

---

## 2. Our Vision

FuelERP should become the **operating system for a fuel station business**.

Not a collection of screens. Not a spreadsheet with buttons. A coherent system that combines:

- **Simplicity** for daily operators  
- **Reliability** under real-world conditions—offline, busy shifts, power interruptions  
- **Financial accuracy** worthy of an accountant  
- **Operational excellence** in inventory, cash, and reporting  

Today, the product serves a single offline station. Tomorrow, it may support branches, companies, mobile access, and cloud sync. The vision remains the same: one trusted place where the business lives.

We measure success not by feature count, but by whether the owner sleeps better knowing the numbers are right.

---

## 3. Core Values

### Business First

We design for the petrol pump owner, manager, cashier, and accountant—not for the convenience of the codebase. Technology serves the business; the business does not serve the technology.

### Trust Through Accuracy

Trust is earned when numbers reconcile: stock matches reality, cash matches sales, profit matches effort, and reports match history. Accuracy is the foundation of every other value.

### Simplicity Over Complexity

Complexity is a cost paid by users every day. We choose simple workflows, clear language, and calm interfaces—even when the engine beneath is sophisticated.

### Automation Over Repetition

If the ERP can safely infer, calculate, or post something, the user should not do it twice. Repetition creates fatigue, errors, and distrust.

### Consistency Over Cleverness

Clever shortcuts break under pressure. Consistent rules, consistent language, and consistent behavior build habits users can depend on.

### Long-Term Maintainability

This product is built to last. We favor clarity, boundaries, and documentation over hacks that ship faster today and hurt tomorrow.

---

## 4. The Twenty Principles

**1. Business correctness is more important than feature count.**  
A wrong profit figure is worse than a missing report. We ship fewer features rather than wrong ones.

**2. Historical data is sacred and must never be silently changed.**  
What happened yesterday must still be true tomorrow. Corrections are visible, authorized, and traceable.

**3. Every liter of fuel must be traceable.**  
From purchase to sale, adjustment, or reconciliation—no fuel disappears without explanation.

**4. Every rupee must be traceable.**  
Cash, expenses, income, borrowing, repayment, and owner movements must have clear business meaning.

**5. Users work with business concepts, not accounting concepts.**  
They record sales, purchases, transfers, and withdrawals—not journals, debits, and credits during routine work.

**6. The ERP performs accounting automatically.**  
Accounting is the engine’s job. Users perform business actions; the system produces financial truth.

**7. Simplicity for users; sophistication inside the engine.**  
The interface should feel calm. The domain model may be rigorous. Never expose rigor as daily burden.

**8. Every report must be reproducible from stored data.**  
Running the same report for the same period must yield the same result unless an authorized correction occurred.

**9. Business rules belong in the domain, not the UI.**  
Screens change. Rules must not scatter across components where they cannot be tested or trusted.

**10. Inventory must always reflect reality.**  
System stock that disagrees with tanks without explanation destroys confidence. Reconciliation is a first-class responsibility.

**11. Every important action leaves an audit trail.**  
Who did what, when, and why must be answerable for financial and inventory events.

**12. The software should prevent mistakes rather than correct them later.**  
Validation, permissions, and clear warnings are cheaper than reversals and owner anxiety.

**13. Correctness always takes priority over speed.**  
A fast wrong answer is not a feature. Performance matters after correctness is assured.

**14. Features should reduce user effort, not increase it.**  
If a feature adds clicks, fields, or decisions without clear business value, it has failed.

**15. The architecture should support growth without redesign.**  
Offline today does not mean isolated forever. We build boundaries that allow cloud, branches, and integrations later.

**16. No feature is complete without validation, auditability, and documentation.**  
“Works on my machine” is not done. Done means trustworthy in production and understandable to the next contributor.

**17. Every module should have a single, clear responsibility.**  
Fuel, inventory, cash, accounting, and reporting each own their truth. Overlap creates contradiction.

**18. Business terminology should be used throughout the application.**  
Purchase, sale, stock, cash transfer, owner withdrawal, supplier due—the same words in training, UI, reports, and docs.

**19. When uncertain, ask rather than assume.**  
Assumed business rules become silent bugs. Clarify before coding, especially for money and stock.

**20. Build software that remains understandable ten years from now.**  
Future maintainers should not need archaeology to change behavior safely. Clarity is a gift to our future selves.

---

## 5. User Promise

We promise our users:

- **We will not silently change historical records.**  
  Past sales, prices, and posted activity remain explainable.

- **We will keep your business data consistent.**  
  Financial and inventory results will not contradict each other without visible reason.

- **We will protect your financial information.**  
  Access, permissions, backup, and audit exist to safeguard what you built.

- **We will minimize unnecessary work.**  
  Defaults, automation, and clear flows respect your time on busy days.

- **We will make complex accounting feel simple.**  
  You run the pump; we handle the ledger behind the scenes.

- **We will tell you when something is wrong—clearly.**  
  Errors will be understandable, not cryptic.

- **We will design for offline reality.**  
  Your station should operate fully without internet dependency.

---

## 6. Engineering Promise

We promise as a development team:

- **We will protect data integrity.**  
  Transactions are complete or not applied. Partial truth is unacceptable.

- **We will preserve architectural consistency.**  
  Boundaries exist to protect the business, not to satisfy fashion.

- **We will avoid shortcuts that compromise trust.**  
  Quick fixes that bypass accounting, inventory, or audit are rejected.

- **We will document important decisions.**  
  Future contributors should know why rules exist, not only what code does.

- **We will prioritize maintainability.**  
  Readable, testable, bounded code over clever one-offs.

- **We will test what must never break.**  
  Money, stock, historical prices, and posting behavior deserve proof.

- **We will explain conflicts honestly.**  
  When a request violates invariants, we say so and propose a compliant path.

---

## 7. Product Philosophy

Before any feature is implemented, it must answer three questions:

1. **What business problem does it solve?**  
   If it only adds capability without solving a real station need, pause.

2. **Does it make the user's work easier?**  
   If it adds complexity, typing, or decisions without reducing effort elsewhere, redesign.

3. **Does it preserve financial and inventory integrity?**  
   If it risks untraceable money, untraceable fuel, or silent history changes, it is not ready.

If the answer to **any** question is **no**, reconsider the feature—or redesign it until all three are **yes**.

Features exist to serve the owner’s decision-making, not to fill a checklist.

---

## 8. Decision Framework

When choices conflict, decide in this order:

| Priority | Principle | Why |
| --- | --- | --- |
| 1 | **Business Invariants** | Permanent rules define what “correct” means. |
| 2 | **Financial Integrity** | Wrong money destroys the product’s reason to exist. |
| 3 | **Inventory Accuracy** | Untraceable fuel corrupts profit and trust. |
| 4 | **User Trust** | Owners who doubt the system stop using it. |
| 5 | **Simplicity** | Simple systems are used correctly more often. |
| 6 | **Maintainability** | Unmaintainable software becomes wrong software. |
| 7 | **Performance** | Speed matters after correctness and clarity. |
| 8 | **Convenience** | Developer or user convenience never outranks truth. |

**Example:** A shortcut that saves development time but allows edited historical sales violates invariants and financial integrity—it is rejected regardless of convenience.

**Example:** A faster report that uses cached totals instead of stored transactions may violate reproducibility and trust—it is rejected until it meets integrity requirements.

---

## 9. What We Will Never Do

We will never:

- Modify historical transactions without a visible, auditable correction path  
- Mix business and personal accounting in ways that distort profit  
- Hide important business logic in UI, scripts, or undocumented corners  
- Introduce features that bypass architecture or accounting  
- Increase complexity without measurable business value  
- Compromise correctness for convenience or speed  
- Treat reports as sources of truth instead of views of truth  
- Allow inventory or cash to become unexplained  
- Guess business rules when requirements are unclear  
- Ship financial or inventory behavior without understanding accounting and stock impact  
- Optimize for demo screenshots at the expense of daily operation  
- Forget that real users work tired, rushed, and offline  

---

## 10. Final Statement

FuelERP is intended to become **trusted business software** that owners rely on every day.

Our goal is not simply to store data. It is to help people **understand and run their businesses with confidence**—when prices change, when stock is low, when cash is tight, when months close, and when years of history must still tell the truth.

We build with discipline, design with empathy, and steward the product for the long term.

**Correctness. Clarity. Trust. Always.**

---

*Project Principles — FuelERP*
