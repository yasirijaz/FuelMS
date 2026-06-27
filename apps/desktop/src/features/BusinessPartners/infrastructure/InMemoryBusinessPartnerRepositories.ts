import { ok, err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ConflictError, NotFoundError as NotFound } from '@fuelms/core'
import { InMemoryRepository } from '@fuelms/testing'
import {
  BusinessPartner,
  BusinessPartnerId,
  DisplayName,
  isPartnerRoleCode,
  mapBusinessPartnerToDto,
} from '../domain'
import type {
  AssignPartnerRoleInputDto,
  CreateBusinessPartnerInputDto,
  PartnerVersionInputDto,
  RemovePartnerRoleInputDto,
  UpdateBusinessPartnerInputDto,
} from '../domain/dtos/BusinessPartnerDtos'
import type { IBusinessPartnerRepository } from '../domain/repositories/IBusinessPartnerRepository'
import type { BusinessPartnerListQuery } from '../domain/validation/businessPartnerSchemas'
import type { PartnerRoleCode } from '../domain/valueObjects/PartnerRoleCode'

function trimOrNull(value: string | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function matchesSearch(partner: BusinessPartner, search: string): boolean {
  const term = search.trim().toLowerCase()
  if (term.length === 0) return true

  const haystack = [
    partner.displayName.value,
    partner.phone ?? '',
    partner.taxId ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(term)
}

export class InMemoryBusinessPartnerRepository
  extends InMemoryRepository<BusinessPartner, BusinessPartnerId>
  implements IBusinessPartnerRepository
{
  protected readonly entityType = 'BusinessPartner'

  async list(query: BusinessPartnerListQuery): Promise<Result<BusinessPartner[], AppError>> {
    let partners = this.all()

    if (query.activeOnly) {
      partners = partners.filter((partner) => partner.isActive)
    }

    if (query.roleCode) {
      partners = partners.filter((partner) => partner.hasRole(query.roleCode!))
    }

    if (query.search) {
      partners = partners.filter((partner) => matchesSearch(partner, query.search!))
    }

    partners.sort((a, b) =>
      a.displayName.value.localeCompare(b.displayName.value, undefined, { sensitivity: 'base' }),
    )

    return ok(partners)
  }

  async create(input: CreateBusinessPartnerInputDto): Promise<Result<BusinessPartner, AppError>> {
    const displayNameResult = DisplayName.create(input.displayName)
    if (!displayNameResult.ok) return displayNameResult

    if (input.roles.length === 0) {
      return err(
        new ConflictError(
          'PARTNER_ROLE_REQUIRED',
          'At least one role is required for a new partner.',
        ),
      )
    }

    const roles: PartnerRoleCode[] = []
    for (const role of input.roles) {
      if (!isPartnerRoleCode(role)) {
        return err(new ConflictError('INVALID_ROLE', `Invalid role: ${role}`))
      }
      roles.push(role)
    }

    const now = new Date()
    const id = BusinessPartnerId.fromPersisted(`bp-${crypto.randomUUID()}`)
    const partner = BusinessPartner.reconstitute({
      id,
      displayName: displayNameResult.value,
      legalName: trimOrNull(input.legalName),
      phone: trimOrNull(input.phone),
      email: trimOrNull(input.email),
      taxId: trimOrNull(input.taxId),
      address: trimOrNull(input.address),
      notes: trimOrNull(input.notes),
      isActive: true,
      roles: [...new Set(roles)].sort(),
      createdAt: now,
      updatedAt: now,
      version: 1,
    })

    await this.save(partner)
    return ok(partner)
  }

  async update(input: UpdateBusinessPartnerInputDto): Promise<Result<BusinessPartner, AppError>> {
    const existing = await this.findById(BusinessPartnerId.fromPersisted(input.id))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PARTNER_VERSION_CONFLICT',
          'Partner was modified by another process. Refresh and try again.',
        ),
      )
    }

    const displayNameResult = DisplayName.create(input.displayName)
    if (!displayNameResult.ok) return displayNameResult

    existing.value.applyDetails(displayNameResult.value, {
      legalName: trimOrNull(input.legalName),
      phone: trimOrNull(input.phone),
      email: trimOrNull(input.email),
      taxId: trimOrNull(input.taxId),
      address: trimOrNull(input.address),
      notes: trimOrNull(input.notes),
    })
    existing.value.bumpVersion()

    await this.save(existing.value)
    return ok(existing.value)
  }

  async activate(input: PartnerVersionInputDto): Promise<Result<BusinessPartner, AppError>> {
    const existing = await this.findById(BusinessPartnerId.fromPersisted(input.partnerId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PARTNER_VERSION_CONFLICT',
          'Partner was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (existing.value.roles.length === 0) {
      return err(
        new ConflictError(
          'PARTNER_ROLE_REQUIRED',
          'An active partner must have at least one role.',
        ),
      )
    }

    existing.value.setActive(true)
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  async deactivate(input: PartnerVersionInputDto): Promise<Result<BusinessPartner, AppError>> {
    const existing = await this.findById(BusinessPartnerId.fromPersisted(input.partnerId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PARTNER_VERSION_CONFLICT',
          'Partner was modified by another process. Refresh and try again.',
        ),
      )
    }

    existing.value.setActive(false)
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  async assignRole(input: AssignPartnerRoleInputDto): Promise<Result<BusinessPartner, AppError>> {
    if (!isPartnerRoleCode(input.roleCode)) {
      return err(new ConflictError('INVALID_ROLE', 'Invalid role code.'))
    }

    const existing = await this.findById(BusinessPartnerId.fromPersisted(input.partnerId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PARTNER_VERSION_CONFLICT',
          'Partner was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (existing.value.hasRole(input.roleCode)) {
      return err(
        new ConflictError('ROLE_ALREADY_ASSIGNED', 'This partner already has that role.'),
      )
    }

    existing.value.assignRole(input.roleCode)
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  async removeRole(input: RemovePartnerRoleInputDto): Promise<Result<BusinessPartner, AppError>> {
    if (!isPartnerRoleCode(input.roleCode)) {
      return err(new NotFound('PartnerRole', input.roleCode))
    }

    const existing = await this.findById(BusinessPartnerId.fromPersisted(input.partnerId))
    if (!existing.ok) return existing

    if (existing.value.version !== input.version) {
      return err(
        new ConflictError(
          'PARTNER_VERSION_CONFLICT',
          'Partner was modified by another process. Refresh and try again.',
        ),
      )
    }

    if (existing.value.isActive && existing.value.roles.length <= 1) {
      return err(
        new ConflictError(
          'LAST_ROLE',
          'Cannot remove the last role from an active partner.',
        ),
      )
    }

    if (!existing.value.hasRole(input.roleCode)) {
      return err(new NotFound('PartnerRole', input.roleCode))
    }

    existing.value.removeRole(input.roleCode)
    existing.value.bumpVersion()
    await this.save(existing.value)
    return ok(existing.value)
  }

  /** Test helper — expose DTO snapshot. */
  toDto(partner: BusinessPartner) {
    return mapBusinessPartnerToDto(partner)
  }
}
