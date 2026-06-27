import { Button, Card, CardBody, CardHeader } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { useAppUpdater } from '../../application/hooks/useAppUpdater'

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function progressLabel(progress: { downloaded: number; contentLength: number | null }): string {
  if (progress.contentLength) {
    const percent = Math.min(100, Math.round((progress.downloaded / progress.contentLength) * 100))
    return `Downloading update… ${percent}% (${formatBytes(progress.downloaded)} / ${formatBytes(progress.contentLength)})`
  }
  return `Downloading update… ${formatBytes(progress.downloaded)} received`
}

export function AppUpdatesCard() {
  const { isSupported, phase, result, progress, error, check, install } = useAppUpdater()

  const isBusy = phase === 'checking' || phase === 'installing'
  const githubRepo = import.meta.env.VITE_UPDATER_GITHUB_REPO ?? 'yasirijaz/FuelMS'

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Application updates</h2>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
          FuelMS checks GitHub Releases for signed updates. You are running version{' '}
          <span className="font-medium text-[var(--ui-text)]">{env.APP_VERSION}</span>.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-[var(--ui-text-muted)]">
          Update source:{' '}
          <a
            className="font-medium text-[var(--ui-accent)] underline-offset-2 hover:underline"
            href={`https://github.com/${githubRepo}/releases`}
            rel="noreferrer"
            target="_blank"
          >
            github.com/{githubRepo}
          </a>
        </p>

        {!isSupported && (
          <p className="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3 text-sm text-[var(--ui-text-muted)]">
            {env.IS_TAURI
              ? 'Automatic update checks run in production builds. Use a release installer to test updates, or run Check for updates after building with `pnpm tauri build`.'
              : 'Updates are managed by the desktop app. Run `pnpm tauri dev` or the installed FuelMS app to check for updates.'}
          </p>
        )}

        {error && (
          <p className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-4 py-3 text-sm text-[var(--ui-danger)]">
            {error}
          </p>
        )}

        {result?.status === 'current' && (
          <p className="rounded-[var(--ui-radius)] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            You are on the latest version ({result.currentVersion}).
          </p>
        )}

        {result?.status === 'available' && (
          <div className="space-y-2 rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--ui-text)]">
              Version {result.version} is available (current: {result.currentVersion}).
            </p>
            {result.notes && (
              <p className="whitespace-pre-wrap text-sm text-[var(--ui-text-muted)]">{result.notes}</p>
            )}
          </div>
        )}

        {progress && (
          <p className="text-sm text-[var(--ui-text-muted)]">{progressLabel(progress)}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button disabled={isBusy} onClick={() => void check()}>
            {phase === 'checking' ? 'Checking…' : 'Check for updates'}
          </Button>
          {result?.status === 'available' && (
            <Button disabled={isBusy} variant="secondary" onClick={() => void install()}>
              {phase === 'installing' ? 'Installing…' : 'Download and install'}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
