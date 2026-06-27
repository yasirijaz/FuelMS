import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import type { ICashRepository } from '../domain/repositories/ICashRepository'
import { CashAccountId } from '../domain/entities/CashAccount'
import type { CashAccount, CashTransfer } from '../domain/entities/CashAccount'
import type {
  CashAccountVersionInput,
  CashTransferListQuery,
  CreateCashAccountInput,
  RecordCashTransferInput,
  UpdateCashAccountInput,
} from '../domain/validation/cashSchemas'

function seedAccounts(): CashAccount[] {
  const now = new Date('2026-06-26T08:00:00.000Z')
  return [
    {
      id: CashAccountId.fromPersisted('cash-drawer-main'),
      name: 'Cash Drawer',
      accountType: 'drawer',
      balanceMinor: rupeesToMinor(200_000),
      isActive: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: CashAccountId.fromPersisted('cash-bank-main'),
      name: 'Bank',
      accountType: 'bank',
      balanceMinor: rupeesToMinor(500_000),
      isActive: true,
      displayOrder: 2,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      id: CashAccountId.fromPersisted('cash-safe-main'),
      name: 'Safe',
      accountType: 'safe',
      balanceMinor: 0,
      isActive: true,
      displayOrder: 3,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ]
}

export class InMemoryCashRepository implements ICashRepository {
  private accounts = new Map<string, CashAccount>()
  private transfers: CashTransfer[] = []

  constructor() {
    for (const account of seedAccounts()) {
      this.accounts.set(CashAccountId.toString(account.id), account)
    }
  }

  private getAccount(id: CashAccountId): CashAccount | undefined {
    return this.accounts.get(CashAccountId.toString(id))
  }

  private putAccount(account: CashAccount): void {
    this.accounts.set(CashAccountId.toString(account.id), account)
  }

  async listAccounts(activeOnly = true): Promise<Result<CashAccount[], AppError>> {
    let rows = [...this.accounts.values()]
    if (activeOnly) rows = rows.filter((account) => account.isActive)
    rows.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    return ok(rows)
  }

  async findAccountById(id: CashAccountId): Promise<Result<CashAccount, NotFoundError>> {
    const account = this.getAccount(id)
    if (!account) return err(new NotFound('CashAccount', CashAccountId.toString(id)))
    return ok(account)
  }

  async createAccount(input: CreateCashAccountInput): Promise<Result<CashAccount, AppError>> {
    const id = CashAccountId.fromPersisted(`cash-${crypto.randomUUID()}`)
    const now = new Date()
    const opening =
      input.openingBalanceRupees != null ? rupeesToMinor(input.openingBalanceRupees) : 0

    const account: CashAccount = {
      id,
      name: input.name.trim(),
      accountType: input.accountType,
      balanceMinor: opening,
      isActive: true,
      displayOrder: input.displayOrder ?? 0,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.putAccount(account)
    return ok(account)
  }

  async updateAccount(input: UpdateCashAccountInput): Promise<Result<CashAccount, AppError>> {
    const account = this.getAccount(CashAccountId.fromPersisted(input.id))
    if (!account) return err(new NotFound('CashAccount', input.id))
    if (account.version !== input.version) {
      return err(
        new ConflictError(
          'ACCOUNT_VERSION_CONFLICT',
          'Account was modified by another process. Refresh and try again.',
        ),
      )
    }

    const updated: CashAccount = {
      ...account,
      name: input.name.trim(),
      displayOrder: input.displayOrder,
      notes: input.notes?.trim(),
      updatedAt: new Date(),
      version: account.version + 1,
    }
    this.putAccount(updated)
    return ok(updated)
  }

  async activateAccount(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>> {
    return this.setActive(input, true)
  }

  async deactivateAccount(input: CashAccountVersionInput): Promise<Result<CashAccount, AppError>> {
    return this.setActive(input, false)
  }

  private async setActive(
    input: CashAccountVersionInput,
    active: boolean,
  ): Promise<Result<CashAccount, AppError>> {
    const account = this.getAccount(CashAccountId.fromPersisted(input.accountId))
    if (!account) return err(new NotFound('CashAccount', input.accountId))
    if (account.version !== input.version) {
      return err(
        new ConflictError(
          'ACCOUNT_VERSION_CONFLICT',
          'Account was modified by another process. Refresh and try again.',
        ),
      )
    }

    const updated: CashAccount = {
      ...account,
      isActive: active,
      updatedAt: new Date(),
      version: account.version + 1,
    }
    this.putAccount(updated)
    return ok(updated)
  }

  async listTransfers(query: CashTransferListQuery): Promise<Result<CashTransfer[], AppError>> {
    let rows = [...this.transfers]
    if (query.accountId) {
      rows = rows.filter(
        (transfer) =>
          transfer.fromAccountId === query.accountId || transfer.toAccountId === query.accountId,
      )
    }
    rows.sort((a, b) => b.transferredAt.getTime() - a.transferredAt.getTime())
    const limit = query.limit ?? 50
    return ok(rows.slice(0, limit))
  }

  async recordTransfer(input: RecordCashTransferInput): Promise<Result<CashTransfer, AppError>> {
    if (input.fromAccountId === input.toAccountId) {
      return err(
        new ConflictError(
          'SAME_ACCOUNT_TRANSFER',
          'Source and destination must be different accounts.',
        ),
      )
    }

    const from = this.getAccount(CashAccountId.fromPersisted(input.fromAccountId))
    const to = this.getAccount(CashAccountId.fromPersisted(input.toAccountId))
    if (!from) return err(new NotFound('CashAccount', input.fromAccountId))
    if (!to) return err(new NotFound('CashAccount', input.toAccountId))
    if (!from.isActive || !to.isActive) {
      return err(
        new ConflictError('INACTIVE_ACCOUNT', 'Both accounts must be active to transfer cash.'),
      )
    }

    const amountMinor = rupeesToMinor(input.amountRupees)
    if (from.balanceMinor < amountMinor) {
      return err(
        new ConflictError(
          'INSUFFICIENT_BALANCE',
          'Source account does not have enough cash for this transfer.',
        ),
      )
    }

    const now = new Date()
    const transfer: CashTransfer = {
      id: `xfer-${crypto.randomUUID()}`,
      fromAccountId: CashAccountId.toString(from.id),
      fromAccountName: from.name,
      toAccountId: CashAccountId.toString(to.id),
      toAccountName: to.name,
      amountMinor,
      transferredAt: new Date(input.transferredAtIso),
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
      recordedBy: 'owner',
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.transfers.unshift(transfer)

    this.putAccount({
      ...from,
      balanceMinor: from.balanceMinor - amountMinor,
      updatedAt: now,
      version: from.version + 1,
    })
    this.putAccount({
      ...to,
      balanceMinor: to.balanceMinor + amountMinor,
      updatedAt: now,
      version: to.version + 1,
    })

    return ok(transfer)
  }
}
