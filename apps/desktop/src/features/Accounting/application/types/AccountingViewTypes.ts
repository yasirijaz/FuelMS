import { formatMoneyDisplay } from '@fuelms/shared'
import type { PostingStatus } from '@fuelms/shared'
import type { JournalEntry } from '../../domain/entities/JournalEntry'
import type { LedgerAccount } from '../../domain/entities/LedgerAccount'
import type { AccountingPeriod } from '../../domain/entities/AccountingPeriod'
import { AccountingPeriodId } from '../../domain/entities/AccountingPeriod'
import { JournalEntryId } from '../../domain/entities/JournalEntry'
import { LedgerAccountId } from '../../domain/entities/LedgerAccount'
import { ACCOUNT_TYPE_LABELS, type AccountType } from '../../domain/valueObjects/AccountType'

export type LedgerAccountListItem = {
  id: string
  code: string
  name: string
  accountType: AccountType
  balanceMinor: number
  balanceDisplay: string
  displayOrder: number
}

export type JournalListItem = {
  id: string
  entryDateIso: string
  memoOrSource: string
  postingStatus: PostingStatus
  totalDebitMinor: number
  totalCreditMinor: number
  totalDebitDisplay: string
  totalCreditDisplay: string
  version: number
}

export type AccountingPeriodView = {
  id: string
  periodKey: string
  status: AccountingPeriod['status']
  startDateIso: string
  endDateIso: string
  version: number
}

export function mapLedgerAccountToListItem(account: LedgerAccount): LedgerAccountListItem {
  return {
    id: LedgerAccountId.toString(account.id),
    code: account.code,
    name: account.name,
    accountType: account.accountType,
    balanceMinor: account.balanceMinor,
    balanceDisplay: formatMoneyDisplay(account.balanceMinor),
    displayOrder: account.displayOrder,
  }
}

export function mapJournalEntryToListItem(entry: JournalEntry): JournalListItem {
  const memoOrSource =
    entry.memo?.trim() ||
    `${entry.sourceType} · ${entry.sourceId}`

  return {
    id: JournalEntryId.toString(entry.id),
    entryDateIso: entry.entryDate.toISOString(),
    memoOrSource,
    postingStatus: entry.postingStatus,
    totalDebitMinor: entry.totalDebitMinor,
    totalCreditMinor: entry.totalCreditMinor,
    totalDebitDisplay: formatMoneyDisplay(entry.totalDebitMinor),
    totalCreditDisplay: formatMoneyDisplay(entry.totalCreditMinor),
    version: entry.version,
  }
}

export function mapAccountingPeriodToView(period: AccountingPeriod): AccountingPeriodView {
  return {
    id: AccountingPeriodId.toString(period.id),
    periodKey: period.periodKey,
    status: period.status,
    startDateIso: period.startDate.toISOString(),
    endDateIso: period.endDate.toISOString(),
    version: period.version,
  }
}

export function groupAccountsByType(
  accounts: LedgerAccountListItem[],
): { accountType: AccountType; label: string; accounts: LedgerAccountListItem[] }[] {
  const order: AccountType[] = ['asset', 'liability', 'equity', 'income', 'expense']
  return order.map((accountType) => ({
    accountType,
    label: ACCOUNT_TYPE_LABELS[accountType],
    accounts: accounts
      .filter((account) => account.accountType === accountType)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code)),
  }))
}

export const DEFAULT_JOURNAL_LIST_QUERY = { limit: 50 } as const
