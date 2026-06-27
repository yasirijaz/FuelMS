import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, Modal, useConfirm, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { backupRepositoryRuntime, BACKUP_DEFAULT_ACTOR } from '../application/backupModule'
import {
  useBackupAuditEvents,
  useBackupList,
  useBackupStoragePath,
  useCreateBackup,
  useRestoreBackup,
  useVerifyBackup,
} from '../application/hooks/useBackupQueries'
import { BackupAuditTrail } from './components/BackupAuditTrail'
import { BackupListTable } from './components/BackupListTable'
import { CreateBackupFormFields } from './components/CreateBackupModal'

export function BackupPage() {
  const { toast } = useToast()
  const confirm = useConfirm()

  const backupsQuery = useBackupList()
  const storagePathQuery = useBackupStoragePath()
  const auditQuery = useBackupAuditEvents()
  const createMutation = useCreateBackup()
  const verifyMutation = useVerifyBackup()
  const restoreMutation = useRestoreBackup()

  const [createOpen, setCreateOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [pendingBackupId, setPendingBackupId] = useState<string | null>(null)

  const isDesktop = env.IS_TAURI
  const mutationsDisabled = !isDesktop || backupRepositoryRuntime === 'browser'

  async function handleCreate(): Promise<void> {
    try {
      await createMutation.mutateAsync({
        actor: BACKUP_DEFAULT_ACTOR,
        notes: notes.trim() || undefined,
      })
      toast({ title: 'Backup created', variant: 'success' })
      setCreateOpen(false)
      setNotes('')
    } catch (caught) {
      toast({
        title: 'Could not create backup',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    }
  }

  async function handleVerify(backupId: string): Promise<void> {
    setPendingBackupId(backupId)
    try {
      const result = await verifyMutation.mutateAsync(backupId)
      toast({
        title: result.isValid ? 'Backup verified' : 'Backup verification failed',
        description: result.message,
        variant: result.isValid ? 'success' : 'error',
      })
    } catch (caught) {
      toast({
        title: 'Could not verify backup',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    } finally {
      setPendingBackupId(null)
    }
  }

  async function handleRestore(backupId: string): Promise<void> {
    const approved = await confirm({
      title: 'Restore this backup?',
      description:
        'This will replace ALL current business data with the selected backup. ' +
        'A safety copy of your current database is created before restore, but this action cannot be undone from the app. ' +
        'Ensure no other users are working before proceeding.',
      confirmLabel: 'Replace current data',
      variant: 'danger',
    })
    if (!approved) return

    setPendingBackupId(backupId)
    try {
      const result = await restoreMutation.mutateAsync({
        backupId,
        actor: BACKUP_DEFAULT_ACTOR,
        acknowledgeReplace: true,
      })
      toast({
        title: 'Backup restored',
        description: result.message,
        variant: 'success',
      })
    } catch (caught) {
      toast({
        title: 'Could not restore backup',
        description: caught instanceof Error ? caught.message : undefined,
        variant: 'error',
      })
    } finally {
      setPendingBackupId(null)
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ui-text)]">Backup</h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--ui-text-muted)]">
            Protect your business data with offline backups of the local database. Create point-in-time
            snapshots, verify integrity, and restore when disaster recovery is needed.
          </p>
        </div>
        <Button disabled={mutationsDisabled || createMutation.isPending} onClick={() => setCreateOpen(true)}>
          Create backup
        </Button>
      </header>

      {backupRepositoryRuntime === 'browser' && !env.IS_TAURI && (
        <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
          Browser preview uses in-memory stubs — backup and restore only work in the desktop app. Run{' '}
          <code className="font-mono text-xs">pnpm tauri dev</code> to manage real backups.
        </p>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Storage location</h2>
        </CardHeader>
        <CardBody>
          {storagePathQuery.isLoading ? (
            <p className="text-sm text-[var(--ui-text-muted)]">Loading storage path…</p>
          ) : storagePathQuery.isError ? (
            <p className="text-sm text-[var(--ui-danger)]">
              {storagePathQuery.error instanceof Error
                ? storagePathQuery.error.message
                : 'Failed to load storage path.'}
            </p>
          ) : (
            <p className="break-all font-mono text-sm text-[var(--ui-text)]">
              {storagePathQuery.data}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Backups</h2>
        </CardHeader>
        <CardBody>
          {backupsQuery.isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {backupsQuery.error instanceof Error
                ? backupsQuery.error.message
                : 'Failed to load backups.'}
            </div>
          ) : (
            <BackupListTable
              items={backupsQuery.data ?? []}
              isLoading={backupsQuery.isLoading}
              pendingBackupId={pendingBackupId}
              onVerify={(id) => void handleVerify(id)}
              onRestore={(id) => void handleRestore(id)}
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">Audit trail</h2>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
            Recent backup, verify, and restore events.
          </p>
        </CardHeader>
        <CardBody>
          {auditQuery.isError ? (
            <div className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
              {auditQuery.error instanceof Error
                ? auditQuery.error.message
                : 'Failed to load audit events.'}
            </div>
          ) : (
            <BackupAuditTrail items={auditQuery.data ?? []} isLoading={auditQuery.isLoading} />
          )}
        </CardBody>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create backup"
        description="Snapshot the current database to local storage."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={createMutation.isPending}>
              Create backup
            </Button>
          </>
        }
      >
        <CreateBackupFormFields
          notes={notes}
          isPending={createMutation.isPending}
          onNotesChange={setNotes}
        />
      </Modal>
    </section>
  )
}
