# Business Examples & Acceptance Scenarios

## FuelERP — Enterprise Desktop ERP for Petrol Pumps

**Document status:** Official business truth  
**Authority:** If implementation and this document disagree, **the implementation is wrong.**

This document defines realistic business scenarios from daily petrol pump operations. Every scenario must be satisfiable by the ERP without violating Business Invariants, Accounting Architecture, Financial Posting Matrix, or User Experience Architecture.

**Audience:** Developers, testers, accountants, business owners, AI coding assistants.

**Assumptions for examples:**

- Currency: PKR (Rs.)
- Products: Petrol, Diesel, HOBC
- Version 1: Single station, offline, SQLite-backed, business-first UX
- Routine users perform business actions; accounting is automatic
- Historical sales preserve price at time of sale
- Inventory costing follows FIFO when fully enabled; examples state expected cost behavior conceptually

---

## Scenario Template Reference

Every scenario in this document includes:

1. Scenario Name  
2. Business Context  
3. Initial State  
4. User Action  
5. Expected Business Result  
6. Expected Accounting Effect  
7. Expected Inventory Effect  
8. Expected Reports  
9. Audit Expectations  
10. Edge Cases  
11. Acceptance Criteria  

---

# Part A — Fuel Price Scenarios

## A1. Government Increases Diesel Price

**1. Scenario Name**  
Government increases diesel selling price

**2. Business Context**  
 OGRA/government notification increases diesel retail price effective immediately. Manager must update price before next diesel sale.

**3. Initial State**  
- Diesel active price: Rs. 280.00/liter (effective since 1 Jan)  
- Petrol and HOBC unchanged  
- No pending scheduled diesel price  
- Historical diesel sales exist at Rs. 280.00

**4. User Action**  
Owner/manager opens Fuel Price Management, enters new diesel price Rs. 295.00/liter, effective date/time = notification time, saves.

**5. Expected Business Result**  
- New diesel price recorded and activated (or scheduled if future-dated)  
- Current price display shows Rs. 295.00 for diesel  
- Future diesel sales will use Rs. 295.00  
- All prior diesel sales remain at Rs. 280.00

**6. Expected Accounting Effect**  
- **None** from price change alone  
- Accounting impact occurs only when diesel is sold at new price (revenue at Rs. 295.00)

**7. Expected Inventory Effect**  
- **None** — selling price does not change stock quantity or purchase cost

**8. Expected Reports**  
- Current Prices: diesel = Rs. 295.00  
- Price History: shows Rs. 280.00 → Rs. 295.00 with effective time  
- Historical sales report for yesterday: still uses Rs. 280.00 per liter on those sales

**9. Audit Expectations**  
- User, timestamp, old price, new price, product, effective time, reason/reference recorded  
- No silent modification of historical price records used by sales

**10. Edge Cases**  
- Sale in progress at exact change time: sales before effective time use old price; after use new price  
- Cashier sees updated active price on next sale entry

**11. Acceptance Criteria**  
- [ ] New diesel sales use Rs. 295.00  
- [ ] Old sales unchanged in amount and stored price  
- [ ] Re-running yesterday’s sales report yields identical totals  
- [ ] No journal created solely for price change

---

## A2. Government Decreases Petrol Price

**1. Scenario Name**  
Government decreases petrol selling price

**2. Business Context**  
Petrol price reduced by government. Station must reflect lower price for future sales.

**3. Initial State**  
- Petrol active price: Rs. 265.00/liter  
- Stock available  
- Sales today at Rs. 265.00 already recorded

**4. User Action**  
Manager records petrol Rs. 258.00/liter effective immediately.

**5. Expected Business Result**  
- Active petrol price = Rs. 258.00  
- Sales after activation use lower price  
- Earlier today’s sales remain at Rs. 265.00

**6. Expected Accounting Effect**  
- None until sale at new price (lower revenue per liter)

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Price Change History shows decrease  
- Today’s sales report may show mixed prices if change mid-day — each sale shows its stored price

**9. Audit Expectations**  
- Decrease documented; user attributable

**10. Edge Cases**  
- Manager attempts to “fix” morning sales to new price — **must be blocked** or require controlled reversal workflow, not price rewrite

**11. Acceptance Criteria**  
- [ ] Price decrease applies forward only  
- [ ] Mixed-price day report is correct per sale  
- [ ] Profit for past sales not recalculated using new price

---

## A3. Government Changes All Fuel Prices

**1. Scenario Name**  
Simultaneous price change for petrol, diesel, and HOBC

**2. Business Context**  
Single government notification updates all three products. Owner wants one workflow under one minute.

**3. Initial State**  
- Current: Petrol 265, Diesel 280, HOBC 320  
- Authorized user logged in

**4. User Action**  
Owner updates all three prices on one screen with shared effective date/time, confirms summary showing old vs new for each product.

**5. Expected Business Result**  
- Three price records (or one batch action with three products)  
- Each product has one active price after effective time  
- Confirmation states historical sales unchanged

**6. Expected Accounting Effect**  
- None until respective product sales occur

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Current Prices lists all three  
- Price History filterable by product

**9. Audit Expectations**  
- Batch change traceable; each product line auditable

**10. Edge Cases**  
- User updates only two products — system requires explicit confirmation that third is unchanged

**11. Acceptance Criteria**  
- [ ] All three products updatable in one workflow  
- [ ] Each product independent active price  
- [ ] Workflow completable in under one minute (UX target)

---

## A4. Future Scheduled Price Activation

**1. Scenario Name**  
Schedule price for midnight activation

**2. Business Context**  
Notification says new diesel price effective 12:00 AM tomorrow.

**3. Initial State**  
- Diesel Rs. 280 active now  
- Scheduled diesel Rs. 295 from tomorrow 00:00 (pending)

**4. User Action**  
Manager schedules diesel Rs. 295 effective next day 00:00; saves.

**5. Expected Business Result**  
- Until midnight: sales use Rs. 280  
- From 00:00: sales use Rs. 295 automatically  
- Event: `FuturePriceScheduled`, then `PriceActivated`

**6. Expected Accounting Effect**  
- None at schedule time; revenue follows sale-time price after activation

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Current Prices shows active now + pending future price if UX displays schedule  
- After activation, history shows activation event

**9. Audit Expectations**  
- Schedule created by user; activation logged (system or user-visible)

**10. Edge Cases**  
- Correction before activation: allowed if policy permits  
- Sale at 23:59 vs 00:01 must use different prices

**11. Acceptance Criteria**  
- [ ] No sale before effective time uses new price  
- [ ] Sales after effective time use new price without manual re-entry  
- [ ] Scheduled price visible to authorized users

---

## A5. Attempt to Modify Historical Prices

**1. Scenario Name**  
User tries to edit price already used by posted sales

**2. Business Context**  
Accountant discovers old price entry typo; attempts to edit January petrol price already used by hundreds of sales.

**3. Initial State**  
- January petrol price Rs. 260 used on 500+ sales  
- Current month different price

**4. User Action**  
Authorized user attempts to change historical active price record for January.

**5. Expected Business Result**  
- **Blocked** with clear message: historical prices are immutable once used  
- Alternative: controlled correction process documented separately (reversal/adjustment policy), not silent edit

**6. Expected Accounting Effect**  
- No retroactive journal from price edit

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- January reports unchanged

**9. Audit Expectations**  
- Blocked attempt may be logged if policy requires

**10. Edge Cases**  
- Edit scheduled but never-activated future price — may be allowed

**11. Acceptance Criteria**  
- [ ] Cannot change price record tied to posted sales  
- [ ] Historical report totals unchanged

---

## A6. Historical Report After Multiple Price Changes

**1. Scenario Name**  
Profit report for Q1 after six price changes

**2. Business Context**  
Owner needs March profit; prices changed six times in quarter.

**3. Initial State**  
- Q1 sales each store own `applied_selling_price`  
- Q1 purchases and FIFO consumption recorded

**4. User Action**  
Owner runs Profit & Loss for 1 Jan – 31 Mar.

**5. Expected Business Result**  
- Revenue = sum of (quantity × stored sale price) per sale  
- COGS from FIFO/consumption policy  
- Report identical if re-run months later

**6. Expected Accounting Effect**  
- Report reads posted journals and sale facts; does not recalculate revenue from current price table

**7. Expected Inventory Effect**  
- Closing stock from movements, not from price list

**8. Expected Reports**  
- P&L, fuel margin, sales by product with price variance visible if designed

**9. Audit Expectations**  
- Report generation logged if sensitive; data lineage to transactions

**10. Edge Cases**  
- Reversed sales excluded or shown net per policy

**11. Acceptance Criteria**  
- [ ] Q1 P&L reproducible bit-for-bit on repeat run  
- [ ] Current price changes do not alter Q1 revenue

---

# Part B — Fuel Purchase Scenarios

## B1. Purchase 20,000 Liters Diesel

**1. Scenario Name**  
Large diesel delivery on cash terms

**2. Business Context**  
Depot delivers 20,000 L diesel; paid immediately from bank.

**3. Initial State**  
- Diesel stock: 5,000 L  
- Bank balance sufficient  
- Supplier “National Depot” active

**4. User Action**  
Manager records purchase: Diesel 20,000 L @ Rs. 250/L, invoice #D-4421, paid from bank today.

**5. Expected Business Result**  
- Purchase posted  
- Fuel batch created: 20,000 L @ Rs. 250 cost basis  
- Supplier receipt recorded  
- Diesel stock: 25,000 L

**6. Expected Accounting Effect**  
- Debit: Fuel Inventory (Diesel) Rs. 5,000,000  
- Credit: Bank Rs. 5,000,000  
- Balanced journal auto-posted

**7. Expected Inventory Effect**  
- +20,000 L diesel in new batch  
- Batch traceable for FIFO

**8. Expected Reports**  
- Purchase register, stock report, bank movement

**9. Audit Expectations**  
- User, supplier, invoice, quantity, rate, payment account, timestamp

**10. Edge Cases**  
- Duplicate invoice # warning

**11. Acceptance Criteria**  
- [ ] Stock increased by 20,000 L  
- [ ] Bank reduced by Rs. 5,000,000  
- [ ] No manual journal by user  
- [ ] Batch ID traceable in inventory report

---

## B2. Purchase Petrol at New Supplier Price

**1. Scenario Name**  
Petrol purchase after supplier rate increase

**2. Business Context**  
New delivery at higher purchase rate than previous batch.

**3. Initial State**  
- Old petrol batch: 3,000 L @ Rs. 240/L remaining  
- New purchase: 5,000 L @ Rs. 248/L on credit

**4. User Action**  
Record purchase on credit from supplier Ali Petroleum.

**5. Expected Business Result**  
- New batch at Rs. 248/L  
- Supplier payable increased  
- Two batches coexist for FIFO

**6. Expected Accounting Effect**  
- Debit Inventory Rs. 1,240,000  
- Credit Accounts Payable (Ali Petroleum) Rs. 1,240,000

**7. Expected Inventory Effect**  
- +5,000 L petrol, separate batch

**8. Expected Reports**  
- Supplier due report, inventory by batch

**9. Audit Expectations**  
- Credit terms and invoice reference stored

**10. Edge Cases**  
- Partial payment later — separate payment workflow

**11. Acceptance Criteria**  
- [ ] Two batches visible with different costs  
- [ ] Payable matches purchase amount

---

## B3. Multiple Purchase Batches Same Day

**1. Scenario Name**  
Two diesel deliveries same day

**2. Business Context**  
Morning and evening deliveries from same supplier.

**3. Initial State**  
- Diesel stock low

**4. User Action**  
- AM: 8,000 L @ Rs. 249/L  
- PM: 12,000 L @ Rs. 251/L (rate changed)

**5. Expected Business Result**  
- Two distinct batches same day  
- Total stock increased by 20,000 L

**6. Expected Accounting Effect**  
- Two purchase postings (cash/credit per each)

**7. Expected Inventory Effect**  
- FIFO order: AM batch consumed before PM batch when policy applies

**8. Expected Reports**  
- Batch listing by receipt time

**9. Audit Expectations**  
- Separate invoice references

**10. Edge Cases**  
- Same invoice number on both — duplicate warning

**11. Acceptance Criteria**  
- [ ] Consumption order deterministic by batch receipt sequence

---

## B4. Purchase with Transport Charges

**1. Scenario Name**  
Purchase rate includes separate transport line

**2. Business Context**  
Supplier invoice: fuel Rs. 4,800,000 + transport Rs. 120,000.

**3. Initial State**  
- Policy: transport capitalized into inventory cost OR separate expense ( **must match configured posting policy** )

**4. User Action**  
Manager enters purchase with transport charges field Rs. 120,000.

**5. Expected Business Result**  
- If capitalized: batch unit cost includes transport  
- If expense: transport posts to freight/expense category per matrix  
- **Acceptance must match Financial Posting Matrix configuration — document which policy Version 1 uses**

**6. Expected Accounting Effect**  
- Per configured policy (inventory increase includes transport OR separate expense + inventory at fuel-only cost)

**7. Expected Inventory Effect**  
- Quantity from fuel line; value per capitalization rule

**8. Expected Reports**  
- Purchase detail shows transport line

**9. Audit Expectations**  
- Transport amount and classification visible

**10. Edge Cases**  
- Missing policy configuration — transaction blocked with setup message

**11. Acceptance Criteria**  
- [ ] Behavior matches posting matrix exactly  
- [ ] Batch cost reproducible in margin report

---

## B5. Purchase with Discount

**1. Scenario Name**  
Supplier trade discount on invoice

**2. Business Context**  
Invoice gross Rs. 1,000,000, discount Rs. 20,000, net payable Rs. 980,000.

**3. Initial State**  
- Credit purchase

**4. User Action**  
Enter gross, discount, net; post purchase.

**5. Expected Business Result**  
- Inventory at net capitalized cost (or gross less discount per policy)  
- Payable = Rs. 980,000

**6. Expected Accounting Effect**  
- Inventory and payable reflect net per posting rules

**7. Expected Inventory Effect**  
- Batch cost reflects net unit cost

**8. Expected Reports**  
- Purchase register shows discount

**9. Audit Expectations**  
- Discount visible on audit trail

**10. Edge Cases**  
- Discount after posting — reversal/credit note workflow

**11. Acceptance Criteria**  
- [ ] Payable = net amount  
- [ ] Unit cost matches policy for discount treatment

---

## B6. Purchase Cancellation

**1. Scenario Name**  
Cancel unposted purchase draft

**2. Business Context**  
Wrong quantity entered before save.

**3. Initial State**  
- Draft purchase not posted

**4. User Action**  
User cancels draft.

**5. Expected Business Result**  
- No inventory or accounting impact  
- Draft removed or marked cancelled

**6. Expected Accounting Effect**  
- None

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Not included in posted purchases

**9. Audit Expectations**  
- Optional log of cancelled draft

**10. Edge Cases**  
- Cancel posted purchase — must use reversal, not delete

**11. Acceptance Criteria**  
- [ ] Unposted cancel has zero financial/inventory effect

---

## B7. Purchase Correction Before Posting

**1. Scenario Name**  
Fix rate on draft purchase

**2. Business Context**  
Manager edits rate before final save.

**3. Initial State**  
- Draft with wrong rate

**4. User Action**  
Edit rate, post.

**5. Expected Business Result**  
- Posted with corrected values only  
- No duplicate batch

**6. Expected Accounting Effect**  
- Single posting at corrected amount

**7. Expected Inventory Effect**  
- Single batch at corrected cost

**8. Expected Reports**  
- One purchase line

**9. Audit Expectations**  
- Post event only (draft edits may be optional)

**10. Edge Cases**  
- Post twice — duplicate submission prevention

**11. Acceptance Criteria**  
- [ ] One posted purchase, one batch, one journal

---

# Part C — Fuel Sales Scenarios

## C1. Sell Fuel Before Price Change

**1. Scenario Name**  
Diesel sale at old price same day as scheduled increase

**2. Business Context**  
Sale at 18:00; price increases at 20:00.

**3. Initial State**  
- Diesel price Rs. 280 until 20:00  
- Stock sufficient

**4. User Action**  
Cashier sells 100 L diesel at 18:00, cash payment.

**5. Expected Business Result**  
- Sale stores Rs. 280/L permanently  
- Revenue Rs. 28,000  
- Stock -100 L

**6. Expected Accounting Effect**  
- Debit Cash Rs. 28,000  
- Credit Diesel Sales Revenue Rs. 28,000  
- Debit COGS / Credit Inventory at FIFO cost

**7. Expected Inventory Effect**  
- -100 L from oldest diesel batch(es)

**8. Expected Reports**  
- Sale shows Rs. 280/L regardless of later price change

**9. Audit Expectations**  
- Cashier, time, price applied, batch consumption trace

**10. Edge Cases**  
- Server clock vs business date — business date rule must be explicit

**11. Acceptance Criteria**  
- [ ] Stored price = Rs. 280  
- [ ] Later price change does not alter this sale

---

## C2. Sell Fuel After Price Change

**1. Scenario Name**  
First sale at new petrol price

**2. Business Context**  
First sale after petrol increased to Rs. 258.

**3. Initial State**  
- New price active  
- Stock available

**4. User Action**  
Sell 50 L petrol, cash.

**5. Expected Business Result**  
- Sale stores Rs. 258/L  
- Revenue Rs. 12,900

**6. Expected Accounting Effect**  
- Revenue and cash at Rs. 12,900; COGS per FIFO

**7. Expected Inventory Effect**  
- -50 L petrol

**8. Expected Reports**  
- Daily sales includes new price line

**9. Audit Expectations**  
- PriceApplied event or equivalent trace

**10. Edge Cases**  
- Manual price override — requires authorization if allowed

**11. Acceptance Criteria**  
- [ ] Active price auto-applied  
- [ ] Stored price on sale record

---

## C3. Sell from Multiple Inventory Batches (FIFO)

**1. Scenario Name**  
Single sale consumes two diesel batches

**2. Business Context**  
Sale 1,500 L; batch A has 1,000 L @ Rs. 248, batch B has 5,000 L @ Rs. 251.

**3. Initial State**  
- Batches as above

**4. User Action**  
Sell 1,500 L diesel.

**5. Expected Business Result**  
- 1,000 L from batch A, 500 L from batch B  
- COGS = (1000×248)+(500×251) = Rs. 373,500  
- Revenue at sale price separately

**6. Expected Accounting Effect**  
- COGS Rs. 373,500; revenue at selling price; inventory reduced by cost

**7. Expected Inventory Effect**  
- Batch A depleted; batch B reduced by 500 L

**8. Expected Reports**  
- Margin report shows blended cost for sale  
- Batch consumption trace available to accountant

**9. Audit Expectations**  
- Consumption lines linked to sale

**10. Edge Cases**  
- Insufficient total stock — block sale

**11. Acceptance Criteria**  
- [ ] FIFO order deterministic  
- [ ] COGS reproducible from batch history

---

## C4. Large Daily Sales Volume

**1. Scenario Name**  
500+ retail sales in one day

**2. Business Context**  
Busy station; cashier rapid entry.

**3. Initial State**  
- Prices active; stock high

**4. User Action**  
Many small cash sales throughout day.

**5. Expected Business Result**  
- Each sale individually stored with price  
- Day total = sum of sales  
- Stock reduced by total liters

**6. Expected Accounting Effect**  
- Aggregated reports match sum of individual postings (or batch posting policy if ever introduced — **Version 1 assumption: per-sale posting or documented aggregate with same totals**)

**7. Expected Inventory Effect**  
- Total consumption = sum quantities

**8. Expected Reports**  
- Daily sales report matches shift totals

**9. Audit Expectations**  
- Each sale attributable; no lost records

**10. Edge Cases**  
- Duplicate submission same reference — prevented

**11. Acceptance Criteria**  
- [ ] Day total reproducible from sale list  
- [ ] Stock reconciliation possible EOD

---

## C5. Historical Sales Lookup

**1. Scenario Name**  
Owner looks up sale from three months ago

**2. Business Context**  
Customer dispute on amount.

**3. Initial State**  
- Sale #S-2024-0892 from 15 Oct exists

**4. User Action**  
Search by reference or date; open sale detail.

**5. Expected Business Result**  
- Shows product, qty, **stored price**, total, cashier, payment method  
- Unchanged from original posting

**6. Expected Accounting Effect**  
- Read-only view of linked journal

**7. Expected Inventory Effect**  
- Read-only consumption trace

**8. Expected Reports**  
- Sale appears in Oct reports same as originally

**9. Audit Expectations**  
- View may be logged for sensitive roles

**10. Edge Cases**  
- Reversed sale shows reversal link

**11. Acceptance Criteria**  
- [ ] Detail matches original report line  
- [ ] Price field is stored sale price, not current price

---

## C6. Sales Reversal

**1. Scenario Name**  
Reverse wrongly posted sale

**2. Business Context**  
Duplicate sale posted; accountant reverses one.

**3. Initial State**  
- Valid posted sale Rs. 5,000 revenue, 20 L consumed

**4. User Action**  
Authorized user reverses sale with reason.

**5. Expected Business Result**  
- Original sale remains visible  
- Reversal offsets revenue, cash, COGS, inventory  
- Net effect as if sale undone financially while history preserved

**6. Expected Accounting Effect**  
- Reversal journal mirrors original  
- `SaleReversed`, `JournalReversed` events

**7. Expected Inventory Effect**  
- Stock restored per reversal policy (same batches if tracked)

**8. Expected Reports**  
- Gross sales net of reversal; audit shows both

**9. Audit Expectations**  
- Reason, authorizer, timestamp mandatory

**10. Edge Cases**  
- Reverse sale in closed month — elevated permission

**11. Acceptance Criteria**  
- [ ] Original not deleted  
- [ ] Reports net correctly  
- [ ] Stock restored

---

## C7. Sales Correction (Pre-Post)

**1. Scenario Name**  
Fix quantity before completing sale

**2. Business Context**  
Cashier entered 200 L instead of 20 L; fixes before save.

**3. Initial State**  
- Draft sale

**4. User Action**  
Edit quantity to 20 L; save.

**5. Expected Business Result**  
- Single posted sale 20 L

**6. Expected Accounting Effect**  
- One journal set

**7. Expected Inventory Effect**  
- -20 L only

**8. Expected Reports**  
- One line

**9. Audit Expectations**  
- Posted event only

**10. Edge Cases**  
- Save double-click — idempotent

**11. Acceptance Criteria**  
- [ ] No duplicate sale from double submit

---

# Part D — Inventory Scenarios

## D1. FIFO Inventory Consumption

*(See C3 — acceptance: consumption order by batch receipt time.)*

## D2. Inventory Shortage

**1. Scenario Name**  
Sale blocked when stock insufficient

**2. Business Context**  
System shows 50 L diesel; cashier attempts 100 L sale.

**3. Initial State**  
- Diesel available 50 L

**4. User Action**  
Attempt sale 100 L.

**5. Expected Business Result**  
- **Blocked** with message: insufficient diesel stock  
- No partial post unless policy explicitly allows backorder (Version 1: **block**)

**6. Expected Accounting Effect**  
- None

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Unchanged

**9. Audit Expectations**  
- Optional log of blocked attempt

**10. Edge Cases**  
- Rounding liters vs milliliters

**11. Acceptance Criteria**  
- [ ] Negative inventory impossible  
- [ ] Clear user message

---

## D3. Inventory Surplus (Tank Reconciliation Gain)

**1. Scenario Name**  
Physical dip higher than system stock

**2. Business Context**  
Diesel tank dip shows 500 L more than system.

**3. Initial State**  
- System diesel: 10,000 L  
- Physical: 10,500 L

**4. User Action**  
Manager records tank reconciliation +500 L with reason “measurement variance”, approved.

**5. Expected Business Result**  
- Stock +500 L  
- Variance recorded

**6. Expected Accounting Effect**  
- Debit Inventory / Credit Inventory Gain (or adjustment account per policy)

**7. Expected Inventory Effect**  
- +500 L with adjustment reason

**8. Expected Reports**  
- Tank reconciliation report, variance history

**9. Audit Expectations**  
- Approver, reason, before/after quantities

**10. Edge Cases**  
- Large variance requires owner approval

**11. Acceptance Criteria**  
- [ ] Stock matches approved physical after adjustment  
- [ ] Financial effect per posting matrix

---

## D4. Tank Reconciliation Loss

**1. Scenario Name**  
Dip shows less fuel than system

**2. Business Context**  
Possible evaporation/leakage; system 8,000 L, physical 7,850 L.

**3. Initial State**  
- As above

**4. User Action**  
Record -150 L adjustment, reason “evaporation/leakage investigation”, approved.

**5. Expected Business Result**  
- Stock reduced 150 L  
- Loss classified per policy

**6. Expected Accounting Effect**  
- Debit Inventory Loss / Credit Inventory

**7. Expected Inventory Effect**  
- -150 L justified adjustment

**8. Expected Reports**  
- Loss report, tank history

**9. Audit Expectations**  
- Full trace

**10. Edge Cases**  
- Cannot adjust below zero total stock

**11. Acceptance Criteria**  
- [ ] Adjustment requires reason  
- [ ] COGS not distorted by hiding loss in sales

---

## D5. Negative Inventory Attempt

**1. Scenario Name**  
Concurrent sales exhaust stock

**2. Business Context**  
Two cashiers; combined sales exceed stock if race condition.

**3. Initial State**  
- 30 L HOBC left

**4. User Action**  
Two 20 L HOBC sales attempted nearly simultaneously.

**5. Expected Business Result**  
- First succeeds; second **blocked**  
- Final stock ≥ 0

**6. Expected Accounting Effect**  
- Only successful sale posts

**7. Expected Inventory Effect**  
- Never negative

**8. Expected Reports**  
- Consistent

**9. Audit Expectations**  
- Transaction atomicity

**10. Edge Cases**  
- Database locked retry — user sees clear status

**11. Acceptance Criteria**  
- [ ] Atomic sale+inventory update  
- [ ] No negative stock under concurrency

---

## D6. Physical Stock Count

**1. Scenario Name**  
Monthly full stock count all products

**2. Business Context**  
End of month count for petrol, diesel, HOBC.

**3. Initial State**  
- System quantities per product

**4. User Action**  
Enter physical counts; finalize variances per product.

**5. Expected Business Result**  
- Per-product variance workflow  
- Adjustments posted where approved

**6. Expected Accounting Effect**  
- Per variance direction

**7. Expected Inventory Effect**  
- Align system to approved physical

**8. Expected Reports**  
- Stock count worksheet, variance summary

**9. Audit Expectations**  
- Counter, approver, date

**10. Edge Cases**  
- Count during active sales — policy for cut-off time

**11. Acceptance Criteria**  
- [ ] All three products reconciled independently

---

# Part E — Expense Scenarios

## E1. Pump Maintenance

**1. Scenario Name**  
Pay contractor for nozzle repair

**2. Business Context**  
Valid operating expense.

**3. Initial State**  
- Cash in drawer sufficient

**4. User Action**  
Record expense: Maintenance, Rs. 15,000, paid cash, payee “Hassan Motors”.

**5. Expected Business Result**  
- Expense posted  
- Cash reduced  
- **Not** classified as owner withdrawal

**6. Expected Accounting Effect**  
- Debit Maintenance Expense Rs. 15,000  
- Credit Cash Rs. 15,000

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Expense analysis, P&L, cash

**9. Audit Expectations**  
- Category, payee, user

**10. Edge Cases**  
- Unpaid — payable instead of cash

**11. Acceptance Criteria**  
- [ ] Reduces profit as expense  
- [ ] Automatic posting

---

## E2. Generator Repair

Similar to E1 — category Generator/Maintenance; same acceptance pattern.

---

## E3. Electricity Bill

**1. Scenario Name**  
Monthly WAPDA bill

**2. Business Context**  
Utility expense paid from bank.

**3. Initial State**  
- Bill Rs. 85,000

**4. User Action**  
Record Electricity expense, paid from bank, reference bill #.

**5. Expected Business Result**  
- Expense posted; bank reduced

**6. Expected Accounting Effect**  
- Debit Electricity Expense / Credit Bank

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Expense by category

**9. Audit Expectations**  
- Bill reference stored

**10. Edge Cases**  
- Accrual unpaid bill — payable

**11. Acceptance Criteria**  
- [ ] Category mapping automatic

---

## E4. Salary Payment

**1. Scenario Name**  
Pay station staff salaries

**2. Business Context**  
Multiple employees or lump salary expense.

**3. Initial State**  
- Salary expense category configured

**4. User Action**  
Record Salary Rs. 120,000 paid bank.

**5. Expected Business Result**  
- Operating expense; not owner drawing

**6. Expected Accounting Effect**  
- Debit Salary Expense / Credit Bank

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Payroll/expense report

**9. Audit Expectations**  
- Period, payee reference

**10. Edge Cases**  
- Owner paying themselves salary — still salary if legitimate employment, not withdrawal

**11. Acceptance Criteria**  
- [ ] Distinct from owner withdrawal category

---

## E5. Office Supplies

Record Rs. 3,500 stationery, cash — standard expense posting.

---

## E6. Personal Grocery (Must NOT Be Business Expense)

**1. Scenario Name**  
Owner tries to record family groceries as “General Expense”

**2. Business Context**  
Must protect profit accuracy.

**3. Initial State**  
- User selects General Expense

**4. User Action**  
Enter Rs. 8,000 groceries, payee “Supermarket”, description “family weekly grocery”.

**5. Expected Business Result**  
- **Ideal:** Warning/block if category is business-only OR require reclassification to owner withdrawal/personal ledger  
- **Minimum:** Must not silently reduce operating profit without classification policy  
- Personal expense must **not** post as operating expense without override

**6. Expected Accounting Effect**  
- If blocked: none  
- If owner withdrawal workflow: equity/drawing, **not** expense

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Operating expense report excludes personal grocery

**9. Audit Expectations**  
- Misclassification attempt visible if override used

**10. Edge Cases**  
- Staff meal legitimately business — different category

**11. Acceptance Criteria**  
- [ ] Personal grocery cannot default to operating expense  
- [ ] Owner withdrawal path available with clear UX

---

## E7. Vehicle Repair (Business Pickup)

Valid business expense if company vehicle — same as E1 with category Vehicle Repair.

---

# Part F — Income Scenarios

## F1. Shop Rent Received

**1. Scenario Name**  
Rent from tuck shop on station premises

**2. Business Context**  
Non-fuel income.

**3. Initial State**  
- Tenant pays monthly

**4. User Action**  
Record Income: Rent, Rs. 50,000, cash received.

**5. Expected Business Result**  
- Income posted; cash increased  
- Separate from fuel sales revenue

**6. Expected Accounting Effect**  
- Debit Cash / Credit Rent Income

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Income analysis, P&L other income

**9. Audit Expectations**  
- Source = tenant, period

**10. Edge Cases**  
- Unpaid rent — receivable

**11. Acceptance Criteria**  
- [ ] Not mixed with fuel sales revenue account

---

## F2. Property Income

Similar to F1 — Property Income category.

---

## F3. Other Business Income

Misc Rs. 5,000 commission — Other Income category.

---

## F4. Fuel Sales Income

**1. Scenario Name**  
Fuel revenue vs other income separation

**2. Business Context**  
Fuel sales already post to fuel revenue via Sales module.

**3. Initial State**  
- Sales posted today Rs. 500,000

**4. User Action**  
User should **not** duplicate fuel sales in Income module.

**5. Expected Business Result**  
- Fuel revenue only from Sales  
- Income module rejects duplicate “fuel sales” entry if configured

**6. Expected Accounting Effect**  
- Single revenue path for fuel

**7. Expected Inventory Effect**  
- N/A

**8. Expected Reports**  
- Sales report = fuel revenue; no double count in income module

**9. Audit Expectations**  
- Clear source type on journals

**10. Edge Cases**  
- Bulk commercial sale still via Sales workflow

**11. Acceptance Criteria**  
- [ ] No double revenue from manual income entry for fuel

---

## F5. Interest Income

Record Rs. 2,000 bank interest — Interest Income; Debit Bank / Credit Interest Income.

---

# Part G — Cash Management Scenarios

## G1. Cash Deposited to Bank

**1. Scenario Name**  
End-of-day cash deposit

**2. Business Context**  
Transfer, not expense.

**3. Initial State**  
- Cash drawer Rs. 200,000  
- Bank Rs. 500,000

**4. User Action**  
Transfer Cash: Drawer → Bank Rs. 180,000.

**5. Expected Business Result**  
- Drawer Rs. 20,000; Bank Rs. 680,000  
- Profit unchanged

**6. Expected Accounting Effect**  
- Debit Bank / Credit Cash Drawer (transfer accounts)

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Cash by location; cash flow shows transfer not expense

**9. Audit Expectations**  
- Source, destination, amount, user

**10. Edge Cases**  
- Insufficient drawer cash — warning/block

**11. Acceptance Criteria**  
- [ ] P&L unchanged  
- [ ] Both accounts updated

---

## G2. Cash Withdrawn from Bank

Bank → Drawer Rs. 50,000 — mirror of G1; transfer only.

---

## G3. Cash Transfer Between Accounts

Drawer → Safe Rs. 30,000 — same rules.

---

## G4. Daily Cash Closing

**1. Scenario Name**  
Shift close with cash count

**2. Business Context**  
Cashier counts drawer; manager reconciles.

**3. Initial State**  
- Expected cash from sales/expenses/transfers

**4. User Action**  
Enter physical count; finalize shift close.

**5. Expected Business Result**  
- Expected vs actual shown  
- Shortage/surplus recorded if variance

**6. Expected Accounting Effect**  
- Shortage: expense or cash shortage account per policy  
- Surplus: cash overage account per policy  
- **Not** hidden in generic expense

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Shift cash report

**9. Audit Expectations**  
- Cashier, manager, counts

**10. Edge Cases**  
- Close with pending credit sales

**11. Acceptance Criteria**  
- [ ] Variance explicit and classified

---

## G5. Cash Shortage

Physical count Rs. 98,000; expected Rs. 100,000 — shortage Rs. 2,000 recorded per policy.

---

## G6. Cash Surplus

Physical Rs. 101,500; expected Rs. 100,000 — surplus Rs. 1,500 recorded.

---

# Part H — Borrowing & Person Ledger Scenarios

## H1. Father Lends Rs. 100,000

**1. Scenario Name**  
Family loan to business

**2. Business Context**  
Owner’s father provides temporary funds.

**3. Initial State**  
- Bank Rs. 50,000

**4. User Action**  
Borrow Money: Lender “Father (Person)”, Rs. 100,000 to Bank.

**5. Expected Business Result**  
- Bank +100,000  
- Liability to Father +100,000  
- **Not income**

**6. Expected Accounting Effect**  
- Debit Bank / Credit Loan Liability (Father)

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Person ledger: Father owes business -100,000 (business owes father +100,000)  
- Balance sheet liability

**9. Audit Expectations**  
- Lender, terms, user

**10. Edge Cases**  
- Gift vs loan — must be explicit type

**11. Acceptance Criteria**  
- [ ] P&L excludes borrowing  
- [ ] Person balance reproducible

---

## H2. Return Rs. 25,000 to Father

Repay principal: Bank -25,000; Liability -25,000; outstanding 75,000; **not expense**.

---

## H3. Brother Borrows from Business

**1. Scenario Name**  
Business lends to family member

**2. Business Context**  
Business gives brother Rs. 40,000 — receivable, not expense.

**3. Initial State**  
- Cash available

**4. User Action**  
Record loan to Brother Rs. 40,000 from cash.

**5. Expected Business Result**  
- Cash -40,000  
- Receivable +40,000 (Brother owes business)

**6. Expected Accounting Effect**  
- Debit Receivable (Brother) / Credit Cash

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Person ledger receivable

**9. Audit Expectations**  
- Loan type, not withdrawal

**10. Edge Cases**  
- Gift vs loan classification

**11. Acceptance Criteria**  
- [ ] Not expensed  
- [ ] Brother balance +40,000 owed to business

---

## H4. Brother Repays Partially

Brother returns Rs. 15,000 — receivable reduced; cash increased.

---

## H5. Vendor Credit Purchase

Purchase on credit — payable to supplier; see B2.

---

## H6. Vendor Payment

Pay supplier Rs. 500,000 from bank — Debit Payable / Credit Bank; person ledger supplier balance reduced.

---

## H7. Customer Advance

Customer pays Rs. 10,000 advance for future fuel — liability (customer deposit) or receivable credit per policy; **not revenue until sale**.

---

## H8. Customer Refund

Refund Rs. 2,000 overpayment — reverse/adjust customer balance; cash out; not expense if principal refund.

---

# Part I — Owner Transactions

## I1. Owner Withdraws Cash

**1. Scenario Name**  
Owner takes Rs. 50,000 for personal use

**2. Business Context**  
Must not hit P&L as expense.

**3. Initial State**  
- Drawer sufficient

**4. User Action**  
Owner Withdrawal Rs. 50,000 from drawer.

**5. Expected Business Result**  
- Cash -50,000  
- Owner drawings increased

**6. Expected Accounting Effect**  
- Debit Owner Drawings / Credit Cash  
- **Not** operating expense

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- Owner drawings report; P&L excludes this

**9. Audit Expectations**  
- Owner action logged

**10. Edge Cases**  
- Insufficient cash warning

**11. Acceptance Criteria**  
- [ ] Net profit unchanged by withdrawal alone

---

## I2. Owner Deposits Personal Money

Owner contribution: Cash +Rs. 100,000; Credit Owner Equity/Capital — **not income**.

---

## I3. Owner Pays Personal Expense from Business Cash

**1. Scenario Name**  
Owner uses business cash for personal bill

**2. Business Context**  
Must classify as withdrawal/drawing or personal ledger — **not** maintenance expense.

**3. Initial State**  
- Cash available

**4. User Action**  
Attempt to record as “General Expense” for personal school fee OR use Owner Withdrawal with note.

**5. Expected Business Result**  
- Correct path: Owner Withdrawal / personal classification  
- Wrong path blocked or warned

**6. Expected Accounting Effect**  
- Drawings, not expense

**7. Expected Inventory Effect**  
- None

**8. Expected Reports**  
- P&L not distorted

**9. Audit Expectations**  
- Clear classification

**10. Edge Cases**  
- Legitimate owner reimbursement for business expense with receipt — different workflow

**11. Acceptance Criteria**  
- [ ] Personal payment not operating expense by default

---

## I4. Owner Transfer Between Business and Personal Accounts

If modeled: transfer between business cash and owner-held cash — balance sheet/equity movement, not P&L.

---

# Part J — Accounting Scenarios

## J1. Journal Posting

Automatic journal from sale — balanced, linked to source sale, `JournalPosted` event.

## J2. Journal Reversal

Reverse erroneous expense — original visible, reversal journal posted, net zero effect.

## J3. Month Closing

Accountant closes January — routine edits to January blocked; reports stable; authorized adjustments only.

## J4. Year Closing

Year-end carry forward per policy; new year opens with controlled balances.

## J5. Correction Entry

Accountant posts approved adjustment with reason — not silent edit.

## J6. Historical Ledger

General ledger for March 2024 identical on re-run in 2026.

---

# Part K — Backup Scenarios

## K1. Backup Before Upgrade

Authorized backup completes; manifest verified; audit `BackupCompleted`; no financial change.

## K2. Restore Backup

Restore replaces state to backup point; all balances/reports match backup era; `RestoreCompleted` audited; confirmation required.

## K3. Power Failure During Backup

Backup fails safely; active database consistent; `BackupFailed`; user notified to retry.

## K4. Corrupted Backup Detection

Restore rejected; active data unchanged; clear error.

---

# Part L — Security Scenarios

## L1. Unauthorized Price Change

Cashier attempts price change — **denied**.

## L2. Permission Denied Restore

Manager attempts restore — **denied**; owner only.

## L3. Audit Trail Verification

Accountant traces sale → journal → user → reversal chain complete.

## L4. Password Change

User changes password; session policy enforced; audit logged.

## L5. Session Expiration

Inactive session locked; re-authentication required; no anonymous posting.

---

# Part M — Reporting Scenarios

## M1. Daily Sales Report

Matches sum of posted sales for business date; each line shows stored price.

## M2. Monthly Profit Report

Revenue - COGS - operating expenses + other income; excludes owner withdrawals and borrowing.

## M3. Historical Inventory Report

Stock at date X reproducible from movements to that date.

## M4. Fuel Margin Report

Per product: revenue - COGS; mixed batch costs correct.

## M5. Expense Analysis

By category; excludes personal misclassified items.

## M6. Income Analysis

Non-fuel income only; fuel from sales module.

## M7. Cash Flow

Shows operating, transfer, borrowing, repayment; transfers not expenses.

## M8. Balance Sheet

Assets = Liabilities + Equity; ties to trial balance.

## M9. Profit & Loss

Matches accountant expectations for sample month.

**Acceptance for all reports:** Re-run same date range → identical results unless new authorized corrections exist.

---

# Part N — Failure Scenarios

## N1. Power Failure While Saving Sale

Either sale fully posted or not at all; no partial inventory/accounting; recovery message on restart.

## N2. Application Crash Mid-Transaction

Same as N1 — atomic business transaction.

## N3. SQLite Database Locked

User sees retry message; no duplicate post on success after retry if idempotent.

## N4. Disk Full

Save/backup fails safely; user warned; no corrupted half-write.

## N5. Duplicate Submission

Double-click save creates one sale only.

## N6. Invalid Data

Negative price blocked; missing product blocked.

## N7. Future Dated Transaction

Blocked or requires authorization per period policy.

## N8. Missing Inventory

Sale blocked with clear message.

---

# Part O — Six-Month Business Simulation

## O1. Simulation Overview

**Station:** Al-Noor Petrol Pump  
**Period:** 1 January – 30 June (6 months)  
**Purpose:** Prove ERP reproduces financial reports accurately after sustained operations.

### Month-by-Month Summary

| Month | Key Events |
| --- | --- |
| **Jan** | Opening balances; purchases petrol/diesel; daily sales; electricity expense; father loan Rs. 100,000; first price change mid-month |
| **Feb** | HOBC added to stock; generator repair; rent income Rs. 50,000; owner withdrawal Rs. 30,000; tank reconciliation -80 L diesel loss |
| **Mar** | Two diesel deliveries (FIFO test); salary; customer credit sales; repay father Rs. 25,000; month close |
| **Apr** | Government increases all prices; sales at mixed prices; shop rent; cash deposits to bank daily |
| **May** | Brother loan Rs. 40,000 / partial repay; maintenance; purchase discount; sale reversal one duplicate |
| **Jun** | Physical stock count; year-half P&L; backup before simulated upgrade; brother full settle; final tank reconcile |

### Opening State (1 Jan)

- Cash drawer Rs. 80,000; Bank Rs. 200,000  
- Petrol 4,000 L @ batch costs; Diesel 6,000 L  
- Owner equity opening per setup  
- Active prices: Petrol 265, Diesel 280  

### Representative Daily Pattern (Repeating)

- 40–80 sales/day across products  
- 1–2 purchases/week  
- Expenses 2–5/week  
- Weekly cash deposit to bank  

### Closing State (30 Jun)

- All person balances: Father liability Rs. 75,000; Brother receivable Rs. 0 after settle  
- Inventory positive all products  
- Six months journals balanced  
- Trial balance debits = credits  

### Report Verification Points

At **30 Jun**, run and **save baseline**:

1. Trial Balance  
2. Balance Sheet  
3. P&L Jan–Jun  
4. Fuel margin by product  
5. Inventory valuation  
6. Owner drawings total  
7. Father ledger statement  
8. Daily sales 15 Mar (spot check mixed prices)  

**Re-run all reports on 1 Jul** → must match baseline byte-for-byte on totals.

### Acceptance Criteria (Simulation)

- [ ] 6 months data entry without architectural workaround  
- [ ] Every sale retains historical price  
- [ ] FIFO COGS deterministic on sampled sales  
- [ ] Owner withdrawals excluded from operating expenses  
- [ ] Borrowing/repayment not income/expense  
- [ ] Transfers excluded from P&L  
- [ ] Month close Mar blocks casual backdating  
- [ ] Jun stock count adjustments audited  
- [ ] Full report pack reproducible  

---

# Part P — Edge Case Library

| # | Edge Case | Expected Behavior |
| --- | --- | --- |
| P1 | Price changes twice in one day | Each sale stores price effective at sale time; three price periods in history |
| P2 | Purchase entered late (backdated) | Allowed only with permission; does not rewrite later sales COGS already consumed |
| P3 | Sale entered after midnight | Business date rule assigns to correct shift/day |
| P4 | Negative adjustment | Allowed with reason + approval; stock cannot go negative total |
| P5 | Mistaken owner withdrawal recorded as expense | Warning/block; correction via reversal/reclassification |
| P6 | Incorrect supplier invoice amount | Reverse purchase; repost correct; batches adjusted via reversal |
| P7 | Fuel evaporation adjustment | Tank reconciliation loss category; audited |
| P8 | Pump calibration adjustment | Documented adjustment; not sales |
| P9 | Credit sale partial payment | Receivable reduced; cash partial; no double revenue |
| P10 | Pay supplier with owner personal cash | Wrong workflow blocked; use business cash or owner contribution first |
| P11 | Sale during backup | Backup consistent snapshot; sale either before or after snapshot per timing |
| P12 | Restore after 1 week operations | All post-restore reports match backup date |
| P13 | HOBC sale when only petrol/diesel tanks checked | Product-specific stock validation |
| P14 | Zero-liter sale attempt | Blocked |
| P15 | Rounding 0.001 L | Policy: minimum unit (e.g., milliliters) consistent |

---

# Part Q — Acceptance Test Library by Module

## Fuel Price Management

| ID | Test | Pass Criteria |
| --- | --- | --- |
| FP-01 | Increase diesel price | New sales use new price; old unchanged |
| FP-02 | Schedule future price | Activation at effective time automatic |
| FP-03 | Block historical edit | Used price record immutable |
| FP-04 | All-product update | Three products in one workflow |
| FP-05 | Report after change | Historical sales report unchanged |

## Fuel Purchase

| ID | Test | Pass Criteria |
| --- | --- | --- |
| PU-01 | Cash purchase | Inventory+, bank-, journal balanced |
| PU-02 | Credit purchase | Payable created |
| PU-03 | Duplicate invoice | Warning/block |
| PU-04 | Two batches same day | FIFO order by receipt |
| PU-05 | Cancel draft | Zero impact |

## Fuel Sales

| ID | Test | Pass Criteria |
| --- | --- | --- |
| SA-01 | Sale stores price | Price field = active at sale time |
| SA-02 | Insufficient stock | Blocked |
| SA-03 | FIFO multi-batch | COGS matches manual calculation |
| SA-04 | Reversal | Original + reversal net correctly |
| SA-05 | Double submit | One sale only |

## Fuel Inventory / Tank

| ID | Test | Pass Criteria |
| --- | --- | --- |
| IN-01 | Negative attempt | Blocked |
| IN-02 | Reconciliation gain | Stock+, gain posted |
| IN-03 | Reconciliation loss | Stock-, loss posted |
| IN-04 | Physical count | Per-product variance |

## Expenses

| ID | Test | Pass Criteria |
| --- | --- | --- |
| EX-01 | Maintenance | Expense account, not drawing |
| EX-02 | Personal grocery | Not operating expense |
| EX-03 | Unpaid bill | Payable created |

## Income

| ID | Test | Pass Criteria |
| --- | --- | --- |
| IC-01 | Rent income | Separate from fuel revenue |
| IC-02 | Duplicate fuel in income | Prevented |

## Cash Management

| ID | Test | Pass Criteria |
| --- | --- | --- |
| CA-01 | Bank deposit | Transfer; P&L neutral |
| CA-02 | Shift shortage | Classified shortage |
| CA-03 | Shift surplus | Classified surplus |

## Person Ledger

| ID | Test | Pass Criteria |
| --- | --- | --- |
| PL-01 | Borrow from father | Liability+, not income |
| PL-02 | Repay principal | Liability-, not expense |
| PL-03 | Brother loan out | Receivable+ |

## Owner Transactions

| ID | Test | Pass Criteria |
| --- | --- | --- |
| OW-01 | Withdrawal | Drawings, not expense |
| OW-02 | Capital deposit | Equity+, not income |

## Accounting

| ID | Test | Pass Criteria |
| --- | --- | --- |
| AC-01 | Auto journal from sale | Balanced, linked |
| AC-02 | Reversal | History preserved |
| AC-03 | Month close | Backdating blocked |
| AC-04 | Trial balance | Debits = credits |

## Reports

| ID | Test | Pass Criteria |
| --- | --- | --- |
| RP-01 | Reproducibility | Same date range = same totals |
| RP-02 | P&L excludes drawings | Withdrawals not in expenses |
| RP-03 | Margin report | COGS from FIFO |

## Backup & Restore

| ID | Test | Pass Criteria |
| --- | --- | --- |
| BK-01 | Successful backup | Verified manifest |
| BK-02 | Failed backup | DB unchanged |
| BK-03 | Restore | Reports match backup era |
| BK-04 | Corrupt backup | Restore rejected |

## Security

| ID | Test | Pass Criteria |
| --- | --- | --- |
| SE-01 | Cashier price change | Denied |
| SE-02 | Manager restore | Denied |
| SE-03 | Audit chain | Sale to user traceable |

---

# Document Governance

- This document is **binding** for acceptance testing and AI-assisted implementation.  
- New scenarios must be added when new business rules are approved.  
- Conflicts with Enterprise Blueprint or Business Invariants must be resolved by updating **one** governing document explicitly — never by silent implementation drift.

---

*Business Examples & Acceptance Scenarios — FuelERP v1.0*
