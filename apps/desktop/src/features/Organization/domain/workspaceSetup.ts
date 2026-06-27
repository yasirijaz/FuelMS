import type { Organization } from './entities/Organization'

type SetupSnapshot = {
  organizations: Organization[]
  activeOrganization: Organization | null
}

export function needsFirstTimeSetup(snapshot: SetupSnapshot): boolean {
  const hasActiveOrganization = snapshot.organizations.some((org) => org.isActive)
  return !hasActiveOrganization && snapshot.activeOrganization === null
}
