import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterGroup,
  LoadingState,
  SearchBar,
  useToast,
} from '@fuelms/ui'
import { env } from '@shared/lib/env'
import {
  PARTNER_ROLE_CODES,
  PARTNER_ROLE_LABELS,
  type PartnerRoleCode,
} from '../domain'
import { businessPartnerRepositoryRuntime } from '../application/businessPartnerModule'
import {
  useBusinessPartner,
  useBusinessPartnerList,
} from '../application/hooks/useBusinessPartnerQueries'
import { PartnerCreateModal } from './components/PartnerCreateModal'
import { PartnerDetailPanel } from './components/PartnerDetailPanel'

const roleFilterOptions = PARTNER_ROLE_CODES.map((role) => ({
  value: role,
  label: PARTNER_ROLE_LABELS[role],
}))

const activeFilterOptions = [
  { value: 'active', label: 'Active only' },
  { value: 'all', label: 'All partners' },
]

export function BusinessPartnersPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      roleCode: (roleFilter || undefined) as PartnerRoleCode | undefined,
      activeOnly: activeFilter === 'active',
    }),
    [search, roleFilter, activeFilter],
  )

  const { data: partners, isLoading, isError, error } = useBusinessPartnerList(listQuery)
  const { data: selectedPartner } = useBusinessPartner(selectedId)

  const columns = useMemo(
    () => [
      {
        id: 'displayName',
        header: 'Name',
        cell: (row: NonNullable<typeof partners>[number]) => row.displayName.value,
      },
      {
        id: 'roles',
        header: 'Roles',
        cell: (row: NonNullable<typeof partners>[number]) =>
          row.roles.map((role) => PARTNER_ROLE_LABELS[role]).join(', ') || '—',
      },
      {
        id: 'phone',
        header: 'Phone',
        cell: (row: NonNullable<typeof partners>[number]) => row.phone ?? '—',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row: NonNullable<typeof partners>[number]) => (row.isActive ? 'Active' : 'Inactive'),
      },
    ],
    [],
  )

  if (isLoading && !partners) {
    return <LoadingState className="m-8" />
  }

  if (isError) {
    return (
      <ErrorState
        className="m-8"
        title="Business partners unavailable"
        description={error instanceof Error ? error.message : 'Could not load partners.'}
      />
    )
  }

  const rows = partners ?? []

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-subtle)]">
            Master data
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">
            Business Partners
          </h1>
          <p className="max-w-3xl text-sm text-[var(--ui-text-muted)]">
            Manage suppliers, customers, employees, and other parties. Each partner needs at least
            one role while active.
          </p>
          {env.IS_DEV && businessPartnerRepositoryRuntime === 'browser' && (
            <p className="text-xs text-amber-700">
              Browser mode — partners are stored in memory until you run the Tauri app.
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>New partner</Button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <SearchBar
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch('')}
                placeholder="Search by name, phone, or tax ID…"
              />
              <FilterGroup>
                <FilterBar
                  id="partner-role-filter"
                  label="Role"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  options={roleFilterOptions}
                  placeholder="All roles"
                />
                <FilterBar
                  id="partner-active-filter"
                  label="Status"
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value)}
                  options={activeFilterOptions}
                  placeholder="Active only"
                />
              </FilterGroup>
            </div>
          </CardHeader>
          <CardBody>
            <DataTable
              columns={columns}
              data={rows}
              getRowId={(row) => row.id.toString()}
              isLoading={isLoading}
              onRowClick={(row) => setSelectedId(row.id.toString())}
              emptyState={
                <EmptyState
                  title="No partners found"
                  description="Create a partner or adjust your search and filters."
                  action={
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      New partner
                    </Button>
                  }
                />
              }
            />
          </CardBody>
        </Card>

        {selectedPartner ? (
          <PartnerDetailPanel
            partner={selectedPartner}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                title="Select a partner"
                description="Click a row in the table to view details, edit fields, and manage roles."
              />
            </CardBody>
          </Card>
        )}
      </div>

      <PartnerCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(partnerId) => {
          setSelectedId(partnerId)
          toast({ title: 'Partner created', variant: 'success' })
        }}
      />
    </section>
  )
}
