import { InMemoryBackupRepository } from '../../infrastructure/InMemoryBackupRepository'
import {
  CreateBackupService,
  ListBackupAuditEventsService,
  RestoreBackupService,
} from './BackupServices'

describe('BackupServices', () => {
  it('list backups validation rejects invalid audit list limit', async () => {
    const repository = new InMemoryBackupRepository()
    const service = new ListBackupAuditEventsService(repository)
    const result = await service.execute({ limit: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('Limit must be a positive integer.')
    }
  })

  it('create backup requires desktop via in-memory stub', async () => {
    const repository = new InMemoryBackupRepository()
    const service = new CreateBackupService(repository)
    const result = await service.execute({ actor: 'owner' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('desktop app')
    }
  })

  it('restore input validation requires acknowledgeReplace', async () => {
    const repository = new InMemoryBackupRepository()
    const service = new RestoreBackupService(repository)
    const result = await service.execute({
      backupId: 'backup-20260627',
      actor: 'owner',
      acknowledgeReplace: false as unknown as true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toContain('acknowledge')
    }
  })
})
