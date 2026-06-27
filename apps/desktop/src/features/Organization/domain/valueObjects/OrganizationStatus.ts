export const ORGANIZATION_STATUSES = ['active', 'archived'] as const
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number]

export function isOrganizationStatus(value: string): value is OrganizationStatus {
  return (ORGANIZATION_STATUSES as readonly string[]).includes(value)
}
