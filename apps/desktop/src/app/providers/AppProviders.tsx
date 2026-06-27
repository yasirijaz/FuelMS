import { UiProvider } from '@app/providers/UiProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'
import { ErrorBoundary } from '@shared/components/ErrorBoundary'
import { createQueryClient } from '@shared/lib/queryClient'
import { logger } from '@shared/lib/logger'
import { ThemeProvider } from '@app/theme/ThemeProvider'
import { WorkspaceBootstrap } from '@features/Organization/presentation/WorkspaceBootstrap'
import { AppUpdaterBootstrap } from '@features/Settings/presentation/AppUpdaterBootstrap'
import type { ErrorInfo } from 'react'

function handleRootError(error: Error, info: ErrorInfo): void {
  logger.error('AppProviders', 'Unhandled render error', {
    message: error.message,
    componentStack: info.componentStack,
  })
}

/**
 * AppProviders — single composition root for all React contexts.
 *
 * Order matters:
 *   1. ThemeProvider       — CSS variables + dark class on <html>
 *   2. UiProvider          — toast, modal, confirm, command palette
 *   3. QueryClientProvider — data fetching for feature hooks
 *   4. ErrorBoundary       — render error containment
 *   5. WorkspaceBootstrap  — active organization context
 */
export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <ThemeProvider>
      <UiProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary name="AppRoot" onError={handleRootError}>
            <WorkspaceBootstrap>
              <AppUpdaterBootstrap />
              {children}
            </WorkspaceBootstrap>
          </ErrorBoundary>
        </QueryClientProvider>
      </UiProvider>
    </ThemeProvider>
  )
}
