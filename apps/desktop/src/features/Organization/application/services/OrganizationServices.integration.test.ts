import { describe, expect, it, beforeEach } from 'vitest'
import {
  ActivateOrganizationService,
  ArchiveOrganizationService,
  CreateOrganizationService,
  InitializeWorkspaceService,
  ResolveWorkspaceService,
} from '../services/OrganizationServices'
import {
  InMemoryOrganizationRepository,
  InMemoryWorkspaceRepository,
} from '../../infrastructure/InMemoryOrganizationRepositories'
import {
  shouldShowOrganizationSwitcher,
  selectActiveOrganizations,
} from '@shared/stores/useWorkspaceStore'

describe('Organization application services (integration)', () => {
  let organizationRepository: InMemoryOrganizationRepository
  let workspaceRepository: InMemoryWorkspaceRepository

  beforeEach(() => {
    organizationRepository = new InMemoryOrganizationRepository()
    workspaceRepository = new InMemoryWorkspaceRepository(organizationRepository)
  })

  it('auto-selects the first created organization', async () => {
    const service = new CreateOrganizationService(organizationRepository)
    const result = await service.execute({ name: 'First Pump' })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.activeOrganization?.name).toBe('First Pump')
  })

  it('activates a different organization in workspace', async () => {
    const createService = new CreateOrganizationService(organizationRepository)
    await createService.execute({ name: 'Pump A' })
    await createService.execute({ name: 'Pump B' })

    const orgB = organizationRepository
      .all()
      .find((org) => org.name.value === 'Pump B')
    expect(orgB).toBeDefined()
    if (!orgB) return

    const activateService = new ActivateOrganizationService(organizationRepository)
    const activated = await activateService.execute(orgB.id.toString())

    expect(activated.ok).toBe(true)
    if (!activated.ok) return
    expect(activated.value.activeOrganization?.name).toBe('Pump B')
  })

  it('reassigns active organization when current one is archived', async () => {
    const createService = new CreateOrganizationService(organizationRepository)
    await createService.execute({ name: 'Pump A' })
    await createService.execute({ name: 'Pump B' })

    const pumpA = organizationRepository.all().find((org) => org.name.value === 'Pump A')
    expect(pumpA).toBeDefined()
    if (!pumpA) return

    const archiveService = new ArchiveOrganizationService(organizationRepository)
    const archived = await archiveService.execute(pumpA.id.toString(), pumpA.version)

    expect(archived.ok).toBe(true)
    if (!archived.ok) return
    expect(archived.value.activeOrganization?.name).toBe('Pump B')
  })

  it('initializes workspace on first login', async () => {
    const service = new InitializeWorkspaceService(workspaceRepository)
    const result = await service.execute({
      workspaceName: 'Star Petroleum',
      name: 'Star Petroleum',
      city: 'Lahore',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.workspace.name).toBe('Star Petroleum')
    expect(result.value.activeOrganization?.name).toBe('Star Petroleum')
    expect(result.value.organizations).toHaveLength(1)
  })

  it('resolve workspace selects sole active organization', async () => {
    const createService = new CreateOrganizationService(organizationRepository)
    await createService.execute({ name: 'Only Pump' })

    organizationRepository.activeOrganizationId = null

    const resolveService = new ResolveWorkspaceService(workspaceRepository)
    const resolved = await resolveService.execute()

    expect(resolved.ok).toBe(true)
    if (!resolved.ok) return
    expect(resolved.value.activeOrganization?.name.value).toBe('Only Pump')
  })
})

describe('organization switcher visibility', () => {
  it('hides switcher for zero or one active organization', async () => {
    const repo = new InMemoryOrganizationRepository()
    expect(shouldShowOrganizationSwitcher([])).toBe(false)

    await repo.create({ name: 'Single Pump' })
    expect(shouldShowOrganizationSwitcher(repo.all())).toBe(false)
  })

  it('shows switcher when multiple active organizations exist', async () => {
    const repo = new InMemoryOrganizationRepository()
    await repo.create({ name: 'Pump A' })
    await repo.create({ name: 'Pump B' })

    const active = selectActiveOrganizations(repo.all())
    expect(active).toHaveLength(2)
    expect(shouldShowOrganizationSwitcher(repo.all())).toBe(true)
  })
})
