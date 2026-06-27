import { useConfirm, useToast } from '@fuelms/ui'
import { env } from '@shared/lib/env'
import { useEffect, useRef } from 'react'
import { checkForAppUpdate, downloadAndInstallUpdate, isUpdaterSupported } from '../application/services/appUpdateService'

function progressLabel(downloaded: number, contentLength: number | null): string {
  if (contentLength && contentLength > 0) {
    const percent = Math.min(100, Math.round((downloaded / contentLength) * 100))
    return `Downloading update… ${percent}%`
  }
  return 'Downloading update…'
}

/**
 * Silently checks GitHub for a new release on startup in production desktop builds.
 * Prompts the user before downloading and installing.
 */
export function AppUpdaterBootstrap() {
  const confirm = useConfirm()
  const { toast } = useToast()
  const hasChecked = useRef(false)

  useEffect(() => {
    if (!isUpdaterSupported() || hasChecked.current) return
    hasChecked.current = true

    void (async () => {
      try {
        const result = await checkForAppUpdate()
        if (result.status !== 'available') return

        const approved = await confirm({
          title: `Update available (${result.version})`,
          description:
            (result.notes?.trim() ||
              `A new version of ${env.APP_NAME} is available. Install now to stay up to date?`) +
            `\n\nCurrent version: ${result.currentVersion}\nNew version: ${result.version}`,
          confirmLabel: 'Install update',
          cancelLabel: 'Later',
        })

        if (!approved) return

        let downloaded = 0
        let contentLength: number | null = null

        await downloadAndInstallUpdate(({ downloaded: nextDownloaded, contentLength: nextLength }) => {
          downloaded = nextDownloaded
          contentLength = nextLength
          toast({
            title: progressLabel(downloaded, contentLength),
            variant: 'default',
          })
        })
      } catch (caught) {
        toast({
          title: 'Update check failed',
          description: caught instanceof Error ? caught.message : undefined,
          variant: 'error',
        })
      }
    })()
  }, [confirm, toast])

  return null
}
