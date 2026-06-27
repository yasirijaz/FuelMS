import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  backupQueryKeys,
  createBackupService,
  getBackupStoragePathService,
  listBackupAuditEventsService,
  listBackupsService,
  restoreBackupService,
  verifyBackupService,
  type CreateBackupInput,
  type RestoreBackupInput,
} from '../backupModule'
import {
  DEFAULT_AUDIT_LIST_QUERY,
  mapAuditEventToListItem,
  mapBackupToListItem,
} from '../types/BackupViewTypes'
import type { BackupAuditListQuery } from '../../domain'

export function useBackupList() {
  return useQuery({
    queryKey: backupQueryKeys.list(),
    queryFn: async () => {
      const result = await listBackupsService.execute()
      if (!result.ok) throw result.error
      return result.value.map(mapBackupToListItem)
    },
    staleTime: 15_000,
  })
}

export function useBackupStoragePath() {
  return useQuery({
    queryKey: backupQueryKeys.storagePath(),
    queryFn: async () => {
      const result = await getBackupStoragePathService.execute()
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 60_000,
  })
}

export function useBackupAuditEvents(query: BackupAuditListQuery = DEFAULT_AUDIT_LIST_QUERY) {
  return useQuery({
    queryKey: backupQueryKeys.auditEvents(query),
    queryFn: async () => {
      const result = await listBackupAuditEventsService.execute(query)
      if (!result.ok) throw result.error
      return result.value.map(mapAuditEventToListItem)
    },
    staleTime: 15_000,
  })
}

export function useCreateBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBackupInput) => {
      const result = await createBackupService.execute(input)
      if (!result.ok) throw result.error
      return mapBackupToListItem(result.value)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupQueryKeys.all })
    },
  })
}

export function useVerifyBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (backupId: string) => {
      const result = await verifyBackupService.execute(backupId)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupQueryKeys.all })
    },
  })
}

export function useRestoreBackup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RestoreBackupInput) => {
      const result = await restoreBackupService.execute(input)
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupQueryKeys.all })
    },
  })
}
