import { useState } from 'react'
import { Button } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { useTankList } from '../application/hooks/useTankQueries'
import { tankRepositoryRuntime } from '../application/tankModule'
import type { TankListItem } from '../application/mappers/tankViewMappers'
import { aggregateTankListByProduct } from '../application/utils/aggregateTankListByProduct'
import { RecordDipModal } from './components/RecordDipModal'
import { TankCard } from './components/TankCard'
import { TankFormModal } from './components/TankFormModal'
import { TankOverviewPanel } from './components/TankOverviewPanel'

export function TanksPage() {
  const { data: tanks, isLoading, isError, error } = useTankList(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTank, setEditTank] = useState<TankListItem | null>(null)
  const [dipTank, setDipTank] = useState<TankListItem | null>(null)

  function openCreate(): void {
    setEditTank(null)
    setFormOpen(true)
  }

  function openEdit(tank: TankListItem): void {
    setEditTank(tank)
    setFormOpen(true)
  }

  function closeForm(): void {
    setFormOpen(false)
    setEditTank(null)
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Tanks</h1>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Underground tank configuration, dip readings, and book vs physical reconciliation.
          </p>
        </div>
        <Button onClick={openCreate}>Add tank</Button>
      </header>

      {tankRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory data. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> for SQLite persistence.
        </p>
      )}

      {isError && (
        <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
          {error instanceof Error ? error.message : 'Failed to load tanks.'}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--ui-text-muted)]">Loading tanks…</p>
      ) : tanks?.length === 0 ? (
        <p className="text-sm text-[var(--ui-text-muted)]">
          No active tanks configured. Add a tank to get started.
        </p>
      ) : (
        <>
          <TankOverviewPanel summaries={aggregateTankListByProduct(tanks ?? [])} />

          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--ui-text)]">Configured tanks</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {tanks?.map((tank) => (
                <TankCard
                  key={tank.id}
                  tank={tank}
                  onEdit={openEdit}
                  onRecordDip={setDipTank}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <TankFormModal open={formOpen} tank={editTank} onClose={closeForm} />
      <RecordDipModal
        open={dipTank != null}
        tank={dipTank}
        onClose={() => setDipTank(null)}
      />
    </section>
  )
}
