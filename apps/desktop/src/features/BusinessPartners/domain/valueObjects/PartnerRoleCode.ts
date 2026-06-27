export const PARTNER_ROLE_CODES = [
  'customer',
  'supplier',
  'employee',
  'owner',
  'other',
] as const

export type PartnerRoleCode = (typeof PARTNER_ROLE_CODES)[number]

export const PARTNER_ROLE_LABELS: Record<PartnerRoleCode, string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  employee: 'Employee',
  owner: 'Owner',
  other: 'Other',
}

export function isPartnerRoleCode(value: string): value is PartnerRoleCode {
  return (PARTNER_ROLE_CODES as readonly string[]).includes(value)
}
