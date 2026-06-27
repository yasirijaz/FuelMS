import { isCashAccountType } from '../valueObjects/CashAccountType'
import type {
  CashAccountDto,
  CashTransferDto,
  CreateCashAccountInputDto,
  RecordCashTransferInputDto,
  UpdateCashAccountInputDto,
} from '../dtos/CashDtos'
import type { CashAccount, CashTransfer } from '../entities/CashAccount'
import { CashAccountId } from '../entities/CashAccount'
import type {
  CreateCashAccountInput,
  RecordCashTransferInput,
  UpdateCashAccountInput,
} from '../validation/cashSchemas'
import { rupeesToMinor } from '@fuelms/shared'

export function mapCashAccountDtoToDomain(dto: CashAccountDto): CashAccount {
  if (!isCashAccountType(dto.accountType)) {
    throw new Error(`Invalid cash account type: ${dto.accountType}`)
  }

  return {
    id: CashAccountId.fromPersisted(dto.id),
    name: dto.name,
    accountType: dto.accountType,
    balanceMinor: dto.balanceMinor,
    isActive: dto.isActive,
    displayOrder: dto.displayOrder,
    notes: dto.notes ?? undefined,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapCashTransferDtoToDomain(dto: CashTransferDto): CashTransfer {
  return {
    id: dto.id,
    fromAccountId: dto.fromAccountId,
    fromAccountName: dto.fromAccountName,
    toAccountId: dto.toAccountId,
    toAccountName: dto.toAccountName,
    amountMinor: dto.amountMinor,
    transferredAt: new Date(dto.transferredAtIso),
    reference: dto.reference ?? undefined,
    notes: dto.notes ?? undefined,
    recordedBy: dto.recordedBy,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  }
}

export function mapCreateAccountInputToDto(input: CreateCashAccountInput): CreateCashAccountInputDto {
  return {
    name: input.name.trim(),
    accountType: input.accountType,
    openingBalanceMinor:
      input.openingBalanceRupees != null ? rupeesToMinor(input.openingBalanceRupees) : undefined,
    displayOrder: input.displayOrder,
    notes: input.notes?.trim() || undefined,
  }
}

export function mapUpdateAccountInputToDto(input: UpdateCashAccountInput): UpdateCashAccountInputDto {
  return {
    id: input.id,
    name: input.name.trim(),
    displayOrder: input.displayOrder,
    notes: input.notes?.trim() || undefined,
    version: input.version,
  }
}

export function mapRecordTransferInputToDto(
  input: RecordCashTransferInput,
  recordedBy: string,
): RecordCashTransferInputDto {
  return {
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amountMinor: rupeesToMinor(input.amountRupees),
    transferredAtIso: input.transferredAtIso,
    reference: input.reference?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    recordedBy,
  }
}
