import {
  businessPartnerRepository,
  businessPartnerRepositoryRuntime,
} from '../infrastructure/businessPartnerRepositories'
import {
  ActivateBusinessPartnerService,
  AssignPartnerRoleService,
  CreateBusinessPartnerService,
  DeactivateBusinessPartnerService,
  GetBusinessPartnerService,
  ListBusinessPartnersService,
  RemovePartnerRoleService,
  UpdateBusinessPartnerService,
} from './services/BusinessPartnerServices'
import type { BusinessPartnerListQuery } from '../domain'

export const listBusinessPartnersService = new ListBusinessPartnersService(businessPartnerRepository)
export const getBusinessPartnerService = new GetBusinessPartnerService(businessPartnerRepository)
export const createBusinessPartnerService = new CreateBusinessPartnerService(businessPartnerRepository)
export const updateBusinessPartnerService = new UpdateBusinessPartnerService(businessPartnerRepository)
export const activateBusinessPartnerService = new ActivateBusinessPartnerService(
  businessPartnerRepository,
)
export const deactivateBusinessPartnerService = new DeactivateBusinessPartnerService(
  businessPartnerRepository,
)
export const assignPartnerRoleService = new AssignPartnerRoleService(businessPartnerRepository)
export const removePartnerRoleService = new RemovePartnerRoleService(businessPartnerRepository)

export const businessPartnerQueryKeys = {
  all: ['business-partners'] as const,
  lists: () => [...businessPartnerQueryKeys.all, 'list'] as const,
  list: (query: BusinessPartnerListQuery) => [...businessPartnerQueryKeys.lists(), query] as const,
  details: () => [...businessPartnerQueryKeys.all, 'detail'] as const,
  detail: (partnerId: string) => [...businessPartnerQueryKeys.details(), partnerId] as const,
}

export { businessPartnerRepositoryRuntime }
