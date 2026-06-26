# User Experience Architecture

## 1. UX Vision

The ERP must feel simple enough for daily petrol pump operations while supporting enterprise-grade accounting, audit, controls, reporting, and growth behind the scenes. The user experience should resemble the confidence and clarity of a mobile banking app: focused screens, clear language, fast actions, and trustworthy outcomes.

### Business First

The ERP should present work in business language, not system language. Users record fuel sales, fuel purchases, cash transfers, expenses, income, stock checks, and repayments. They should not be asked to understand internal accounting treatment during routine work.

### Accounting Hidden

Accounting must happen automatically in the background. The interface should explain consequences in simple business terms such as stock updated, cash received, supplier balance increased, or loan reduced. Accountants can inspect the financial detail when needed, but operators should not be forced into accounting decisions.

### Simple By Default

The default experience should show only what most users need most of the time. Common actions should be immediately visible. Rare actions, administrative controls, and accountant-only features should be available through permissioned areas rather than crowding daily workflows.

### Advanced When Needed

Enterprise capability should exist without overwhelming ordinary users. Advanced posting review, approvals, reversals, closing controls, configuration, and audit history should be available to authorized users at the correct moment.

### Keyboard Friendly

Cashiers and accountants need speed. The ERP should support complete operation using keyboard navigation, predictable tab order, shortcuts for frequent actions, and fast search. Mouse usage should be optional for high-volume data entry.

### Fast Data Entry

Daily transaction entry must be optimized for speed. Forms should use smart defaults, remembered selections, auto-complete, calculated totals, and minimal required fields. A user should feel guided, not interrogated.

### Low Cognitive Load

Each screen should answer: What am I doing? What information is required? What will happen when I save? Users should not have to remember accounting rules, hidden prerequisites, or complex navigation paths.

## 2. UX Personas

### Owner

Goals:

- Understand sales, profit, cash, fuel stock, receivables, payables, and owner withdrawals.
- Make quick decisions without studying accounting reports.
- Ensure staff cannot make uncontrolled changes.
- Keep the business safe through backups and audit visibility.

Daily tasks:

- Check dashboard summaries.
- Review sales and cash.
- Approve large expenses, stock adjustments, or withdrawals.
- View profit and stock position.
- Monitor pending supplier and borrower balances.

Pain points:

- Accounting terminology feels complex.
- Manual reports are slow and unreliable.
- Cash leakage, stock mismatch, and staff mistakes are hard to detect.
- Too many screens or reports reduce confidence.

Technical knowledge:

- Usually comfortable with mobile apps and basic business software.
- May not be comfortable with technical setup or complex configuration.

Accounting knowledge:

- Basic understanding of profit, cash, expense, stock, and dues.
- Usually not comfortable with debits, credits, journals, or valuation methods.

What they should see:

- A simple business dashboard.
- Clear summaries of sales, profit, stock, cash, pending amounts, and alerts.
- Approval tasks and exception reports.
- Business-language explanations, not accounting mechanics.

### Manager

Goals:

- Keep daily operations accurate and complete.
- Supervise cashiers, stock, purchases, expenses, and shift activity.
- Detect operational exceptions quickly.
- Prepare reliable information for the owner and accountant.

Daily tasks:

- Record or review fuel purchases.
- Monitor sales entries and shift closing.
- Check tank and stock levels.
- Record expenses and cash transfers.
- Resolve alerts and pending tasks.

Pain points:

- Re-entering the same data in multiple places.
- Unclear responsibility for mistakes.
- Slow forms during busy periods.
- Reports that do not match operational reality.

Technical knowledge:

- Comfortable with routine software workflows.
- Needs direct, predictable navigation.

Accounting knowledge:

- Understands operational money and stock movement.
- Limited need for formal accounting concepts.

What they should see:

- Operational workflows for sales, purchases, stock, expenses, cash, and people.
- Alerts requiring action.
- Simple reconciliation tools.
- Approval status and exception history.

### Cashier

Goals:

- Record sales and receipts quickly.
- Avoid mistakes during busy periods.
- Know cash position for the shift.
- Close shift with minimal friction.

Daily tasks:

- Record fuel sales or receive payments.
- Select payment method.
- Handle customer credit where permitted.
- Review recent entries.
- Close cash shift.

Pain points:

- Long forms.
- Too many required decisions.
- Slow saving.
- Confusing correction process.
- Fear of making accounting mistakes.

Technical knowledge:

- May be limited.
- Needs a highly guided, repeatable experience.

Accounting knowledge:

- Minimal.
- Should never be exposed to accounting entries.

What they should see:

- Fast sale entry.
- Clear payment options.
- Recent transactions.
- Simple error messages.
- Shift totals and cash count guidance.

### Accountant

Goals:

- Trust that routine transactions post correctly.
- Review accounting consequences.
- Close periods.
- Manage corrections, reversals, reports, and compliance.
- Support the owner with accurate financial insight.

Daily tasks:

- Review postings and exceptions.
- Reconcile cash, bank, stock, receivables, payables, and loans.
- Run financial and operational reports.
- Perform closing adjustments.
- Configure accounting mappings where authorized.

Pain points:

- Business users entering accounting incorrectly.
- Missing audit trails.
- Uncontrolled edits after reports are prepared.
- Weak reconciliation between operational and financial data.

Technical knowledge:

- Comfortable with business systems and reports.
- May not be technical in software engineering terms.

Accounting knowledge:

- Strong accounting knowledge.
- Needs transparent accounting behavior and control.

What they should see:

- Posting review.
- Period controls.
- Audit trails.
- Reconciliation views.
- Reports and accountant-only adjustments.

## 3. Navigation Philosophy

Navigation should be shallow, predictable, and business-oriented. Users should not need to understand the internal architecture of the ERP to find their work.

Primary navigation:

- Dashboard
- Sales
- Purchases
- Inventory
- Expenses
- Income
- People
- Cash
- Reports
- Settings

Dashboard is the command center. It should show today’s business state and provide shortcuts to urgent actions.

Sales should contain fuel sale workflows, recent sales, customer credit sales, and shift-related sale activity.

Purchases should contain fuel purchases, supplier bills, purchase history, and payment status.

Inventory should contain fuel stock, tank readings, adjustments, reconciliation, and stock movement history.

Expenses should contain operating expense entry, expense history, unpaid expenses, and recurring expense patterns.

Income should contain non-fuel income such as rent, property income, commission, and miscellaneous income.

People should contain customers, suppliers, employees, owners, lenders, and other parties.

Cash should contain cash drawer, safe, bank, wallet, transfers, borrowings, repayments, and owner withdrawals.

Reports should contain business reports first and accounting reports for authorized users.

Settings should be reserved for configuration and should not be required for daily operation.

Deep navigation should be avoided. A common task should be reachable in one or two actions from the dashboard or primary navigation. Recently used and frequently used actions should be available without forcing users through menus.

## 4. Workflow Architecture

### Record Fuel Purchase

Steps:

1. User opens Purchases and chooses Record Fuel Purchase.
2. User selects supplier or chooses cash purchase.
3. User selects fuel product.
4. User enters quantity, purchase rate, date, invoice reference, and payment status.
5. ERP calculates total and suggests payment account or supplier balance.
6. User reviews a business summary.
7. User saves or submits for approval if required.
8. ERP updates stock, payment/payable status, and audit trail automatically.

User effort: Low. The user provides purchase facts only.

### Record Fuel Sale

Steps:

1. User opens Sales or uses a dashboard shortcut.
2. User selects fuel product or pump/nozzle context.
3. User enters quantity or amount.
4. ERP suggests active selling price and calculates total.
5. User selects payment method or customer credit if permitted.
6. ERP checks stock, pricing, duplicate reference, and payment completeness.
7. User saves.
8. ERP updates sales, cash/receivable, stock, cost, profit, and audit trail automatically.

User effort: Very low. The workflow must support rapid repeat entry.

### Record Expense

Steps:

1. User opens Expenses and chooses Record Expense.
2. User selects or searches expense category.
3. User enters amount, date, payee, reference, and payment status.
4. ERP suggests payment account based on history and context.
5. User attaches evidence if required by policy.
6. User saves or submits for approval.
7. ERP updates expense reporting, cash/payable status, and audit trail.

User effort: Low. The system should remember frequent categories and payees.

### Record Income

Steps:

1. User opens Income and chooses Record Income.
2. User selects income type such as rent, property income, commission, or other.
3. User enters amount, source, date, reference, and payment method.
4. ERP suggests income category and receiving account.
5. User saves.
6. ERP updates income reporting, cash/receivable status, and audit trail.

User effort: Low. Non-fuel income should not require accounting setup during entry.

### Borrow Money

Steps:

1. User opens Cash and chooses Borrow Money.
2. User selects lender or creates a simple person record.
3. User enters amount, date, receiving account, and optional terms/reference.
4. ERP shows the future outstanding liability in business language.
5. User saves or submits for approval.
6. ERP updates cash/bank, borrowing balance, and audit trail.

User effort: Low. The user records the real-world borrowing event.

### Return Money

Steps:

1. User opens Cash and chooses Return Borrowed Money.
2. User selects lender or borrowing record.
3. ERP shows outstanding balance.
4. User enters repayment amount, date, and payment account.
5. ERP separates principal and interest guidance where applicable.
6. User saves or submits for approval.
7. ERP reduces outstanding balance and updates cash/bank automatically.

User effort: Low to medium depending on interest rules.

### Transfer Cash

Steps:

1. User opens Cash and chooses Transfer Cash.
2. User selects source and destination.
3. User enters amount, date, and reference.
4. ERP warns if source balance appears insufficient.
5. User confirms transfer.
6. ERP updates both money locations without affecting profit.

User effort: Very low.

### View Reports

Steps:

1. User opens Dashboard or Reports.
2. User selects a business question such as Today’s Sales, Profit, Stock, Cash, Payables, or Expenses.
3. ERP applies sensible date defaults.
4. User filters only if needed.
5. User reviews summary first, then drills into detail when required.

User effort: Low. Reports should answer questions before exposing filters.

### Backup

Steps:

1. Authorized user opens Settings or Dashboard alert.
2. User chooses Backup.
3. ERP explains what will be protected.
4. User selects destination only if needed.
5. ERP runs backup in the background and verifies completion.
6. User receives clear success or failure status.

User effort: Very low. Backup should be guided and confidence-building.

### Restore

Steps:

1. Authorized user opens Restore.
2. ERP explains the seriousness of replacing current data.
3. User selects backup source.
4. ERP validates backup and shows restore summary.
5. User confirms with elevated permission.
6. ERP restores and restarts into the recovered state.
7. ERP records a visible restore audit event.

User effort: Medium by design. Restore should be careful, not casual.

## 5. Dashboard Philosophy

The dashboard should show the current health of the petrol pump, not every available metric.

Priority content:

- Today’s sales.
- Today’s estimated profit.
- Current fuel stock.
- Cash balance by key location.
- Pending tasks.
- Alerts and warnings.

Today’s sales should be prominent and understandable. Users should know how much was sold today and whether it looks normal.

Today’s profit should be shown as an estimate when final cost, reconciliation, or closing is pending. The ERP should avoid false precision.

Current fuel stock should show critical products and tank warnings first. Stock should be represented in business terms: enough, low, mismatch, needs reconciliation.

Cash balance should highlight operational cash, bank, and pending customer/supplier positions without overwhelming the owner.

Pending tasks should include approvals, shift closings, unpaid expenses, supplier payments due, backup reminders, and reconciliation needs.

Alerts should be meaningful. The dashboard should not become a notification wall. Only items that require attention or indicate risk should appear.

## 6. Progressive Disclosure

The UX should reveal complexity based on role, permission, and context.

Normal users should see simple business workflows. A cashier records sales and payments. A manager records purchases, expenses, stock checks, and transfers. They should not see accounting configuration or advanced posting details.

Advanced users should see expanded review. Accountants can inspect posting behavior, audit trails, reconciliations, closing status, and correction workflows.

Administrators should see full controls. They manage settings, users, permissions, posting mappings, approval rules, backup settings, and business configuration.

Progressive disclosure should also happen within screens. A simple form appears first. Optional fields, advanced references, attachments, history, and audit details are available only when needed.

The goal is not to hide power. The goal is to place power where it belongs.

## 7. Data Entry Principles

Minimum typing should be the standard. Users should select from known products, people, categories, and payment accounts instead of typing repeated information.

Maximum automation should be used where the ERP can safely infer values. Prices, totals, dates, payment accounts, references, categories, and recent selections should be suggested.

Auto-complete should work across products, people, accounts, categories, and reports. Search should tolerate partial names, spelling differences, and common abbreviations.

The ERP should remember previous selections. Frequent supplier, payment account, fuel product, and expense category choices should appear first.

Keyboard shortcuts should support frequent actions such as new sale, save, search, add line, duplicate previous, open recent, and close form.

Tab navigation must be predictable. High-volume users should move through a form without touching the mouse.

Smart defaults should be visible but not intrusive. The user should understand what was suggested and be able to change it if authorized.

Calculated fields should update instantly. Totals, balances, remaining amount, stock impact, and warning states should not require manual calculation.

Forms should support correction before save. Users should be able to review business summaries and fix mistakes quickly.

## 8. Error Prevention

The ERP should prevent invalid quantities. Quantity must be positive where appropriate, within realistic ranges, and compatible with unit rules.

The ERP should prevent impossible dates. Routine transactions should not be allowed in closed periods, far future dates, or dates before opening balance setup unless authorized.

The ERP should warn before deleting. Posted business actions should usually be corrected through reversal or cancellation rather than deletion.

The ERP should warn before stock becomes negative. Where negative inventory is prohibited, the action should be blocked. Where allowed by policy, the warning should be clear and auditable.

The ERP should warn before cash becomes negative. Cash shortages may indicate missing transfers, incorrect payment method, or data entry error.

The ERP should prevent duplicate entries. Duplicate invoice numbers, sale references, suspicious repeated amounts, and repeated shift entries should be detected.

The ERP should prevent incomplete payments. A transaction marked paid should have payment details that match the expected amount.

The ERP should prevent unauthorized actions. Reversals, closing adjustments, restore, major withdrawals, and large stock losses should require proper permission.

Error messages should be specific and corrective. Instead of saying invalid transaction, the ERP should say the sale date is in a closed month or the selected tank does not have enough stock.

## 9. Confirmation Philosophy

Confirmation dialogs should appear only when the action is destructive, irreversible, financially significant, security-sensitive, or unusual.

Confirmations should appear for restore, reversal, closing a period, deleting an unposted draft, approving a large adjustment, posting into an unusual date, or overriding a critical warning.

Confirmations should not appear after every save, every navigation action, every normal sale, or every routine expense. Excessive confirmations train users to ignore warnings.

The ERP should prefer inline validation before confirmation. If a problem can be prevented while the user is entering data, it should not wait until the final save.

Confirmation language should explain the business consequence. A confirmation should say this will close the month and prevent normal edits, not simply are you sure?

## 10. Search Philosophy

Global search should help users find people, transactions, products, reports, and settings from one place. It should be forgiving, fast, and business-oriented.

Quick search should exist inside each module. Sales search should prioritize sale references, customers, dates, and amounts. Inventory search should prioritize product and tank. People search should prioritize name, phone, and role.

Recent items should be available because business users often return to the last sale, last purchase, recent customer, or recent report.

Favorites should support frequently used reports and workflows. Owners may favorite dashboard reports, while accountants may favorite reconciliation or closing views.

Frequently used actions should be promoted automatically or configurable by user. The ERP should adapt gently without becoming unpredictable.

Search results should be grouped by meaning. A search for a supplier should show the person, purchases, payments, and outstanding balance in understandable categories.

## 11. Accessibility

Font sizes should support long daily use. Critical numbers, labels, and actions should be readable on common desktop and laptop displays.

Color should not be the only way to communicate meaning. Warnings, errors, success, and status should use text, icons, labels, and layout in addition to color.

Keyboard-only operation should be fully supported for core workflows. Users should be able to navigate, search, enter data, save, and review without a mouse.

Forms should be readable and calm. Labels should be clear, fields should be grouped by business meaning, and required information should be obvious.

Error messages should be close to the affected field and written in plain language. They should tell users how to fix the problem.

Contrast should be strong enough for long work sessions and varied lighting conditions at petrol pump offices.

Touch targets should be large enough for future tablet use without compromising desktop density.

The UX should account for users who are tired, rushed, interrupted, or working in noisy operational environments.

## 12. Notifications

Notifications should be meaningful and limited.

Success notifications should confirm completion of important actions, especially saves, backups, approvals, and restores. Routine success messages should be brief and non-blocking.

Warning notifications should indicate risk, not minor inconvenience. Examples include low stock, negative cash risk, duplicate transaction suspicion, pending backup, or closing deadline.

Error notifications should explain what failed, why it matters, and what the user can do next.

Information notifications should be used sparingly for neutral system messages, such as background task started or report is being prepared.

Background task notifications should show progress where needed and final status when complete. Backup, restore, report generation, and large imports should never leave users guessing.

Notifications should be role-aware. A cashier should not receive accountant-only configuration alerts unless it affects their current task.

## 13. Offline Experience

The ERP is offline-first, so saving should feel immediate and reliable. Users should not think about network connectivity for local daily operations.

Backups should be visible and confidence-building. The system should remind authorized users when backups are overdue and clearly show the last successful backup.

Restore should be treated as a controlled recovery process. Users should understand that restore replaces the current working state with a verified previous state.

Unexpected shutdowns should not create user panic. On restart, the ERP should communicate whether unsaved drafts were recovered, whether the last transaction was saved, and whether any integrity check is needed.

Power failures are common in some operating environments. The UX should assume interruptions and help users resume quickly with recent actions, recovery messages, and clear status.

Application restart should return users to a sensible state. The dashboard should show current health, recent transactions, pending tasks, and any recovery notice.

Offline-first does not mean silent. The system should clearly communicate backup status, restore status, and any local data protection issue.

## 14. Performance Goals

Opening common screens should feel instant, with a target below 300ms for daily modules such as Dashboard, Sales, Expenses, Cash, and Inventory.

Saving a routine transaction should complete below 500ms in normal local conditions. If approval, backup, or large validation is involved, the UI should still respond immediately and explain progress.

Search should return useful results below 200ms for common local data. Users should see immediate feedback while typing.

Reports should be fast enough for daily operations. Today’s sales, cash, stock, and expense summaries should open quickly. Heavier reports should show progress and allow users to continue working where possible.

Keyboard navigation and field-to-field movement should have no noticeable delay.

Performance should be measured by user perception. A technically fast screen that requires many clicks still feels slow.

## 15. Enterprise UX Guidelines

Design for ten years of growth by protecting simplicity from the beginning.

Avoid feature overload. New features should fit into existing business concepts instead of creating new top-level navigation for every capability.

Avoid unnecessary configuration. Defaults should allow a small petrol pump to operate quickly, while advanced configuration remains available for complex businesses.

Avoid exposing accounting terminology to business users. Use purchase, sale, payment, stock, supplier due, customer due, owner withdrawal, and profit instead of journal, debit, credit, ledger, and posting where possible.

Use consistent terminology across screens, reports, alerts, and training. Inconsistent names create hidden complexity.

Keep role boundaries clear. Cashiers, managers, owners, accountants, and administrators need different depth, not entirely different mental models.

Design reports from business questions. Users ask how much did we sell, how much cash do we have, what stock remains, who do we owe, who owes us, and how much profit did we make?

Make exceptions visible. Enterprise systems become difficult when problems are hidden. Low stock, unreconciled tank readings, pending approvals, overdue backups, and closing issues should be easy to find.

Preserve trust. Users must believe that when they save a transaction, the ERP has updated everything necessary.

## 16. UX Anti-Patterns

Long forms should be avoided. If a form feels long, it should be split by business stage, use defaults, hide optional details, or move rare fields into advanced sections.

Nested dialogs should be avoided. Users should not feel trapped inside layers of popups. Complex actions should use clear guided flows.

Duplicate data entry should never be required. A business action should feed accounting, reporting, audit, and stock automatically.

Manual accounting for routine operations should not exist. If users must create journals for normal sales, purchases, expenses, income, cash transfers, or borrowings, the UX has failed.

Confusing terminology should be avoided. Internal accounting or technical labels should not appear in daily workflows.

Hidden actions should be avoided. Important actions such as save, cancel, reverse, approve, print, backup, and close should be discoverable for authorized users.

Inconsistent navigation should be avoided. Similar screens should behave similarly across modules.

Excessive confirmations should be avoided. They slow users down and reduce attention to truly important warnings.

Silent failures should never happen. If saving, backup, restore, or reporting fails, the user must understand the status.

Over-customization should be controlled. Too many settings can make the system hard to support and hard to learn.

## 17. Future Readiness

The UX architecture should support cloud expansion without changing the user’s mental model. Dashboard, Sales, Purchases, Inventory, Cash, People, Reports, and Settings should remain stable whether the data is local, synced, or cloud-hosted.

Mobile should focus on approvals, dashboard review, alerts, basic sales summaries, stock checks, and owner decisions. It should not attempt to expose every desktop workflow at once.

Tablet should support field operations, stock checks, tank readings, manager approvals, and simplified POS-style entry.

Multi-branch support should add branch context without redesigning workflows. Users should see branch selection, branch summaries, and consolidated reporting based on permission.

Multi-company support should preserve the same navigation but introduce company context, switching, permissions, and consolidated reporting.

The design system should allow growth in depth, not clutter in width. New capabilities should extend existing workflows through progressive disclosure, role permissions, and contextual actions.

## 18. Open Questions

Which workflows must be optimized for cashier-speed entry versus manager review?

Should fuel sales be recorded per transaction, per pump reading, per shift, or through multiple modes depending on station workflow?

What is the minimum dashboard needed for owners on day one?

Which actions should appear as dashboard shortcuts for each persona?

How much accounting detail should accountants see by default before it becomes overwhelming?

Should the ERP support a simplified mode for very small petrol pumps and an advanced mode for larger operators?

What correction workflows should ordinary users be allowed to perform without accountant approval?

How should shift closing work from a UX perspective?

What information must be available during a power failure recovery flow?

Which reports should be designed as owner-friendly summaries versus accountant-grade detail?

What terminology should be standardized for local market users, especially around cash, borrowing, owner withdrawals, tank readings, and supplier dues?

Which keyboard shortcuts are essential for daily operation?

What accessibility requirements are mandatory for the first release?

How should mobile, tablet, cloud, multi-branch, and multi-company experiences be phased without increasing complexity for current users?
