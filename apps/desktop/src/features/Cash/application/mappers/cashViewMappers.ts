import type { TransactionTimelineEntry } from '@fuelms/shared'
import type { CashAccount, CashTransfer } from '../../domain/entities/CashAccount'
import { CashAccountId } from '../../domain/entities/CashAccount'
import { cashAccountTypeLabel } from '../../domain/valueObjects/CashAccountType'

export type CashAccountListItem = {
  id: string
  name: string
  accountType: CashAccount['accountType']
  accountTypeLabel: string
  balanceMinor: number
  isActive: boolean
  displayOrder: number
  notes?: string
  version: number
}

export function mapAccountToListItem(account: CashAccount): CashAccountListItem {
  return {
    id: CashAccountId.toString(account.id),
    name: account.name,
    accountType: account.accountType,
    accountTypeLabel: cashAccountTypeLabel(account.accountType),
    balanceMinor: account.balanceMinor,
    isActive: account.isActive,
    displayOrder: account.displayOrder,
    notes: account.notes,
    version: account.version,
  }
}

export type TransferListItem = {
  id: string
  fromAccountName: string
  toAccountName: string
  amountMinor: number
  transferredAtIso: string
  reference?: string
  notes?: string
}

export function mapTransferToListItem(transfer: CashTransfer): TransferListItem {
  return {
    id: transfer.id,
    fromAccountName: transfer.fromAccountName,
    toAccountName: transfer.toAccountName,
    amountMinor: transfer.amountMinor,
    transferredAtIso: transfer.transferredAt.toISOString(),
    reference: transfer.reference,
    notes: transfer.notes,
  }
}

export function mapTransferToTimelineEntry(transfer: TransferListItem): TransactionTimelineEntry {
  return {
    id: transfer.id,
    occurredAtIso: transfer.transferredAtIso,
    title: `${transfer.fromAccountName} → ${transfer.toAccountName}`,
    description: transfer.reference ?? transfer.notes,
    amountMinor: transfer.amountMinor,
    tone: 'neutral',
  }
}
