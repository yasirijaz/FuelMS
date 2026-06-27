import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateFuelTankInput,
  RecordTankDipInput,
  TankVersionInput,
  UpdateFuelTankInput,
} from '../../domain'
import {
  createTankService,
  listTankDipsService,
  listTanksService,
  recordTankDipService,
  tankQueryKeys,
  updateTankService,
} from '../tankModule'
import { mapDipToListItem, mapTankToListItem } from '../mappers/tankViewMappers'

function invalidateTankQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tankId?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: tankQueryKeys.all })
  if (tankId) {
    void queryClient.invalidateQueries({ queryKey: tankQueryKeys.detail(tankId) })
    void queryClient.invalidateQueries({ queryKey: tankQueryKeys.dips(tankId) })
  }
}

export function useTankList(activeOnly = true) {
  return useQuery({
    queryKey: tankQueryKeys.list(activeOnly),
    queryFn: async () => {
      const result = await listTanksService.execute(activeOnly)
      if (!result.ok) throw result.error
      return result.value.map(mapTankToListItem)
    },
    staleTime: 30_000,
  })
}

export function useTankDips(tankId: string | null, limit = 20) {
  return useQuery({
    queryKey: tankQueryKeys.dips(tankId ?? ''),
    enabled: Boolean(tankId),
    queryFn: async () => {
      const result = await listTankDipsService.execute(tankId!, limit)
      if (!result.ok) throw result.error
      return result.value.map(mapDipToListItem)
    },
  })
}

export function useCreateTank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFuelTankInput) => {
      const result = await createTankService.execute(input)
      if (!result.ok) throw result.error
      return mapTankToListItem(result.value)
    },
    onSuccess: () => {
      invalidateTankQueries(queryClient)
    },
  })
}

export function useUpdateTank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateFuelTankInput) => {
      const result = await updateTankService.execute(input)
      if (!result.ok) throw result.error
      return mapTankToListItem(result.value)
    },
    onSuccess: (tank) => {
      invalidateTankQueries(queryClient, tank.id)
    },
  })
}

export function useRecordTankDip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordTankDipInput) => {
      const result = await recordTankDipService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (_dip, input) => {
      invalidateTankQueries(queryClient, input.tankId)
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useTankVersionAction() {
  const queryClient = useQueryClient()

  return {
    invalidate: (tankId?: string) => invalidateTankQueries(queryClient, tankId),
  }
}

export type { TankVersionInput }
