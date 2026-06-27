import {
  selectActiveOrganizations,
  shouldShowOrganizationSwitcher,
  useWorkspaceStore,
} from '@shared/stores/useWorkspaceStore'
import { useActivateOrganization } from '../application/hooks/useOrganizationQueries'

export function OrganizationSwitcher() {
  const organizations = useWorkspaceStore((state) => state.organizations)
  const activeOrganization = useWorkspaceStore((state) => state.activeOrganization)
  const activateMutation = useActivateOrganization()

  if (!shouldShowOrganizationSwitcher(organizations)) {
    return null
  }

  const activeOrgs = selectActiveOrganizations(organizations)
  const activeId = activeOrganization?.id.toString() ?? ''

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="font-medium">Organization</span>
      <select
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        value={activeId}
        disabled={activateMutation.isPending}
        onChange={(event) => {
          const nextId = event.target.value
          if (nextId && nextId !== activeId) {
            activateMutation.mutate(nextId)
          }
        }}
      >
        {activeOrgs.map((org) => (
          <option key={org.id.toString()} value={org.id.toString()}>
            {org.name.value}
          </option>
        ))}
      </select>
    </label>
  )
}
