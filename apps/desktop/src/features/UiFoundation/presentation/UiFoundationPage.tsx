import { useMemo, useState } from 'react'
import {
  BusinessPartnerSelector,
  Button,
  Card,
  CardBody,
  CardHeader,
  CashBalanceCard,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterGroup,
  FormField,
  FormSection,
  FuelBatchCard,
  FuelProductSelector,
  FuelQuantityInput,
  Input,
  InventorySummaryCard,
  LoadingState,
  Modal,
  MoneyInput,
  Pagination,
  PostingStatusBadge,
  PriceHistoryTimeline,
  ProfitCard,
  SearchBar,
  Select,
  TankLevelIndicator,
  Textarea,
  TransactionTimeline,
  useConfirm,
  useToast,
} from '@fuelms/ui'
import { rupeesToMinor } from '@fuelms/shared'

type DemoRow = {
  id: string
  name: string
  status: string
}

const demoRows: DemoRow[] = [
  { id: '1', name: 'Sample row A', status: 'Active' },
  { id: '2', name: 'Sample row B', status: 'Draft' },
]

const demoPartners = [
  { id: 'bp-1', displayName: 'National Oil Co.', roles: ['supplier'] },
  { id: 'bp-2', displayName: 'City Transport Ltd.', roles: ['customer'] },
]

const demoPriceHistory = [
  {
    id: 'ph-1',
    productCode: 'diesel' as const,
    priceMinorPerLitre: rupeesToMinor(295),
    effectiveFromIso: '2026-06-01T00:00:00',
    status: 'active' as const,
  },
  {
    id: 'ph-2',
    productCode: 'diesel' as const,
    priceMinorPerLitre: rupeesToMinor(288),
    effectiveFromIso: '2026-05-15T00:00:00',
    status: 'superseded' as const,
  },
  {
    id: 'ph-3',
    productCode: 'diesel' as const,
    priceMinorPerLitre: rupeesToMinor(280),
    effectiveFromIso: '2026-04-01T00:00:00',
    status: 'superseded' as const,
  },
]

const demoTimeline = [
  {
    id: '1',
    occurredAtIso: '2026-06-26T09:15:00',
    title: 'Purchase posted',
    description: 'Invoice #FP-1042 from National Oil Co.',
    amountMinor: rupeesToMinor(842_000),
    tone: 'debit' as const,
  },
  {
    id: '2',
    occurredAtIso: '2026-06-26T08:40:00',
    title: 'Draft saved',
    description: 'Awaiting supplier confirmation.',
    tone: 'neutral' as const,
  },
]

export function UiFoundationPage() {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [amountMinor, setAmountMinor] = useState<number | null>(rupeesToMinor(12_500))
  const [quantityLitres, setQuantityLitres] = useState<number | null>(1500.125)
  const [partnerId, setPartnerId] = useState<string | null>('bp-1')
  const [productCode, setProductCode] = useState<'petrol' | 'diesel' | 'hobc'>('diesel')

  const columns = useMemo(
    () => [
      { id: 'name', header: 'Name', cell: (row: DemoRow) => row.name },
      { id: 'status', header: 'Status', cell: (row: DemoRow) => row.status },
    ],
    [],
  )

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-subtle)]">
          Design System
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">UI Foundation</h1>
        <p className="max-w-3xl text-sm text-[var(--ui-text-muted)]">
          Generic primitives plus ERP business components. Primitives handle presentation; business
          components encode fuel-station semantics (money in paisa, litres, partners, posting status).
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Business components</h2>
          <p className="text-sm text-[var(--ui-text-muted)]">
            Reused across Purchases, Sales, Inventory, and Accounting — behavior lives here, not in
            every screen.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ProfitCard label="Today's profit" amountMinor={rupeesToMinor(145_200)} trendPercent={4.2} />
          <CashBalanceCard label="Cash balance" amountMinor={rupeesToMinor(985_000)} trendPercent={-1.5} />
          <InventorySummaryCard
            products={[
              { productCode: 'diesel', quantityLitres: 16_400, valuationMinor: rupeesToMinor(4_842_000) },
              { productCode: 'petrol', quantityLitres: 9_450 },
              { productCode: 'hobc', quantityLitres: 2_250 },
            ]}
            totalValuationMinor={rupeesToMinor(6_500_000)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Inputs & selectors</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <FormField id="demo-money" label="Amount (PKR)">
                <MoneyInput
                  id="demo-money"
                  valueMinor={amountMinor}
                  onChangeMinor={setAmountMinor}
                />
              </FormField>
              <FormField id="demo-qty" label="Quantity (L)">
                <FuelQuantityInput
                  id="demo-qty"
                  valueLitres={quantityLitres}
                  onChangeLitres={setQuantityLitres}
                />
              </FormField>
              <FormField id="demo-partner" label="Business partner">
                <BusinessPartnerSelector
                  id="demo-partner"
                  partners={demoPartners}
                  value={partnerId}
                  onChange={setPartnerId}
                />
              </FormField>
              <FormField id="demo-product" label="Fuel product">
                <FuelProductSelector
                  id="demo-product"
                  value={productCode}
                  onChange={(code) => {
                    if (code) setProductCode(code)
                  }}
                  mode="segmented"
                />
              </FormField>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Status, batches & tanks</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <PostingStatusBadge status="draft" />
                <PostingStatusBadge status="posted" />
                <PostingStatusBadge status="void" />
              </div>
              <FuelBatchCard
                batch={{
                  id: 'B-2026-042',
                  productCode: 'diesel',
                  quantityLitres: 5000,
                  remainingLitres: 3200,
                  unitCostMinorPerLitre: rupeesToMinor(285.5),
                  receivedAtIso: '2026-06-20T10:00:00',
                  supplierName: 'National Oil Co.',
                }}
              />
              <TankLevelIndicator productCode="diesel" fillPercent={82} capacityLitres={20_000} />
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Price history</h3>
            </CardHeader>
            <CardBody>
              <PriceHistoryTimeline entries={demoPriceHistory} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Transaction timeline</h3>
            </CardHeader>
            <CardBody>
              <TransactionTimeline entries={demoTimeline} />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Generic primitives</h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Actions & feedback</h3>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              <Button onClick={() => toast({ title: 'Saved', description: 'Changes stored locally.', variant: 'success' })}>
                Toast success
              </Button>
              <Button variant="secondary" onClick={() => setDemoModalOpen(true)}>
                Open modal
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Delete item?',
                    description: 'This action cannot be undone in this demo.',
                    confirmLabel: 'Delete',
                    variant: 'danger',
                  })
                  toast({
                    title: ok ? 'Confirmed' : 'Cancelled',
                    variant: ok ? 'default' : 'warning',
                  })
                }}
              >
                Confirm dialog
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Search, filters, pagination</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
              <FilterGroup>
                <FilterBar
                  id="demo-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'draft', label: 'Draft' },
                  ]}
                />
              </FilterGroup>
              <Pagination page={page} pageSize={10} totalItems={48} onPageChange={setPage} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Data table</h3>
          <DataTable
            columns={columns}
            data={demoRows}
            getRowId={(row) => row.id}
            emptyState={<EmptyState title="No rows" description="Table empty state example." />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <LoadingState />
          <EmptyState title="Nothing here yet" description="Use for zero-result lists." action={<Button size="sm">Action</Button>} />
          <ErrorState description="Example recoverable error state." action={<Button size="sm" variant="secondary">Retry</Button>} />
        </div>

        <FormSection title="Form primitives" description="Accessible labels, hints, and errors.">
          <FormField id="demo-name" label="Display name" hint="Helper text example." required>
            <Input id="demo-name" placeholder="Enter text" />
          </FormField>
          <FormField id="demo-type" label="Type">
            <Select id="demo-type" defaultValue="">
              <option value="">Select…</option>
              <option value="a">Option A</option>
            </Select>
          </FormField>
          <FormField id="demo-notes" label="Notes" error="Example validation message.">
            <Textarea id="demo-notes" invalid />
          </FormField>
        </FormSection>
      </section>

      <Modal
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Example modal"
        description="Focus trap, Esc to close, backdrop click supported."
        footer={
          <Button variant="secondary" onClick={() => setDemoModalOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-sm text-[var(--ui-text-muted)]">Modal body content.</p>
      </Modal>
    </div>
  )
}
