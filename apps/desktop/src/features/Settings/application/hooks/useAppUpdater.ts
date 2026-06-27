import { useCallback, useState } from 'react'
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  isUpdaterSupported,
  type DownloadProgress,
  type UpdateCheckResult,
} from '../services/appUpdateService'

type UpdaterPhase = 'idle' | 'checking' | 'installing'

export function useAppUpdater() {
  const [phase, setPhase] = useState<UpdaterPhase>('idle')
  const [result, setResult] = useState<UpdateCheckResult | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = useCallback(async (): Promise<UpdateCheckResult> => {
    setPhase('checking')
    setError(null)
    setProgress(null)

    try {
      const nextResult = await checkForAppUpdate()
      setResult(nextResult)
      return nextResult
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not check for updates.'
      setError(message)
      throw caught
    } finally {
      setPhase('idle')
    }
  }, [])

  const install = useCallback(async (): Promise<void> => {
    setPhase('installing')
    setError(null)
    setProgress(null)

    try {
      await downloadAndInstallUpdate(setProgress)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not install the update.'
      setError(message)
      setPhase('idle')
      throw caught
    }
  }, [])

  return {
    isSupported: isUpdaterSupported(),
    phase,
    result,
    progress,
    error,
    check,
    install,
  }
}
