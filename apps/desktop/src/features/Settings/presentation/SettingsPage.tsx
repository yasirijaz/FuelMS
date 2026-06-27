import { OrganizationManagementPage } from '@features/Organization/presentation/OrganizationManagementPage'
import { AppUpdatesCard } from './components/AppUpdatesCard'

export function SettingsPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-8 p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Application settings</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Check for updates, manage workspace organizations, and configure this installation.
        </p>
      </header>

      <AppUpdatesCard />

      <OrganizationManagementPage embedded />
    </section>
  )
}
