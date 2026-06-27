import { describe, expect, it } from 'vitest'
import { Organization } from './entities/Organization'
import { OrganizationName } from './valueObjects/OrganizationName'
import { OrganizationId } from './ids/OrganizationId'
import { needsFirstTimeSetup } from './workspaceSetup'

function org(name: string): Organization {
  const nameResult = OrganizationName.create(name)
  if (!nameResult.ok) throw new Error('Invalid test organization name')

  return Organization.reconstitute({
    id: OrganizationId.fromPersisted(`org-${name}`),
    name: nameResult.value,
    legalName: null,
    address: null,
    city: null,
    phone: null,
    taxId: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  })
}

describe('needsFirstTimeSetup', () => {
  it('returns true when there are no active organizations', () => {
    expect(
      needsFirstTimeSetup({
        organizations: [],
        activeOrganization: null,
      }),
    ).toBe(true)
  })

  it('returns false when an active organization is selected', () => {
    const active = org('Pump One')
    expect(
      needsFirstTimeSetup({
        organizations: [active],
        activeOrganization: active,
      }),
    ).toBe(false)
  })
})
