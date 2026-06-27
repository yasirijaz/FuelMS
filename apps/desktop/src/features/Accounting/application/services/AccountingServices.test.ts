import { AccountingPeriodId } from '../../domain/entities/AccountingPeriod'
import { LedgerAccountId } from '../../domain/entities/LedgerAccount'
import { InMemoryAccountingRepository } from '../../infrastructure/InMemoryAccountingRepository'
import {
  CloseAccountingPeriodService,
  GetCurrentAccountingPeriodService,
  ListJournalEntriesService,
  ListLedgerAccountsService,
} from './AccountingServices'

describe('AccountingServices', () => {
  it('lists ledger accounts', async () => {
    const repository = new InMemoryAccountingRepository()
    const service = new ListLedgerAccountsService(repository)
    const result = await service.execute(true)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.length).toBeGreaterThan(0)
    expect(
      result.value.some((account) => LedgerAccountId.toString(account.id) === 'la-cash-drawer'),
    ).toBe(true)
    expect(
      result.value.some((account) => LedgerAccountId.toString(account.id) === 'la-fuel-sales'),
    ).toBe(true)
  })

  it('lists journals empty when no sample journal seeded', async () => {
    const repository = new InMemoryAccountingRepository({ includeSampleJournal: false })
    const service = new ListJournalEntriesService(repository)
    const result = await service.execute({})
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(0)
  })

  it('closes the current accounting period', async () => {
    const repository = new InMemoryAccountingRepository({ includeSampleJournal: false })
    const getCurrent = new GetCurrentAccountingPeriodService(repository)
    const closePeriod = new CloseAccountingPeriodService(repository)

    const current = await getCurrent.execute()
    expect(current.ok).toBe(true)
    if (!current.ok) return

    const closed = await closePeriod.execute({
      periodId: AccountingPeriodId.toString(current.value.id),
      version: current.value.version,
    })
    expect(closed.ok).toBe(true)
    if (!closed.ok) return
    expect(closed.value.status).toBe('closed')
  })
})
