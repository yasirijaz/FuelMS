import { env } from '@shared/lib/env'
import { InMemoryBusinessPartnerRepository } from './InMemoryBusinessPartnerRepositories'
import { TauriBusinessPartnerRepository } from './TauriBusinessPartnerRepositories'
import type { IBusinessPartnerRepository } from '../domain/repositories/IBusinessPartnerRepository'

function createBusinessPartnerRepositories(): {
  businessPartnerRepository: IBusinessPartnerRepository
  runtime: 'tauri' | 'browser'
} {
  if (env.IS_TAURI) {
    return {
      businessPartnerRepository: new TauriBusinessPartnerRepository(),
      runtime: 'tauri',
    }
  }

  return {
    businessPartnerRepository: new InMemoryBusinessPartnerRepository(),
    runtime: 'browser',
  }
}

const repositories = createBusinessPartnerRepositories()

export const businessPartnerRepository = repositories.businessPartnerRepository
export const businessPartnerRepositoryRuntime = repositories.runtime
