import { describe, it, expect, beforeEach } from 'vitest'
import { unwrap } from '@fuelms/core'
import { InMemoryBusinessPartnerRepository } from '../../infrastructure/InMemoryBusinessPartnerRepositories'
import {
  CreateBusinessPartnerService,
  RemovePartnerRoleService,
  ActivateBusinessPartnerService,
} from './BusinessPartnerServices'

describe('BusinessPartnerServices', () => {
  let repository: InMemoryBusinessPartnerRepository
  let createService: CreateBusinessPartnerService
  let removeRoleService: RemovePartnerRoleService
  let activateService: ActivateBusinessPartnerService

  beforeEach(() => {
    repository = new InMemoryBusinessPartnerRepository()
    createService = new CreateBusinessPartnerService(repository)
    removeRoleService = new RemovePartnerRoleService(repository)
    activateService = new ActivateBusinessPartnerService(repository)
  })

  it('creates a partner with at least one role', async () => {
    const partner = unwrap(
      await createService.execute({
        displayName: 'National Oil Co.',
        roles: ['supplier'],
      }),
    )

    expect(partner.displayName.value).toBe('National Oil Co.')
    expect(partner.roles).toEqual(['supplier'])
    expect(partner.isActive).toBe(true)
  })

  it('rejects create without roles', async () => {
    const result = await createService.execute({
      displayName: 'No Roles Ltd.',
      roles: [],
    })

    expect(result.ok).toBe(false)
  })

  it('cannot remove the last role from an active partner', async () => {
    const partner = unwrap(
      await createService.execute({
        displayName: 'Solo Role Co.',
        roles: ['customer'],
      }),
    )

    const result = await removeRoleService.execute({
      partnerId: partner.id.toString(),
      roleCode: 'customer',
      version: partner.version,
    })

    expect(result.ok).toBe(false)
  })

  it('requires at least one role before activation', async () => {
    const partner = unwrap(
      await createService.execute({
        displayName: 'Inactive Co.',
        roles: ['supplier'],
      }),
    )

    unwrap(
      await repository.deactivate({
        partnerId: partner.id.toString(),
        version: partner.version,
      }),
    )

    const deactivated = unwrap(await repository.findById(partner.id))
    unwrap(
      await removeRoleService.execute({
        partnerId: deactivated.id.toString(),
        roleCode: 'supplier',
        version: deactivated.version,
      }),
    )

    const roleless = unwrap(await repository.findById(partner.id))
    const activated = await activateService.execute({
      partnerId: roleless.id.toString(),
      version: roleless.version,
    })

    expect(activated.ok).toBe(false)
  })
})
