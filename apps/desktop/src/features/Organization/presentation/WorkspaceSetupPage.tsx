import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { env } from '@shared/lib/env'
import type { InitializeWorkspaceInput } from '../domain'
import { initializeWorkspaceInputSchema } from '../domain'
import { useInitializeWorkspace } from '../application/hooks/useOrganizationQueries'

type WorkspaceSetupPageProps = {
  onComplete: () => void
}

export function WorkspaceSetupPage({ onComplete }: WorkspaceSetupPageProps) {
  const initializeMutation = useInitializeWorkspace()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InitializeWorkspaceInput>({
    resolver: zodResolver(initializeWorkspaceInputSchema),
    defaultValues: {
      workspaceName: '',
      name: '',
      city: '',
      phone: '',
    },
  })

  const organizationName = watch('name')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ui-surface-muted)] px-6 py-12">
      <div className="w-full max-w-lg rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-sm)]">
        <header className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--ui-text-subtle)]">
            First-time setup
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ui-text)]">
            Welcome to {env.APP_NAME}
          </h1>
          <p className="text-sm text-[var(--ui-text-muted)]">
            Create your workspace and petrol pump profile to start recording sales, stock, and cash.
          </p>
        </header>

        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit(async (values) => {
            const workspaceName = values.workspaceName?.trim() || values.name.trim()
            await initializeMutation.mutateAsync({ ...values, workspaceName })
            onComplete()
          })}
        >
          <div>
            <label className="block text-sm font-medium text-[var(--ui-text)]" htmlFor="setup-name">
              Petrol pump name *
            </label>
            <input
              id="setup-name"
              className="mt-1 w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)]"
              placeholder="e.g. City Star Petroleum"
              {...register('name', {
                onChange: (event) => {
                  const value = event.target.value
                  if (!watch('workspaceName')) {
                    setValue('workspaceName', value, { shouldValidate: false })
                  }
                },
              })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-[var(--ui-text)]"
              htmlFor="setup-workspace"
            >
              Workspace label
            </label>
            <input
              id="setup-workspace"
              className="mt-1 w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-text)]"
              placeholder={organizationName || 'Shown in the app header'}
              {...register('workspaceName')}
            />
            <p className="mt-1 text-xs text-[var(--ui-text-subtle)]">
              Optional display name for this installation. Defaults to your pump name.
            </p>
            {errors.workspaceName && (
              <p className="mt-1 text-xs text-red-600">{errors.workspaceName.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--ui-text)]" htmlFor="setup-city">
                City
              </label>
              <input
                id="setup-city"
                className="mt-1 w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm"
                {...register('city')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ui-text)]" htmlFor="setup-phone">
                Phone
              </label>
              <input
                id="setup-phone"
                className="mt-1 w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm"
                {...register('phone')}
              />
            </div>
          </div>

          {initializeMutation.isError && (
            <p className="text-sm text-red-600">
              {initializeMutation.error instanceof Error
                ? initializeMutation.error.message
                : 'Failed to set up workspace.'}
            </p>
          )}

          <button
            type="submit"
            disabled={initializeMutation.isPending}
            className="w-full rounded-[var(--ui-radius)] bg-[var(--ui-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {initializeMutation.isPending ? 'Creating workspace…' : 'Create workspace & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
