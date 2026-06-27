import {
  organizationRepository,
  organizationRepositoryRuntime,
  workspaceRepository,
} from '../infrastructure/organizationRepositories'
import {
  ActivateOrganizationService,
  ArchiveOrganizationService,
  CreateOrganizationService,
  InitializeWorkspaceService,
  ResolveWorkspaceService,
  UpdateOrganizationService,
} from './services/OrganizationServices'

export const createOrganizationService = new CreateOrganizationService(organizationRepository)
export const updateOrganizationService = new UpdateOrganizationService(organizationRepository)
export const activateOrganizationService = new ActivateOrganizationService(organizationRepository)
export const archiveOrganizationService = new ArchiveOrganizationService(organizationRepository)
export const resolveWorkspaceService = new ResolveWorkspaceService(workspaceRepository)
export const initializeWorkspaceService = new InitializeWorkspaceService(workspaceRepository)

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  snapshot: ['workspace', 'snapshot'] as const,
}

export { organizationRepositoryRuntime }
