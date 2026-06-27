import { rupeesToMinor } from '@fuelms/shared'
import { isPartnerRoleCode } from '@features/BusinessPartners/domain/valueObjects/PartnerRoleCode'
import type {
  PersonLedgerBalanceDto,
  PersonLedgerEntryDto,
  RecordPersonBorrowInputDto,
  RecordPersonCollectLoanInputDto,
  RecordPersonLendInputDto,
  RecordPersonRepayBorrowedInputDto,
} from '../dtos/PersonLedgerDtos'
import type { PersonLedgerBalance } from '../entities/PersonLedgerBalance'
import type { PersonLedgerEntry } from '../entities/PersonLedgerEntry'
import { PersonLedgerEntryId } from '../entities/PersonLedgerEntry'
import { isPersonLedgerEntryStatus } from '../valueObjects/PersonLedgerEntryStatus'
import { isPersonLedgerEntryType } from '../valueObjects/PersonLedgerEntryType'
import type { RecordPersonBorrowInput } from '../validation/personLedgerSchemas'

function assertEntryType(type: string) {
  if (!isPersonLedgerEntryType(type)) {
    throw new Error(`Invalid person ledger entry type: ${type}`)
  }
  return type
}

function assertEntryStatus(status: string) {
  if (!isPersonLedgerEntryStatus(status)) {
    throw new Error(`Invalid person ledger entry status: ${status}`)
  }
  return status
}

function mapRoles(roles: string[]): PersonLedgerBalance['roles'] {
  return roles.filter(isPartnerRoleCode)
}

export function mapPersonLedgerEntryDtoToDomain(dto: PersonLedgerEntryDto): PersonLedgerEntry {
  return {
    id: PersonLedgerEntryId.fromPersisted(dto.id),
    partnerId: dto.partnerId,
    partnerName: dto.partnerName,
    entryDate: new Date(dto.entryDateIso),
    entryType: assertEntryType(dto.entryType),
    signedAmountMinor: dto.signedAmountMinor,
    balanceAfterMinor: dto.balanceAfterMinor,
    cashAccountId: dto.cashAccountId ?? undefined,
    cashAccountName: dto.cashAccountName ?? undefined,
    sourceType: dto.sourceType,
    sourceId: dto.sourceId,
    reference: dto.reference ?? undefined,
    notes: dto.notes ?? undefined,
    status: assertEntryStatus(dto.status),
    recordedBy: dto.recordedBy,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapPersonLedgerBalanceDtoToDomain(dto: PersonLedgerBalanceDto): PersonLedgerBalance {
  return {
    partnerId: dto.partnerId,
    partnerName: dto.partnerName,
    roles: mapRoles(dto.roles),
    balanceMinor: dto.balanceMinor,
    entryCount: dto.entryCount,
    lastEntryDate: dto.lastEntryDateIso ? new Date(dto.lastEntryDateIso) : undefined,
  }
}

function mapRecordInputToDto(
  input: RecordPersonBorrowInput,
  recordedBy: string,
): RecordPersonBorrowInputDto {
  return {
    partnerId: input.partnerId,
    amountMinor: rupeesToMinor(input.amountRupees),
    entryDateIso: input.entryDateIso,
    cashAccountId: input.cashAccountId,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    recordedBy,
  }
}

export function mapRecordBorrowInputToDto(
  input: RecordPersonBorrowInput,
  recordedBy: string,
): RecordPersonBorrowInputDto {
  return mapRecordInputToDto(input, recordedBy)
}

export function mapRecordRepayBorrowedInputToDto(
  input: RecordPersonBorrowInput,
  recordedBy: string,
): RecordPersonRepayBorrowedInputDto {
  return mapRecordInputToDto(input, recordedBy)
}

export function mapRecordLendInputToDto(
  input: RecordPersonBorrowInput,
  recordedBy: string,
): RecordPersonLendInputDto {
  return mapRecordInputToDto(input, recordedBy)
}

export function mapRecordCollectLoanInputToDto(
  input: RecordPersonBorrowInput,
  recordedBy: string,
): RecordPersonCollectLoanInputDto {
  return mapRecordInputToDto(input, recordedBy)
}
