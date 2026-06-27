import { formatMoneyDisplay } from '@fuelms/shared'
import {
  PARTNER_ROLE_LABELS,
  type PartnerRoleCode,
} from '@features/BusinessPartners/domain/valueObjects/PartnerRoleCode'
import type { PersonLedgerBalance } from '../../domain/entities/PersonLedgerBalance'
import type { PersonLedgerEntry } from '../../domain/entities/PersonLedgerEntry'
import { PersonLedgerEntryId } from '../../domain/entities/PersonLedgerEntry'
import { personLedgerEntryTypeLabel } from '../../domain/valueObjects/PersonLedgerEntryType'
import type { PersonLedgerBalanceListQuery } from '../../domain/validation/personLedgerSchemas'

export type BalanceOrientation = 'receivable' | 'payable' | 'settled'

export function balanceOrientation(balanceMinor: number): BalanceOrientation {
  if (balanceMinor > 0) return 'receivable'
  if (balanceMinor < 0) return 'payable'
  return 'settled'
}

export function balanceOrientationLabel(balanceMinor: number): string {
  const orientation = balanceOrientation(balanceMinor)
  if (orientation === 'receivable') return 'Receivable'
  if (orientation === 'payable') return 'Payable'
  return 'Settled'
}

export type PersonLedgerBalanceListItem = {
  partnerId: string
  partnerName: string
  roles: PartnerRoleCode[]
  rolesLabel: string
  balanceMinor: number
  balanceDisplay: string
  orientation: BalanceOrientation
  orientationLabel: string
  entryCount: number
  lastEntryDateIso?: string
}

export type PersonLedgerEntryListItem = {
  id: string
  entryDateIso: string
  entryTypeLabel: string
  signedAmountMinor: number
  signedAmountDisplay: string
  balanceAfterMinor: number
  balanceAfterDisplay: string
  cashAccountName?: string
  reference?: string
  notes?: string
}

export function mapBalanceToListItem(balance: PersonLedgerBalance): PersonLedgerBalanceListItem {
  return {
    partnerId: balance.partnerId,
    partnerName: balance.partnerName,
    roles: balance.roles,
    rolesLabel: balance.roles.map((role) => PARTNER_ROLE_LABELS[role]).join(', ') || '—',
    balanceMinor: balance.balanceMinor,
    balanceDisplay: formatMoneyDisplay(Math.abs(balance.balanceMinor)),
    orientation: balanceOrientation(balance.balanceMinor),
    orientationLabel: balanceOrientationLabel(balance.balanceMinor),
    entryCount: balance.entryCount,
    lastEntryDateIso: balance.lastEntryDate?.toISOString(),
  }
}

export function mapEntryToListItem(entry: PersonLedgerEntry): PersonLedgerEntryListItem {
  return {
    id: PersonLedgerEntryId.toString(entry.id),
    entryDateIso: entry.entryDate.toISOString(),
    entryTypeLabel: personLedgerEntryTypeLabel(entry.entryType),
    signedAmountMinor: entry.signedAmountMinor,
    signedAmountDisplay: formatMoneyDisplay(Math.abs(entry.signedAmountMinor)),
    balanceAfterMinor: entry.balanceAfterMinor,
    balanceAfterDisplay: formatMoneyDisplay(Math.abs(entry.balanceAfterMinor)),
    cashAccountName: entry.cashAccountName,
    reference: entry.reference,
    notes: entry.notes,
  }
}

export type PersonLedgerBalanceFilters = {
  search: string
  roleCode: '' | PartnerRoleCode
  nonZeroOnly: boolean
}

export const DEFAULT_PERSON_LEDGER_BALANCE_FILTERS: PersonLedgerBalanceFilters = {
  search: '',
  roleCode: '',
  nonZeroOnly: false,
}

export function toPersonLedgerBalanceQuery(
  filters: PersonLedgerBalanceFilters,
): PersonLedgerBalanceListQuery {
  return {
    search: filters.search.trim() || undefined,
    roleCode: filters.roleCode || undefined,
    nonZeroOnly: filters.nonZeroOnly || undefined,
  }
}
