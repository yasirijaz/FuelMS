import { env } from '@shared/lib/env'
import {
  InMemoryOrganizationRepository,
  InMemoryWorkspaceRepository,
} from './InMemoryOrganizationRepositories'
import {
  TauriOrganizationRepository,
  TauriWorkspaceRepository,
} from './TauriOrganizationRepositories'
import type {
  IOrganizationRepository,
  IWorkspaceRepository,
} from '../domain/repositories/IOrganizationRepository'

function createOrganizationRepositories(): {
  organizationRepository: IOrganizationRepository
  workspaceRepository: IWorkspaceRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      organizationRepository: new TauriOrganizationRepository(),
      workspaceRepository: new TauriWorkspaceRepository(),
      runtime: 'tauri',
    }
  }

  const organizationRepository = new InMemoryOrganizationRepository()
  return {
    organizationRepository,
    workspaceRepository: new InMemoryWorkspaceRepository(organizationRepository),
    runtime: 'browser',
  }
}

const repositories = createOrganizationRepositories()

export const organizationRepository = repositories.organizationRepository
export const workspaceRepository = repositories.workspaceRepository
export const organizationRepositoryRuntime = repositories.runtime
