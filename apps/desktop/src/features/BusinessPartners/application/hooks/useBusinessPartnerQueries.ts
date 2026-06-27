import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AssignPartnerRoleInput,
  BusinessPartnerListQuery,
  CreateBusinessPartnerInput,
  PartnerVersionInput,
  RemovePartnerRoleInput,
  UpdateBusinessPartnerInput,
} from '../../domain'
import {
  activateBusinessPartnerService,
  assignPartnerRoleService,
  businessPartnerQueryKeys,
  createBusinessPartnerService,
  deactivateBusinessPartnerService,
  getBusinessPartnerService,
  listBusinessPartnersService,
  removePartnerRoleService,
  updateBusinessPartnerService,
} from '../businessPartnerModule'

function invalidatePartnerQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  partnerId?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: businessPartnerQueryKeys.all })
  if (partnerId) {
    void queryClient.invalidateQueries({
      queryKey: businessPartnerQueryKeys.detail(partnerId),
    })
  }
}

export function useBusinessPartnerList(query: BusinessPartnerListQuery = {}) {
  return useQuery({
    queryKey: businessPartnerQueryKeys.list(query),
    queryFn: async () => {
      const result = await listBusinessPartnersService.execute(query)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useBusinessPartner(partnerId: string | null) {
  return useQuery({
    queryKey: businessPartnerQueryKeys.detail(partnerId ?? ''),
    enabled: Boolean(partnerId),
    queryFn: async () => {
      const result = await getBusinessPartnerService.execute(partnerId!)
      if (!result.ok) throw result.error
      return result.value
    },
  })
}

export function useCreateBusinessPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBusinessPartnerInput) => {
      const result = await createBusinessPartnerService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      invalidatePartnerQueries(queryClient)
    },
  })
}

export function useUpdateBusinessPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateBusinessPartnerInput) => {
      const result = await updateBusinessPartnerService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (partner) => {
      invalidatePartnerQueries(queryClient, partner.id.toString())
    },
  })
}

export function useActivateBusinessPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PartnerVersionInput) => {
      const result = await activateBusinessPartnerService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (partner) => {
      invalidatePartnerQueries(queryClient, partner.id.toString())
    },
  })
}

export function useDeactivateBusinessPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PartnerVersionInput) => {
      const result = await deactivateBusinessPartnerService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (partner) => {
      invalidatePartnerQueries(queryClient, partner.id.toString())
    },
  })
}

export function useAssignPartnerRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AssignPartnerRoleInput) => {
      const result = await assignPartnerRoleService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (partner) => {
      invalidatePartnerQueries(queryClient, partner.id.toString())
    },
  })
}

export function useRemovePartnerRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RemovePartnerRoleInput) => {
      const result = await removePartnerRoleService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (partner) => {
      invalidatePartnerQueries(queryClient, partner.id.toString())
    },
  })
}
