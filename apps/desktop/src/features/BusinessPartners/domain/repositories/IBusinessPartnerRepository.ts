import type { Result, AppError, NotFoundError } from '@fuelms/core'
import type { BusinessPartner } from '../entities/BusinessPartner'
import type { BusinessPartnerId } from '../ids/BusinessPartnerId'
import type {
  AssignPartnerRoleInputDto,
  CreateBusinessPartnerInputDto,
  PartnerVersionInputDto,
  RemovePartnerRoleInputDto,
  UpdateBusinessPartnerInputDto,
} from '../dtos/BusinessPartnerDtos'
import type { BusinessPartnerListQuery } from '../validation/businessPartnerSchemas'

export interface IBusinessPartnerRepository {
  list(query: BusinessPartnerListQuery): Promise<Result<BusinessPartner[], AppError>>
  findById(id: BusinessPartnerId): Promise<Result<BusinessPartner, NotFoundError>>
  create(input: CreateBusinessPartnerInputDto): Promise<Result<BusinessPartner, AppError>>
  update(input: UpdateBusinessPartnerInputDto): Promise<Result<BusinessPartner, AppError>>
  activate(input: PartnerVersionInputDto): Promise<Result<BusinessPartner, AppError>>
  deactivate(input: PartnerVersionInputDto): Promise<Result<BusinessPartner, AppError>>
  assignRole(input: AssignPartnerRoleInputDto): Promise<Result<BusinessPartner, AppError>>
  removeRole(input: RemovePartnerRoleInputDto): Promise<Result<BusinessPartner, AppError>>
}
