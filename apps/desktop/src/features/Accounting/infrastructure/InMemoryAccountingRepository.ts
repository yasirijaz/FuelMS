import { ok, err } from '@fuelms/core'
import type { Result, AppError, NotFoundError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import type { IAccountingRepository } from '../domain/repositories/IAccountingRepository'
import { AccountingPeriodId } from '../domain/entities/AccountingPeriod'
import type { AccountingPeriod } from '../domain/entities/AccountingPeriod'
import { JournalEntryId } from '../domain/entities/JournalEntry'
import type { JournalEntry, JournalLine } from '../domain/entities/JournalEntry'
import { LedgerAccountId } from '../domain/entities/LedgerAccount'
import type { LedgerAccount } from '../domain/entities/LedgerAccount'
import type {
  AccountingPeriodVersionInput,
  JournalListQuery,
} from '../domain/validation/accountingSchemas'

const SEED_TIMESTAMP = new Date('2026-06-26T08:00:00.000Z')

type SeedAccount = Omit<LedgerAccount, 'balanceMinor'> & { balanceMinor?: number }

function seedLedgerAccounts(): LedgerAccount[] {
  const rows: SeedAccount[] = [
    {
      id: LedgerAccountId.fromPersisted('la-root-assets'),
      code: '1000',
      name: 'Assets',
      accountType: 'asset',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 100,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-cash-drawer'),
      code: '1100',
      name: 'Cash Drawer',
      accountType: 'asset',
      parentId: 'la-root-assets',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 110,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-bank'),
      code: '1110',
      name: 'Bank',
      accountType: 'asset',
      parentId: 'la-root-assets',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 111,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-safe'),
      code: '1120',
      name: 'Safe',
      accountType: 'asset',
      parentId: 'la-root-assets',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 112,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-receivable'),
      code: '1200',
      name: 'Accounts Receivable',
      accountType: 'asset',
      parentId: 'la-root-assets',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 120,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-fuel-inventory'),
      code: '1300',
      name: 'Fuel Inventory',
      accountType: 'asset',
      parentId: 'la-root-assets',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 130,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-root-liabilities'),
      code: '2000',
      name: 'Liabilities',
      accountType: 'liability',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 200,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-payable'),
      code: '2100',
      name: 'Accounts Payable',
      accountType: 'liability',
      parentId: 'la-root-liabilities',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 210,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-loans'),
      code: '2200',
      name: 'Loans Payable',
      accountType: 'liability',
      parentId: 'la-root-liabilities',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 220,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-root-equity'),
      code: '3000',
      name: 'Owner Equity',
      accountType: 'equity',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 300,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-owner-drawings'),
      code: '3100',
      name: 'Owner Drawings',
      accountType: 'equity',
      parentId: 'la-root-equity',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 310,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-root-income'),
      code: '4000',
      name: 'Income',
      accountType: 'income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 400,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-fuel-sales'),
      code: '4100',
      name: 'Fuel Sales Revenue',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 410,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-rent-income'),
      code: '4200',
      name: 'Rent Income',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 420,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-property-income'),
      code: '4300',
      name: 'Property Income',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 430,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-commission-income'),
      code: '4400',
      name: 'Commission Income',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 440,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-service-income'),
      code: '4500',
      name: 'Service Income',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 450,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-other-income'),
      code: '4600',
      name: 'Other Income',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 460,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-root-expenses'),
      code: '5000',
      name: 'Expenses',
      accountType: 'expense',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 500,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-cogs'),
      code: '5100',
      name: 'Cost of Goods Sold',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 510,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-maint-expense'),
      code: '5200',
      name: 'Maintenance Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 520,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-elec-expense'),
      code: '5300',
      name: 'Electricity Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 530,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-salary-expense'),
      code: '5400',
      name: 'Salary Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 540,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-gen-expense'),
      code: '5500',
      name: 'Generator Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 550,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-transport-expense'),
      code: '5600',
      name: 'Transport Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 560,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-stationery-expense'),
      code: '5700',
      name: 'Stationery Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 570,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-vehicle-expense'),
      code: '5800',
      name: 'Vehicle Repair Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 580,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-other-expense'),
      code: '5900',
      name: 'Other Operating Expense',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 590,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-inv-gain'),
      code: '6000',
      name: 'Inventory Adjustment Gain',
      accountType: 'income',
      parentId: 'la-root-income',
      isSystem: true,
      isActive: true,
      normalBalance: 'credit',
      displayOrder: 600,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
    {
      id: LedgerAccountId.fromPersisted('la-inv-loss'),
      code: '6100',
      name: 'Inventory Adjustment Loss',
      accountType: 'expense',
      parentId: 'la-root-expenses',
      isSystem: true,
      isActive: true,
      normalBalance: 'debit',
      displayOrder: 610,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
      version: 1,
    },
  ]

  return rows.map((row) => ({ ...row, balanceMinor: row.balanceMinor ?? 0 }))
}

function seedAccountingPeriod(): AccountingPeriod {
  return {
    id: AccountingPeriodId.fromPersisted('period-2026-06'),
    periodKey: '2026-06',
    periodType: 'month',
    startDate: new Date('2026-06-01T00:00:00.000Z'),
    endDate: new Date('2026-06-30T23:59:59.999Z'),
    status: 'open',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  }
}

const SAMPLE_JOURNAL_AMOUNT_MINOR = 50_000

function createSampleJournal(accounts: Map<string, LedgerAccount>): {
  entry: JournalEntry
  lines: JournalLine[]
} {
  const cash = accounts.get('la-cash-drawer')!
  const revenue = accounts.get('la-fuel-sales')!
  const postedAt = new Date('2026-06-15T10:00:00.000Z')

  const lines: JournalLine[] = [
    {
      id: 'jl-sample-1',
      accountId: 'la-cash-drawer',
      accountCode: cash.code,
      accountName: cash.name,
      debitMinor: SAMPLE_JOURNAL_AMOUNT_MINOR,
      creditMinor: 0,
    },
    {
      id: 'jl-sample-2',
      accountId: 'la-fuel-sales',
      accountCode: revenue.code,
      accountName: revenue.name,
      debitMinor: 0,
      creditMinor: SAMPLE_JOURNAL_AMOUNT_MINOR,
    },
  ]

  const entry: JournalEntry = {
    id: JournalEntryId.fromPersisted('je-sample-1'),
    entryDate: postedAt,
    memo: 'Sample fuel sale posting',
    sourceType: 'manual',
    sourceId: 'sample-1',
    postingStatus: 'posted',
    postedAt,
    postedBy: 'owner',
    totalDebitMinor: SAMPLE_JOURNAL_AMOUNT_MINOR,
    totalCreditMinor: SAMPLE_JOURNAL_AMOUNT_MINOR,
    lineCount: 2,
    createdAt: postedAt,
    updatedAt: postedAt,
    version: 1,
  }

  return { entry, lines }
}

export type InMemoryAccountingRepositoryOptions = {
  includeSampleJournal?: boolean
}

export class InMemoryAccountingRepository implements IAccountingRepository {
  private accounts = new Map<string, LedgerAccount>()
  private journals: JournalEntry[] = []
  private journalLines = new Map<string, JournalLine[]>()
  private periods: AccountingPeriod[]

  constructor(options?: InMemoryAccountingRepositoryOptions) {
    for (const account of seedLedgerAccounts()) {
      this.accounts.set(LedgerAccountId.toString(account.id), account)
    }
    this.periods = [seedAccountingPeriod()]

    if (options?.includeSampleJournal !== false) {
      this.seedSampleJournal()
    }
  }

  private seedSampleJournal(): void {
    const { entry, lines } = createSampleJournal(this.accounts)
    this.journals.push(entry)
    this.journalLines.set(JournalEntryId.toString(entry.id), lines)

    this.adjustAccountBalance('la-cash-drawer', SAMPLE_JOURNAL_AMOUNT_MINOR)
    this.adjustAccountBalance('la-fuel-sales', SAMPLE_JOURNAL_AMOUNT_MINOR)
  }

  private adjustAccountBalance(accountId: string, deltaMinor: number): void {
    const account = this.accounts.get(accountId)
    if (!account) return
    this.accounts.set(accountId, {
      ...account,
      balanceMinor: account.balanceMinor + deltaMinor,
      updatedAt: new Date(),
    })
  }

  private getAccount(id: LedgerAccountId): LedgerAccount | undefined {
    return this.accounts.get(LedgerAccountId.toString(id))
  }

  private getJournal(id: JournalEntryId): JournalEntry | undefined {
    return this.journals.find((entry) => entry.id === id)
  }

  async listLedgerAccounts(activeOnly = true): Promise<Result<LedgerAccount[], AppError>> {
    let rows = [...this.accounts.values()]
    if (activeOnly) rows = rows.filter((account) => account.isActive)
    rows.sort((a, b) => a.displayOrder - b.displayOrder || a.code.localeCompare(b.code))
    return ok(rows)
  }

  async findLedgerAccountById(
    id: LedgerAccountId,
  ): Promise<Result<LedgerAccount, NotFoundError>> {
    const account = this.getAccount(id)
    if (!account) return err(new NotFound('LedgerAccount', LedgerAccountId.toString(id)))
    return ok(account)
  }

  async listJournalEntries(query: JournalListQuery): Promise<Result<JournalEntry[], AppError>> {
    let rows = [...this.journals]

    if (query.search?.trim()) {
      const term = query.search.trim().toLowerCase()
      rows = rows.filter(
        (entry) =>
          entry.memo?.toLowerCase().includes(term) ||
          entry.sourceType.toLowerCase().includes(term) ||
          entry.sourceId.toLowerCase().includes(term),
      )
    }

    if (query.postingStatus) {
      rows = rows.filter((entry) => entry.postingStatus === query.postingStatus)
    }

    if (query.fromDateIso) {
      const from = new Date(query.fromDateIso).getTime()
      rows = rows.filter((entry) => entry.entryDate.getTime() >= from)
    }

    if (query.toDateIso) {
      const to = new Date(query.toDateIso).getTime()
      rows = rows.filter((entry) => entry.entryDate.getTime() <= to)
    }

    rows.sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime())
    const limit = query.limit ?? 50
    return ok(rows.slice(0, limit))
  }

  async findJournalEntryById(
    id: JournalEntryId,
  ): Promise<Result<JournalEntry, NotFoundError>> {
    const entry = this.getJournal(id)
    if (!entry) return err(new NotFound('JournalEntry', JournalEntryId.toString(id)))
    const lines = this.journalLines.get(JournalEntryId.toString(id))
    return ok({ ...entry, lines })
  }

  async listAccountingPeriods(): Promise<Result<AccountingPeriod[], AppError>> {
    const rows = [...this.periods].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    return ok(rows)
  }

  async getCurrentAccountingPeriod(): Promise<Result<AccountingPeriod, AppError>> {
    const today = new Date()
    const current = this.periods.find(
      (period) => period.startDate <= today && period.endDate >= today,
    )
    if (!current) {
      return err(
        new ConflictError('NO_CURRENT_PERIOD', "No accounting period covers today's date."),
      )
    }
    return ok(current)
  }

  async closeAccountingPeriod(
    input: AccountingPeriodVersionInput,
  ): Promise<Result<AccountingPeriod, AppError>> {
    const index = this.periods.findIndex((period) => AccountingPeriodId.toString(period.id) === input.periodId)
    if (index < 0) return err(new NotFound('AccountingPeriod', input.periodId))

    const existing = this.periods[index]!
    if (existing.status === 'closed') {
      return err(new ConflictError('ALREADY_CLOSED', 'This period is already closed.'))
    }
    if (existing.version !== input.version) {
      return err(
        new ConflictError(
          'VERSION_CONFLICT',
          'Period was modified by another process. Refresh and try again.',
        ),
      )
    }

    const now = new Date()
    const updated: AccountingPeriod = {
      ...existing,
      status: 'closed',
      closedAt: now,
      closedBy: 'owner',
      updatedAt: now,
      version: existing.version + 1,
    }
    this.periods[index] = updated
    return ok(updated)
  }

  async reopenAccountingPeriod(
    input: AccountingPeriodVersionInput,
  ): Promise<Result<AccountingPeriod, AppError>> {
    const index = this.periods.findIndex((period) => AccountingPeriodId.toString(period.id) === input.periodId)
    if (index < 0) return err(new NotFound('AccountingPeriod', input.periodId))

    const existing = this.periods[index]!
    if (existing.status === 'open') {
      return err(new ConflictError('ALREADY_OPEN', 'This period is already open.'))
    }
    if (existing.version !== input.version) {
      return err(
        new ConflictError(
          'VERSION_CONFLICT',
          'Period was modified by another process. Refresh and try again.',
        ),
      )
    }

    const now = new Date()
    const updated: AccountingPeriod = {
      ...existing,
      status: 'open',
      closedAt: undefined,
      closedBy: undefined,
      updatedAt: now,
      version: existing.version + 1,
    }
    this.periods[index] = updated
    return ok(updated)
  }
}
