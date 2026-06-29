import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateOrganizationInput, InitializeWorkspaceInput, UpdateOrganizationInput } from '../../domain'
import {
  activateOrganizationService,
  archiveOrganizationService,
  createOrganizationService,
  initializeWorkspaceService,
  organizationQueryKeys,
  resolveWorkspaceService,
  updateOrganizationService,
} from '../organizationModule'
import { useWorkspaceStore } from '@shared/stores/useWorkspaceStore'
import { invalidateOrganizationDataQueries } from '@shared/lib/invalidateOrganizationData'
import { mapWorkspaceSnapshotDtoToDomain } from '../../domain/mappers/organizationMappers'
import type { WorkspaceSnapshotDto } from '../../domain/dtos/OrganizationDtos'

function applySnapshotToStore(snapshot: WorkspaceSnapshotDto): void {
  const mapped = mapWorkspaceSnapshotDtoToDomain(snapshot)
  useWorkspaceStore.getState().setSnapshot(mapped)
}

export function useWorkspaceSnapshot() {
  return useQuery({
    queryKey: organizationQueryKeys.snapshot,
    queryFn: async () => {
      const result = await resolveWorkspaceService.execute()
      if (!result.ok) throw result.error
      useWorkspaceStore.getState().setSnapshot(result.value)
      return result.value
    },
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const result = await createOrganizationService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (snapshot) => {
      applySnapshotToStore(snapshot)
      invalidateOrganizationDataQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.snapshot })
    },
  })
}

export function useInitializeWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InitializeWorkspaceInput) => {
      const result = await initializeWorkspaceService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (snapshot) => {
      applySnapshotToStore(snapshot)
      invalidateOrganizationDataQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.snapshot })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      const result = await updateOrganizationService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.snapshot })
    },
  })
}

export function useActivateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await activateOrganizationService.execute(organizationId)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (snapshot) => {
      applySnapshotToStore(snapshot)
      invalidateOrganizationDataQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.snapshot })
    },
  })
}

export function useArchiveOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ organizationId, version }: { organizationId: string; version: number }) => {
      const result = await archiveOrganizationService.execute(organizationId, version)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (snapshot) => {
      applySnapshotToStore(snapshot)
      invalidateOrganizationDataQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.snapshot })
    },
  })
}
