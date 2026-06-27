import { isPostingStatus } from '@fuelms/shared'
import type {
  AccountingPeriodDto,
  JournalEntryDto,
  JournalLineDto,
  LedgerAccountDto,
} from '../dtos/AccountingDtos'
import type { AccountingPeriod } from '../entities/AccountingPeriod'
import { AccountingPeriodId } from '../entities/AccountingPeriod'
import type { JournalEntry, JournalLine } from '../entities/JournalEntry'
import { JournalEntryId } from '../entities/JournalEntry'
import type { LedgerAccount } from '../entities/LedgerAccount'
import { LedgerAccountId } from '../entities/LedgerAccount'
import { isAccountType } from '../valueObjects/AccountType'
import { isNormalBalance } from '../valueObjects/NormalBalance'
import { isPeriodStatus } from '../valueObjects/PeriodStatus'
import { isPeriodType } from '../valueObjects/PeriodType'

function assertAccountType(value: string) {
  if (!isAccountType(value)) throw new Error(`Invalid account type: ${value}`)
  return value
}

function assertNormalBalance(value: string) {
  if (!isNormalBalance(value)) throw new Error(`Invalid normal balance: ${value}`)
  return value
}

function assertPeriodStatus(value: string) {
  if (!isPeriodStatus(value)) throw new Error(`Invalid period status: ${value}`)
  return value
}

function assertPeriodType(value: string) {
  if (!isPeriodType(value)) throw new Error(`Invalid period type: ${value}`)
  return value
}

function assertPostingStatus(value: string) {
  if (!isPostingStatus(value)) throw new Error(`Invalid posting status: ${value}`)
  return value
}

function mapJournalLineDtoToDomain(dto: JournalLineDto): JournalLine {
  return {
    id: dto.id,
    accountId: dto.accountId,
    accountCode: dto.accountCode,
    accountName: dto.accountName,
    lineMemo: dto.lineMemo ?? undefined,
    debitMinor: dto.debitMinor,
    creditMinor: dto.creditMinor,
  }
}

export function mapLedgerAccountDtoToDomain(dto: LedgerAccountDto): LedgerAccount {
  return {
    id: LedgerAccountId.fromPersisted(dto.id),
    code: dto.code,
    name: dto.name,
    accountType: assertAccountType(dto.accountType),
    parentId: dto.parentId ?? undefined,
    isSystem: dto.isSystem,
    isActive: dto.isActive,
    normalBalance: assertNormalBalance(dto.normalBalance),
    displayOrder: dto.displayOrder,
    notes: dto.notes ?? undefined,
    balanceMinor: dto.balanceMinor,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapJournalEntryDtoToDomain(dto: JournalEntryDto): JournalEntry {
  return {
    id: JournalEntryId.fromPersisted(dto.id),
    entryDate: new Date(dto.entryDateIso),
    memo: dto.memo ?? undefined,
    sourceType: dto.sourceType,
    sourceId: dto.sourceId,
    postingStatus: assertPostingStatus(dto.postingStatus),
    postedAt: dto.postedAtIso ? new Date(dto.postedAtIso) : undefined,
    postedBy: dto.postedBy ?? undefined,
    totalDebitMinor: dto.totalDebitMinor,
    totalCreditMinor: dto.totalCreditMinor,
    lineCount: dto.lineCount,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
    lines: dto.lines?.map(mapJournalLineDtoToDomain),
  }
}

export function mapAccountingPeriodDtoToDomain(dto: AccountingPeriodDto): AccountingPeriod {
  return {
    id: AccountingPeriodId.fromPersisted(dto.id),
    periodKey: dto.periodKey,
    periodType: assertPeriodType(dto.periodType),
    startDate: new Date(dto.startDateIso),
    endDate: new Date(dto.endDateIso),
    status: assertPeriodStatus(dto.status),
    closedAt: dto.closedAtIso ? new Date(dto.closedAtIso) : undefined,
    closedBy: dto.closedBy ?? undefined,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapPeriodVersionInputToDto(
  periodId: string,
  version: number,
  actor: string,
): { periodId: string; version: number; actor: string } {
  return { periodId, version, actor }
}
