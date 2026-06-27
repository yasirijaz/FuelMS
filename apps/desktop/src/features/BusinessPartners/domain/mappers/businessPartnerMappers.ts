import { DisplayName } from '../valueObjects/DisplayName'
import { BusinessPartnerId } from '../ids/BusinessPartnerId'
import { isPartnerRoleCode } from '../valueObjects/PartnerRoleCode'
import { BusinessPartner } from '../entities/BusinessPartner'
import type { BusinessPartnerDto } from '../dtos/BusinessPartnerDtos'

export function mapBusinessPartnerDtoToDomain(dto: BusinessPartnerDto): BusinessPartner {
  const displayNameResult = DisplayName.create(dto.displayName)
  if (!displayNameResult.ok) {
    throw new Error(`Invalid persisted partner display name: ${dto.displayName}`)
  }

  const roles = dto.roles.filter(isPartnerRoleCode)

  return BusinessPartner.reconstitute({
    id: BusinessPartnerId.fromPersisted(dto.id),
    displayName: displayNameResult.value,
    legalName: dto.legalName,
    phone: dto.phone,
    email: dto.email,
    taxId: dto.taxId,
    address: dto.address,
    notes: dto.notes,
    isActive: dto.isActive,
    roles,
    createdAt: new Date(dto.createdAtIso),
    updatedAt: new Date(dto.updatedAtIso),
    version: dto.version,
  })
}

export function mapBusinessPartnerToDto(partner: BusinessPartner): BusinessPartnerDto {
  return {
    id: partner.id.toString(),
    displayName: partner.displayName.value,
    legalName: partner.legalName,
    phone: partner.phone,
    email: partner.email,
    taxId: partner.taxId,
    address: partner.address,
    notes: partner.notes,
    isActive: partner.isActive,
    roles: [...partner.roles],
    createdAtIso: partner.createdAt.toISOString(),
    updatedAtIso: partner.updatedAt.toISOString(),
    version: partner.version,
  }
}
