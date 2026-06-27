import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import { rupeesToMinor } from '@fuelms/shared'
import type { PartnerRoleCode } from '@features/BusinessPartners/domain/valueObjects/PartnerRoleCode'
import type { IPersonLedgerRepository } from '../domain/repositories/IPersonLedgerRepository'
import type { PersonLedgerBalance } from '../domain/entities/PersonLedgerBalance'
import type { PersonLedgerEntry } from '../domain/entities/PersonLedgerEntry'
import { PersonLedgerEntryId } from '../domain/entities/PersonLedgerEntry'
import type { PersonLedgerEntryType } from '../domain/valueObjects/PersonLedgerEntryType'
import type {
  PersonLedgerBalanceListQuery,
  PersonLedgerEntryListQuery,
  RecordPersonBorrowInput,
  RecordPersonCollectLoanInput,
  RecordPersonLendInput,
  RecordPersonRepayBorrowedInput,
} from '../domain/validation/personLedgerSchemas'

type InMemoryPartner = {
  id: string
  name: string
  roles: PartnerRoleCode[]
}

const CASH_ACCOUNT_NAMES: Record<string, string> = {
  'cash-drawer-main': 'Cash Drawer',
  'cash-bank-main': 'Bank',
}

function seedPartners(): InMemoryPartner[] {
  return [
    { id: 'bp-owner-ali', name: 'Ali (Owner)', roles: ['owner'] },
    { id: 'bp-employee-hassan', name: 'Hassan (Employee)', roles: ['employee'] },
    { id: 'bp-father', name: 'Father', roles: ['other'] },
  ]
}

export class InMemoryPersonLedgerRepository implements IPersonLedgerRepository {
  private readonly partners = seedPartners()
  private entries: PersonLedgerEntry[] = []
  private cashBalances = new Map<string, number>([
    ['cash-drawer-main', rupeesToMinor(200_000)],
    ['cash-bank-main', rupeesToMinor(500_000)],
  ])

  private getPartner(partnerId: string): InMemoryPartner | undefined {
    return this.partners.find((partner) => partner.id === partnerId)
  }

  private getCashBalance(accountId: string): number {
    return this.cashBalances.get(accountId) ?? 0
  }

  private adjustCash(accountId: string, delta: number): Result<void, AppError> {
    const next = this.getCashBalance(accountId) + delta
    if (next < 0) {
      return err(
        new ConflictError(
          'INSUFFICIENT_CASH',
          'Selected cash account has insufficient balance or is inactive.',
        ),
      )
    }
    this.cashBalances.set(accountId, next)
    return ok(undefined)
  }

  private partnerBalance(partnerId: string): number {
    return this.entries
      .filter((entry) => entry.partnerId === partnerId && entry.status === 'posted')
      .reduce((sum, entry) => sum + entry.signedAmountMinor, 0)
  }

  private partnerEntryCount(partnerId: string): number {
    return this.entries.filter(
      (entry) => entry.partnerId === partnerId && entry.status === 'posted',
    ).length
  }

  private lastEntryDate(partnerId: string): Date | undefined {
    const posted = this.entries.filter(
      (entry) => entry.partnerId === partnerId && entry.status === 'posted',
    )
    if (posted.length === 0) return undefined
    return posted.reduce(
      (latest, entry) => (entry.entryDate > latest ? entry.entryDate : latest),
      posted[0]!.entryDate,
    )
  }

  private insertEntry(params: {
    partnerId: string
    entryDateIso: string
    entryType: PersonLedgerEntryType
    signedAmountMinor: number
    cashAccountId?: string
    sourceType: string
    sourceId: string
    reference?: string
    notes?: string
  }): Result<PersonLedgerEntry, AppError> {
    const partner = this.getPartner(params.partnerId)
    if (!partner) {
      return err(new NotFound('BusinessPartner', params.partnerId))
    }

    const now = new Date()
    const balanceAfter = this.partnerBalance(params.partnerId) + params.signedAmountMinor
    const entry: PersonLedgerEntry = {
      id: PersonLedgerEntryId.fromPersisted(`ple-${crypto.randomUUID()}`),
      partnerId: params.partnerId,
      partnerName: partner.name,
      entryDate: new Date(params.entryDateIso),
      entryType: params.entryType,
      signedAmountMinor: params.signedAmountMinor,
      balanceAfterMinor: balanceAfter,
      cashAccountId: params.cashAccountId,
      cashAccountName: params.cashAccountId
        ? CASH_ACCOUNT_NAMES[params.cashAccountId]
        : undefined,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      reference: params.reference,
      notes: params.notes,
      status: 'posted',
      recordedBy: 'owner',
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    this.entries.unshift(entry)
    return ok(entry)
  }

  async listBalances(
    query: PersonLedgerBalanceListQuery,
  ): Promise<Result<PersonLedgerBalance[], AppError>> {
    let rows: PersonLedgerBalance[] = this.partners.map((partner) => ({
      partnerId: partner.id,
      partnerName: partner.name,
      roles: [...partner.roles],
      balanceMinor: this.partnerBalance(partner.id),
      entryCount: this.partnerEntryCount(partner.id),
      lastEntryDate: this.lastEntryDate(partner.id),
    }))

    if (query.search) {
      const term = query.search.toLowerCase()
      rows = rows.filter((row) => row.partnerName.toLowerCase().includes(term))
    }

    if (query.roleCode) {
      rows = rows.filter((row) => row.roles.includes(query.roleCode!))
    }

    if (query.nonZeroOnly) {
      rows = rows.filter((row) => row.balanceMinor !== 0)
    }

    rows.sort((a, b) => {
      const absDiff = Math.abs(b.balanceMinor) - Math.abs(a.balanceMinor)
      if (absDiff !== 0) return absDiff
      return a.partnerName.localeCompare(b.partnerName, undefined, { sensitivity: 'base' })
    })

    return ok(rows)
  }

  async listEntries(
    query: PersonLedgerEntryListQuery,
  ): Promise<Result<PersonLedgerEntry[], AppError>> {
    let rows = this.entries
      .filter((entry) => entry.partnerId === query.partnerId && entry.status === 'posted')
      .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime())

    if (query.limit) {
      rows = rows.slice(0, query.limit)
    }

    return ok(rows)
  }

  async recordBorrow(input: RecordPersonBorrowInput): Promise<Result<PersonLedgerEntry, AppError>> {
    const amountMinor = rupeesToMinor(input.amountRupees)
    const cash = this.adjustCash(input.cashAccountId, amountMinor)
    if (!cash.ok) return cash

    return this.insertEntry({
      partnerId: input.partnerId,
      entryDateIso: input.entryDateIso,
      entryType: 'borrow_from_person',
      signedAmountMinor: -amountMinor,
      cashAccountId: input.cashAccountId,
      sourceType: 'person_ledger_borrow',
      sourceId: `borrow-${crypto.randomUUID()}`,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
    })
  }

  async recordRepayBorrowed(
    input: RecordPersonRepayBorrowedInput,
  ): Promise<Result<PersonLedgerEntry, AppError>> {
    const amountMinor = rupeesToMinor(input.amountRupees)
    const cash = this.adjustCash(input.cashAccountId, -amountMinor)
    if (!cash.ok) return cash

    return this.insertEntry({
      partnerId: input.partnerId,
      entryDateIso: input.entryDateIso,
      entryType: 'repay_borrowed',
      signedAmountMinor: amountMinor,
      cashAccountId: input.cashAccountId,
      sourceType: 'person_ledger_repay',
      sourceId: `repay-${crypto.randomUUID()}`,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
    })
  }

  async recordLend(input: RecordPersonLendInput): Promise<Result<PersonLedgerEntry, AppError>> {
    const amountMinor = rupeesToMinor(input.amountRupees)
    const cash = this.adjustCash(input.cashAccountId, -amountMinor)
    if (!cash.ok) return cash

    return this.insertEntry({
      partnerId: input.partnerId,
      entryDateIso: input.entryDateIso,
      entryType: 'lend_to_person',
      signedAmountMinor: amountMinor,
      cashAccountId: input.cashAccountId,
      sourceType: 'person_ledger_lend',
      sourceId: `lend-${crypto.randomUUID()}`,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
    })
  }

  async recordCollectLoan(
    input: RecordPersonCollectLoanInput,
  ): Promise<Result<PersonLedgerEntry, AppError>> {
    const amountMinor = rupeesToMinor(input.amountRupees)
    const cash = this.adjustCash(input.cashAccountId, amountMinor)
    if (!cash.ok) return cash

    return this.insertEntry({
      partnerId: input.partnerId,
      entryDateIso: input.entryDateIso,
      entryType: 'collect_loan_repayment',
      signedAmountMinor: -amountMinor,
      cashAccountId: input.cashAccountId,
      sourceType: 'person_ledger_collect',
      sourceId: `collect-${crypto.randomUUID()}`,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
    })
  }
}
