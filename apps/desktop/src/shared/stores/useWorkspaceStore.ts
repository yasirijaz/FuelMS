import { create } from 'zustand'
import type { Organization } from '@features/Organization/domain/entities/Organization'
import type { Workspace } from '@features/Organization/domain/entities/Workspace'

type WorkspaceSnapshot = {
  workspace: Workspace | null
  organizations: Organization[]
  activeOrganization: Organization | null
}

type WorkspaceState = WorkspaceSnapshot & {
  isHydrated: boolean
  setSnapshot: (snapshot: WorkspaceSnapshot) => void
  clear: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  organizations: [],
  activeOrganization: null,
  isHydrated: false,
  setSnapshot: (snapshot) =>
    set({
      ...snapshot,
      isHydrated: true,
    }),
  clear: () =>
    set({
      workspace: null,
      organizations: [],
      activeOrganization: null,
      isHydrated: false,
    }),
}))

export function selectActiveOrganizations(organizations: Organization[]): Organization[] {
  return organizations.filter((org) => org.isActive)
}

export function shouldShowOrganizationSwitcher(organizations: Organization[]): boolean {
  return selectActiveOrganizations(organizations).length > 1
}
