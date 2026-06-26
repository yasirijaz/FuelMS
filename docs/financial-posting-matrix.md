# Financial Posting Matrix

## 1. Purpose

A Financial Posting Matrix defines how business actions affect the financial records of the ERP. It translates everyday petrol pump operations, such as buying fuel, selling fuel, paying expenses, receiving rent, borrowing money, or adjusting tank stock, into standardized accounting behavior.

The matrix is not a user workflow and it is not a technical database design. It is a business and accounting policy document that explains what the accounting engine must do automatically when a user records a real-world business event.

In a petrol pump ERP, business users should perform business actions, not accounting tasks. When an owner records a fuel purchase, the system should understand that stock has increased, a supplier may be payable, cash or bank may be reduced, and future profit calculations must include the cost of that stock. When a cashier records a fuel sale, the system should understand that revenue has been earned, inventory has reduced, cash or receivable has increased, and cost must be recognized.

Routine operations should never require users to manually create accounting journals. Manual journal creation for daily work increases cognitive load, creates duplicate data entry, introduces avoidable errors, and makes the system dependent on accounting knowledge that many business users do not have. Manual journals should be reserved for controlled accountant-only corrections, reversals, and period-end adjustments.

The purpose of the Financial Posting Matrix is to ensure that the ERP feels simple to operate while maintaining enterprise-grade accounting integrity internally.

## 2. User Interaction Philosophy

The core principle is simple:

Users perform business actions. The ERP performs accounting.

The owner, pump manager, cashier, or accountant should interact with the system in the language of the business. They should record that fuel was purchased, fuel was sold, salary was paid, electricity was paid, money was borrowed, or cash was transferred. They should not be asked to decide debit accounts, credit accounts, journal balancing, cost recognition, or inventory valuation logic for routine operations.

Accounting must remain transparent, not invisible. Business users should see understandable summaries such as stock reduced, cash received, supplier amount pending, profit updated, or liability reduced. Accountants and auditors should be able to inspect the accounting consequences behind each action, but that inspection should not be required during normal operation.

The ERP should reduce cognitive load by asking only for information that exists in the real business event. For example, a fuel sale screen should ask for product, quantity, price, payment method, customer if relevant, and reference. It should not ask users to select revenue accounts, inventory accounts, cost accounts, or balancing accounts.

The ERP should minimize data entry. Where the system can infer a value from configuration, recent behavior, active pricing, ownership rules, or business context, it should do so automatically while still allowing authorized correction when appropriate.

Duplicate data entry must be avoided. A sale should not be entered once in operations and again in accounting. An expense should not be recorded in one screen and manually journaled elsewhere. A borrowed amount should not require separate creation of a liability record if the borrowing action already provides the needed business facts.

Enterprise power and ease of use are not opposing goals. The design should expose simple workflows for owners and operators, while keeping stronger accounting controls, audit trails, period controls, reversals, and reports available to accountants. The system should be easy by default and powerful when needed.

## 3. Business Actions

### Purchase Fuel

Purpose: Record fuel acquired from a supplier or depot.

Business Meaning: The business has increased fuel stock and either paid immediately or created an obligation to pay.

Accounting Impact: Inventory value increases. Cash or bank decreases if paid immediately, or supplier payable increases if purchased on credit.

Required Validation: Supplier must be valid when credit is involved. Fuel product, quantity, purchase rate, purchase date, and payment terms must be valid. The system should check duplicate invoice references where available.

Expected Result: Fuel inventory and supplier/payment position are updated automatically, and the purchase becomes traceable for stock, cost, and financial reporting.

### Sell Fuel

Purpose: Record sale of fuel to a customer or walk-in buyer.

Business Meaning: The business has delivered fuel and earned revenue.

Accounting Impact: Revenue increases. Cash, bank, or customer receivable increases. Fuel inventory reduces. The cost of sold fuel is recognized using the configured valuation method.

Required Validation: Fuel product, quantity, selling price, date, and payment method must be valid. Inventory availability must be checked according to business policy. Duplicate sale references should be prevented.

Expected Result: Revenue, payment status, stock balance, and profit are updated automatically.

### Record Expense

Purpose: Record operating costs such as maintenance, salary, electricity, rent, transport, repair, or office expenses.

Business Meaning: The business has consumed a service, paid a cost, or incurred an obligation.

Accounting Impact: The relevant expense category increases. Cash or bank decreases if paid immediately, or payable increases if unpaid.

Required Validation: Expense category, amount, date, payment method, and vendor/payee information must be valid where required.

Expected Result: Expense reports, cash position, payables, and profit calculations update automatically.

### Receive Income

Purpose: Record non-fuel income such as rent income, property income, commission, service income, or miscellaneous income.

Business Meaning: The business has earned income outside standard fuel sales.

Accounting Impact: The relevant income category increases. Cash, bank, or receivable increases.

Required Validation: Income category, amount, date, source, and payment method must be valid.

Expected Result: Income reporting and financial position update automatically without requiring accounting knowledge.

### Transfer Cash

Purpose: Move funds between cash drawer, safe, bank, mobile wallet, owner-held cash, or other internal money locations.

Business Meaning: Money has moved within the business but no income or expense has occurred.

Accounting Impact: One money location decreases and another money location increases. Profit is not affected.

Required Validation: Source and destination must be different and active. Transfer amount must be positive. Available source balance should be checked or warned depending on policy.

Expected Result: Cash and bank balances reflect the movement without affecting revenue, expense, or profit.

### Borrow Money

Purpose: Record money received as a loan from a person, owner, bank, or other lender.

Business Meaning: The business has received funds and now owes repayment.

Accounting Impact: Cash or bank increases. Liability increases.

Required Validation: Lender, amount, date, receiving account, and loan terms or reference should be valid.

Expected Result: Funds become available in the business, and the liability is tracked automatically.

### Return Borrowed Money

Purpose: Record repayment of borrowed funds.

Business Meaning: The business has paid back part or all of an obligation.

Accounting Impact: Cash or bank decreases. Liability decreases. Interest, if applicable, is recognized separately as finance cost.

Required Validation: Borrowing record or lender must be valid. Repayment amount must not exceed outstanding balance unless authorized as a special settlement. Payment account must be valid.

Expected Result: Loan balance is reduced and cash/bank position is updated.

### Owner Withdrawal

Purpose: Record money or value taken out of the business by the owner for personal use.

Business Meaning: Business resources have been withdrawn by ownership and are not an operating expense.

Accounting Impact: Cash, bank, or stock decreases. Owner equity/drawings position changes. Business profit is not reduced as an expense.

Required Validation: Owner must be valid. Withdrawal type, amount, date, and source must be valid. The system should warn when available cash is insufficient.

Expected Result: Owner drawings are tracked clearly without distorting operating expenses.

### Inventory Adjustment

Purpose: Correct stock quantity due to measurement variance, damage, evaporation, reconciliation, or discovered error.

Business Meaning: Recorded stock differs from actual stock.

Accounting Impact: Inventory increases or decreases. The offset is recognized as inventory gain, inventory loss, shrinkage, or adjustment according to policy.

Required Validation: Product, adjustment reason, measured quantity, date, and authorization must be valid. Material adjustments should require approval.

Expected Result: Stock records align with physical reality and the financial effect is recorded automatically.

### Tank Adjustment

Purpose: Reconcile physical tank readings with system-calculated stock.

Business Meaning: Actual tank volume differs from expected stock due to temperature, calibration, evaporation, leakage, or measurement variance.

Accounting Impact: Inventory is adjusted up or down. Gains or losses are classified according to tank reconciliation policy.

Required Validation: Tank, fuel product, reading date, measured quantity, reason, and authorization must be valid.

Expected Result: Tank stock becomes accurate, variance is visible, and the financial effect is traceable.

### Opening Balance

Purpose: Establish starting balances when the ERP is first adopted or a new accounting period begins.

Business Meaning: The business is entering pre-existing cash, bank, receivable, payable, inventory, loan, and equity positions.

Accounting Impact: Starting balances are established across financial and inventory positions under controlled setup rules.

Required Validation: Opening date, balance categories, supporting evidence, and approval must be valid. Opening balances should be locked after approval.

Expected Result: The ERP starts from a reliable financial baseline.

### Closing Adjustment

Purpose: Record authorized period-end accounting corrections, accruals, provisions, valuation changes, or reclassifications.

Business Meaning: The accountant is finalizing financial results for a period.

Accounting Impact: Financial balances are adjusted according to approved accounting policy.

Required Validation: Period must be open for adjustment, user must be authorized, reason must be documented, and supporting evidence must be attached where required.

Expected Result: Financial reports reflect final approved accounting treatment for the period.

### Backup

Purpose: Preserve a recoverable copy of business records.

Business Meaning: The business is protecting continuity and audit evidence.

Accounting Impact: No financial value changes. Audit and operational continuity records are updated.

Required Validation: Backup location, user authorization, completion status, and integrity verification should be valid.

Expected Result: A verified backup exists and is traceable.

### Restore

Purpose: Recover business records from a previous backup.

Business Meaning: The business is replacing current records with a verified previous state.

Accounting Impact: Financial balances revert to the restored state. No new business transaction should be implied by restore itself.

Required Validation: Backup integrity, authorization, restore scope, restore date, and acknowledgement of consequences must be valid.

Expected Result: System state is restored safely with clear audit evidence of the restore event.

## 4. Financial Posting Matrix

| Business Action | Business Meaning | Accounts Affected | Financial Direction | Posting Trigger | Expected Result |
| --- | --- | --- | --- | --- | --- |
| Fuel Purchase | Fuel stock is acquired for resale. | Inventory, cash/bank or supplier payable. | Inventory increases; payment asset decreases or liability increases. | Approved fuel purchase is saved. | Stock value and supplier/payment position update. |
| Fuel Sale | Fuel is sold to a customer. | Revenue, cash/bank/receivable, inventory, cost of goods sold. | Income and payment asset increase; inventory decreases; cost is recognized. | Sale is completed or approved. | Revenue, stock, receivable/cash, and profit update. |
| Inventory Cost Recognition | Cost of sold fuel is matched to the sale. | Inventory and cost of goods sold. | Inventory value decreases; cost increases. | Fuel sale reduces stock. | Gross profit reflects actual inventory cost. |
| Pump Maintenance | Maintenance work is performed and paid or owed. | Maintenance expense, cash/bank or payable. | Expense increases; payment asset decreases or payable increases. | Maintenance expense is recorded. | Operating cost and payment status update. |
| Salary Payment | Employee salary is paid or accrued. | Salary expense, cash/bank or salary payable. | Expense increases; payment asset decreases or payable increases. | Salary transaction is approved. | Payroll cost is recognized and cash/payable updates. |
| Electricity Expense | Utility cost is paid or recorded. | Electricity expense, cash/bank or payable. | Expense increases; payment asset decreases or payable increases. | Electricity bill is recorded. | Utility cost appears in operating expenses. |
| Rent Income | Rent is earned from property or space. | Rent income, cash/bank or receivable. | Income increases; payment asset or receivable increases. | Rent income receipt or invoice is recorded. | Non-fuel income and collection status update. |
| Property Income | Property-related income is received or earned. | Property income, cash/bank or receivable. | Income increases; payment asset or receivable increases. | Property income is recorded. | Income reporting reflects the event. |
| Cash Transfer | Money moves between internal locations. | Source money account and destination money account. | One asset decreases; another asset increases. | Transfer is confirmed. | Total business value is unchanged; location balances update. |
| Owner Withdrawal | Owner takes money or value from the business. | Cash/bank/stock and owner drawings/equity. | Business asset decreases; owner withdrawal/equity position changes. | Withdrawal is recorded and authorized. | Owner use is tracked without treating it as expense. |
| Borrow Money | Business receives loan funds. | Cash/bank and loan liability. | Asset increases; liability increases. | Loan receipt is recorded. | Borrowed funds and obligation are visible. |
| Return Money | Business repays loan principal. | Cash/bank and loan liability. | Asset decreases; liability decreases. | Loan repayment is recorded. | Outstanding borrowing is reduced. |
| Inventory Gain | Actual stock is higher than recorded stock. | Inventory and inventory gain/adjustment account. | Inventory increases; gain or adjustment is recognized. | Approved stock count or tank reconciliation. | Stock is corrected and gain is traceable. |
| Inventory Loss | Actual stock is lower than recorded stock. | Inventory and inventory loss/shrinkage account. | Inventory decreases; loss or shrinkage is recognized. | Approved stock count or loss event. | Stock is corrected and loss is traceable. |
| Stock Adjustment | Authorized correction to product quantity or value. | Inventory and configured adjustment category. | Direction depends on approved adjustment. | Adjustment is approved. | Inventory and financial impact align with reality. |
| Tank Reconciliation | Tank reading is reconciled with system stock. | Fuel inventory and tank variance category. | Inventory increases or decreases based on variance. | Reconciliation is finalized. | Tank balances and variance reporting update. |
| Journal Reversal | A previous accounting consequence is reversed under control. | Same affected categories as original posting. | Original financial effect is neutralized. | Authorized reversal is approved. | Error correction is traceable without deleting history. |
| Month Closing | Monthly results are finalized. | Period control, retained reports, adjustment categories where applicable. | Normal activity is locked; approved adjustments may be applied. | Accountant closes the month. | Reports become stable and routine edits are restricted. |
| Year Closing | Annual financial results are finalized. | Equity/retained earnings and period control categories. | Annual result is carried forward according to policy. | Accountant closes the fiscal year. | New year starts with controlled opening positions. |

This matrix describes accounting behavior conceptually. The accounting engine should determine the exact postings based on configuration, business rules, active chart of accounts, tax settings, and period controls.

## 5. Automatic Posting Rules

Fuel sale posting must be automatic. When a sale is recorded, the ERP should update revenue, payment or receivable position, fuel inventory quantity, inventory value, and cost recognition. The user should only enter sale facts.

Fuel purchase posting must be automatic. When fuel is purchased, the ERP should update stock and either reduce the selected payment account or increase supplier payable. The user should not separately record inventory and finance effects.

Inventory cost recognition must be automatic. The ERP should calculate cost using the configured valuation policy and recognize that cost when stock is sold, adjusted, or written off.

Expense posting must be automatic. When a user records electricity, maintenance, salary, rent, transport, or other operating cost, the ERP should map the selected business category to the correct expense behavior.

Income posting must be automatic. Non-fuel income should be mapped to the correct income category based on the income type, while payment or receivable position updates automatically.

Borrowing must automatically create a liability. The user records who provided money, how much was received, and where it was deposited. The ERP maintains the outstanding obligation.

Loan repayment must automatically reduce liability. If the payment includes interest, the system should separate repayment of principal from finance cost using guided business fields.

Cash transfer must never affect profit. The ERP should treat it as movement between internal money locations.

Owner withdrawal must not be treated as an operating expense. The ERP should classify it as owner drawings or equity movement to preserve accurate profitability.

Inventory and tank adjustments must automatically classify gains and losses according to approved reasons, tolerance limits, and authorization rules.

Reversals must preserve history. The ERP should not delete original financial consequences for approved transactions. It should create a controlled reversal behavior that auditors can trace.

## 6. User Simplicity Principles

Every screen should ask for business information only. A fuel purchase asks for supplier, product, quantity, rate, date, invoice reference, and payment status. A sale asks for product, quantity, selling price, customer if applicable, and payment method. An expense asks for category, amount, payee, date, and payment method.

The ERP fills accounting details automatically from configuration. Business users should not manually select debit and credit treatment, balance journals, calculate profit, calculate inventory valuation, or decide which financial statements are affected.

Users should never manually balance journals for routine operations. If a routine transaction cannot be posted automatically, the system design has failed or configuration is incomplete.

Users should never manually calculate profit. Profit should emerge from sales, cost recognition, expense recording, income recording, and inventory valuation.

Users should never manually calculate inventory valuation. The valuation method should be configured once and applied consistently.

Enterprise UX should be progressive. Owners and operators see simple business forms and clear confirmations. Accountants see deeper posting previews, audit trails, period controls, and reports. Administrators configure posting rules, defaults, permissions, and account mappings.

The best UX for this ERP is not to expose more accounting fields. It is to remove unnecessary decisions, prevent invalid actions, explain consequences in business language, and keep the accounting engine reliable.

## 7. Smart Defaults

Remember last selected account. If a user usually pays electricity from a particular bank account, the ERP should suggest that account next time.

Automatically suggest fuel price. The ERP should suggest the latest active selling price for the product, pump, or government pricing period.

Automatically determine active government fuel price. Where regulated pricing applies, the ERP should use the active price for the transaction date and warn when users try to override it.

Automatically suggest payment account. Based on user role, location, shift, or previous behavior, the system should suggest cash drawer, bank, or wallet.

Automatically suggest expense category. Repeated payees and descriptions should suggest the likely expense category while still allowing authorized correction.

Automatically calculate totals. Quantity, rate, discount, tax, fees, and net amount should calculate instantly from business fields.

Automatically generate references. Purchases, sales, transfers, adjustments, and closings should receive consistent references for audit and lookup.

Automatically create financial postings. Once a business action is saved or approved, the accounting consequence should be generated without extra user work.

Automatically detect related party. Owner, supplier, customer, employee, and lender profiles should guide whether an action affects payable, receivable, loan, salary, drawing, or income behavior.

Automatically select posting policy. The ERP should choose the correct accounting behavior from transaction type, payment status, product type, counterparty, and configuration.

## 8. Error Prevention

Prevent negative inventory unless the business explicitly allows controlled exceptions. Fuel sale or transfer should check available stock and warn or block based on policy.

Prevent duplicate sales by checking references, shift context, pump/nozzle readings, invoice numbers, and suspicious repeated entries.

Warn before owner withdrawals exceed available cash. The warning should use business language, such as the selected cash source does not have enough balance.

Warn before deleting records. For posted transactions, deletion should generally be replaced by reversal, cancellation, or correction.

Prevent invalid dates. Users should not post routine activity into closed periods, future dates beyond allowed tolerance, or dates before system opening without authorization.

Prevent inconsistent balances. The ERP should reject actions that would create impossible financial or inventory states.

Prevent unsupported payment combinations. A transaction should not be marked as fully paid unless payment details match the transaction amount.

Prevent unauthorized adjustments. Inventory losses, tank corrections, opening balances, closing adjustments, and reversals should follow permission and approval rules.

Prevent hidden accounting gaps. If required posting configuration is missing, the ERP should stop the transaction and explain which business setup is incomplete.

Prevent silent tax or pricing mistakes. If active price, tax rule, or valuation rule is missing, the system should warn before accepting the transaction.

## 9. Audit Philosophy

Every business action must remain traceable from the user-facing event to its accounting consequence.

Users should understand the business action: what happened, when it happened, who did it, who approved it, what amount was involved, which product or person was affected, and whether it was paid, unpaid, reversed, or adjusted.

Auditors should understand the accounting consequence: which financial categories were affected, why they were affected, which rule produced the consequence, and whether the transaction was later reversed or adjusted.

Auditability should not depend on exposing accounting complexity to business users. The system should maintain a clear chain:

Business event -> posting rule -> financial consequence -> report impact -> audit trail.

Routine corrections should preserve history. Posted transactions should not disappear. Reversals, amendments, and closing adjustments should be explicitly recorded with reason, authorization, timestamp, and user identity.

Backups and restores should also be auditable. They do not represent business income or expense, but they affect system integrity and must be traceable for operational assurance.

## 10. Architectural Recommendations

Design for business owners first. The default workflows should be simple enough for non-accountants to operate confidently.

Design for accountants second, not last. Accountants need posting transparency, reports, reversals, closing controls, audit trails, and configuration authority.

Centralize posting policy. Business actions should not each invent their own accounting behavior. The ERP should have one governed financial posting matrix that services follow consistently.

Separate business action from accounting consequence. Users record the event; the accounting engine interprets it through policy.

Make configuration explicit. Fuel products, payment accounts, expense categories, income categories, owner accounts, supplier terms, pricing rules, and inventory valuation methods should be configured deliberately.

Use guided corrections instead of unrestricted edits. Once a transaction has financial consequence, correction should happen through cancellation, reversal, amendment, or adjustment flows.

Protect closed periods. Period closing should prevent casual changes to finalized reports while allowing authorized accountant adjustments.

Support progressive complexity. A small petrol pump can run with defaults, while larger enterprise customers can configure branches, tanks, shifts, approvals, detailed reports, and stricter controls.

Keep domain language stable. Terms such as purchase, sale, transfer, withdrawal, borrowing, repayment, adjustment, and closing should be consistent across UX, reporting, training, and audit.

Treat automation as an accounting control. Automatic posting reduces error, but only if rules are explicit, reviewed, tested, and auditable.

## 11. Open Questions

What inventory valuation method should be used for fuel: weighted average, FIFO, regulated cost, or another policy?

Should the ERP allow negative inventory under any emergency operating mode, or should it always block it?

How should evaporation, temperature variance, leakage, and calibration differences be classified for tank reconciliation?

Which actions require approval before posting: large expenses, inventory losses, owner withdrawals, reversals, opening balances, and closing adjustments?

Should fuel sales be posted immediately, at shift close, or both with provisional and final states?

How should cash drawer, safe, bank, mobile wallet, and owner-held cash be modeled from a business perspective?

Should supplier credit purchases and cash purchases use the same workflow with different payment status, or separate workflows?

How should customer credit sales be controlled, and what limits or warnings should apply?

Should owner contributions and owner withdrawals be available to normal users or accountant/admin users only?

How should loan interest be captured: included in repayment workflow, separate finance expense, or scheduled automatically?

What period closing rules are required for daily close, monthly close, and year close?

What audit evidence is mandatory for reversals, adjustments, backup, restore, and closing?

Which reports must reconcile directly to business actions: fuel sales report, tank report, cash report, supplier payable report, profit report, and owner drawings report?

What level of accountant override is acceptable without weakening the simplicity and reliability of routine operations?
