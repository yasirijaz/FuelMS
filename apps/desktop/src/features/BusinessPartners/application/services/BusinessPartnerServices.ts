import { err } from '@fuelms/core'
import type { Result, AppError } from '@fuelms/core'
import { ValidationError } from '@fuelms/core'
import {
  BusinessPartner,
  BusinessPartnerId,
  DisplayName,
  isPartnerRoleCode,
  type CreateBusinessPartnerInput,
  type UpdateBusinessPartnerInput,
  type BusinessPartnerListQuery,
  type PartnerVersionInput,
  type AssignPartnerRoleInput,
  type RemovePartnerRoleInput,
  createBusinessPartnerInputSchema,
  updateBusinessPartnerInputSchema,
  businessPartnerListQuerySchema,
  partnerVersionInputSchema,
  assignPartnerRoleInputSchema,
  removePartnerRoleInputSchema,
} from '../../domain'
import type { IBusinessPartnerRepository } from '../../domain/repositories/IBusinessPartnerRepository'

export class ListBusinessPartnersService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(query: BusinessPartnerListQuery = {}): Promise<Result<BusinessPartner[], AppError>> {
    const parsed = businessPartnerListQuerySchema.safeParse(query)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid list query.'))
    }

    return this.repository.list(parsed.data)
  }
}

export class GetBusinessPartnerService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(partnerId: string): Promise<Result<BusinessPartner, AppError>> {
    if (!partnerId.trim()) {
      return err(new ValidationError('Partner id is required.'))
    }

    return this.repository.findById(BusinessPartnerId.fromPersisted(partnerId))
  }
}

export class CreateBusinessPartnerService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(input: CreateBusinessPartnerInput): Promise<Result<BusinessPartner, AppError>> {
    const parsed = createBusinessPartnerInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid partner input.'))
    }

    const displayNameResult = DisplayName.create(parsed.data.displayName)
    if (!displayNameResult.ok) return displayNameResult

    if (parsed.data.roles.length === 0) {
      return err(
        new ValidationError('At least one role is required for a new partner.'),
      )
    }

    for (const role of parsed.data.roles) {
      if (!isPartnerRoleCode(role)) {
        return err(new ValidationError(`Invalid role: ${role}`))
      }
    }

    return this.repository.create({
      displayName: parsed.data.displayName,
      legalName: parsed.data.legalName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      taxId: parsed.data.taxId,
      address: parsed.data.address,
      notes: parsed.data.notes,
      roles: parsed.data.roles,
    })
  }
}

export class UpdateBusinessPartnerService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(input: UpdateBusinessPartnerInput): Promise<Result<BusinessPartner, AppError>> {
    const parsed = updateBusinessPartnerInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid partner input.'))
    }

    const displayNameResult = DisplayName.create(parsed.data.displayName)
    if (!displayNameResult.ok) return displayNameResult

    const existing = await this.repository.findById(
      BusinessPartnerId.fromPersisted(parsed.data.id),
    )
    if (!existing.ok) return existing

    return this.repository.update({
      id: parsed.data.id,
      displayName: parsed.data.displayName,
      legalName: parsed.data.legalName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      taxId: parsed.data.taxId,
      address: parsed.data.address,
      notes: parsed.data.notes,
      version: parsed.data.version,
    })
  }
}

export class ActivateBusinessPartnerService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(input: PartnerVersionInput): Promise<Result<BusinessPartner, AppError>> {
    const parsed = partnerVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid activation input.'))
    }

    const existing = await this.repository.findById(
      BusinessPartnerId.fromPersisted(parsed.data.partnerId),
    )
    if (!existing.ok) return existing

    if (!existing.value.canBeActivated()) {
      return err(
        new ValidationError('An active partner must have at least one role.'),
      )
    }

    const result = await this.repository.activate(parsed.data)
    return result
  }
}

export class DeactivateBusinessPartnerService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(input: PartnerVersionInput): Promise<Result<BusinessPartner, AppError>> {
    const parsed = partnerVersionInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid deactivation input.'))
    }

    return this.repository.deactivate(parsed.data)
  }
}

export class AssignPartnerRoleService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(input: AssignPartnerRoleInput): Promise<Result<BusinessPartner, AppError>> {
    const parsed = assignPartnerRoleInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid role assignment input.'))
    }

    if (!isPartnerRoleCode(parsed.data.roleCode)) {
      return err(new ValidationError('Invalid role code.'))
    }

    return this.repository.assignRole(parsed.data)
  }
}

export class RemovePartnerRoleService {
  constructor(private readonly repository: IBusinessPartnerRepository) {}

  async execute(input: RemovePartnerRoleInput): Promise<Result<BusinessPartner, AppError>> {
    const parsed = removePartnerRoleInputSchema.safeParse(input)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return err(new ValidationError(first?.message ?? 'Invalid role removal input.'))
    }

    const existing = await this.repository.findById(
      BusinessPartnerId.fromPersisted(parsed.data.partnerId),
    )
    if (!existing.ok) return existing

    if (!existing.value.canRemoveRole(parsed.data.roleCode)) {
      return err(
        new ValidationError('Cannot remove the last role from an active partner.'),
      )
    }

    return this.repository.removeRole(parsed.data)
  }
}
