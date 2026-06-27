import { describe, expect, it } from 'vitest'
import { useWorkspaceStore, shouldShowOrganizationSwitcher } from './useWorkspaceStore'
import { Organization } from '@features/Organization/domain/entities/Organization'
import { OrganizationName } from '@features/Organization/domain/valueObjects/OrganizationName'

describe('useWorkspaceStore helpers', () => {
  it('starts empty and can be cleared', () => {
    useWorkspaceStore.getState().clear()
    expect(useWorkspaceStore.getState().isHydrated).toBe(false)
    expect(useWorkspaceStore.getState().organizations).toEqual([])
  })

  it('shouldShowOrganizationSwitcher respects active count', () => {
    const makeOrg = (name: string) => {
      const nameResult = OrganizationName.create(name)
      if (!nameResult.ok) throw new Error('bad name')
      const created = Organization.create({ name: nameResult.value })
      if (!created.ok) throw new Error('bad org')
      return created.value
    }

    expect(shouldShowOrganizationSwitcher([makeOrg('One')])).toBe(false)
    expect(shouldShowOrganizationSwitcher([makeOrg('One'), makeOrg('Two')])).toBe(true)
  })
})
