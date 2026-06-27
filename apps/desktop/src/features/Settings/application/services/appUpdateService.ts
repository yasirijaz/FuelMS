import { env } from '@shared/lib/env'

export type UpdateCheckResult =
  | { status: 'unsupported'; reason: string }
  | { status: 'current'; currentVersion: string }
  | { status: 'available'; version: string; notes: string | null; currentVersion: string }

export type DownloadProgress = {
  downloaded: number
  contentLength: number | null
}

export function isUpdaterSupported(): boolean {
  return env.IS_TAURI && env.IS_PROD
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  if (!env.IS_TAURI) {
    return {
      status: 'unsupported',
      reason: 'Updates are only available in the desktop app.',
    }
  }

  if (!env.IS_PROD) {
    return {
      status: 'unsupported',
      reason: 'Updates are checked in production builds only. Build a release installer to test.',
    }
  }

  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()

  if (!update) {
    return { status: 'current', currentVersion: env.APP_VERSION }
  }

  return {
    status: 'available',
    version: update.version,
    notes: update.body ?? null,
    currentVersion: update.currentVersion,
  }
}

export async function downloadAndInstallUpdate(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  const { check } = await import('@tauri-apps/plugin-updater')
  const { relaunch } = await import('@tauri-apps/plugin-process')

  const update = await check()
  if (!update) {
    throw new Error('No update is available to install.')
  }

  let downloaded = 0
  let contentLength: number | null = null

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? null
        onProgress?.({ downloaded: 0, contentLength })
        break
      case 'Progress':
        downloaded += event.data.chunkLength
        onProgress?.({ downloaded, contentLength })
        break
      case 'Finished':
        onProgress?.({ downloaded, contentLength })
        break
    }
  })

  await relaunch()
}
