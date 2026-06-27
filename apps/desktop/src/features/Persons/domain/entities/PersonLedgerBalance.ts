import type { PartnerRoleCode } from '@features/BusinessPartners/domain/valueObjects/PartnerRoleCode'

export type PersonLedgerBalance = {
  partnerId: string
  partnerName: string
  roles: PartnerRoleCode[]
  balanceMinor: number
  entryCount: number
  lastEntryDate?: Date
}
