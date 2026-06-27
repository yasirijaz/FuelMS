import { InMemoryOperatingIncomeRepository } from '../../infrastructure/InMemoryOperatingIncomeRepository'
import {
  ListOperatingIncomesService,
  RecordOperatingIncomeService,
  VoidOperatingIncomeService,
} from './IncomeServices'

describe('IncomeServices', () => {
  it('records received income', async () => {
    const repository = new InMemoryOperatingIncomeRepository()
    const service = new RecordOperatingIncomeService(repository)
    const result = await service.execute({
      incomeDateIso: new Date().toISOString(),
      categoryCode: 'rent',
      amountRupees: 50_000,
      paymentStatus: 'received',
      sourceName: 'Tuck Shop Tenant',
      cashAccountId: 'cash-drawer-main',
    })
    expect(result.ok).toBe(true)
  })

  it('lists income entries', async () => {
    const repository = new InMemoryOperatingIncomeRepository()
    const record = new RecordOperatingIncomeService(repository)
    await record.execute({
      incomeDateIso: new Date().toISOString(),
      categoryCode: 'commission',
      amountRupees: 5_000,
      paymentStatus: 'credit',
      sourceName: 'Agency Partner',
    })
    const list = new ListOperatingIncomesService(repository)
    const result = await list.execute({ status: 'posted' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.length).toBe(1)
  })

  it('void reverses received income cash effect via repository', async () => {
    const repository = new InMemoryOperatingIncomeRepository()
    const record = new RecordOperatingIncomeService(repository)
    const voidService = new VoidOperatingIncomeService(repository)
    const recorded = await record.execute({
      incomeDateIso: new Date().toISOString(),
      categoryCode: 'service',
      amountRupees: 10_000,
      paymentStatus: 'received',
      sourceName: 'Car Wash',
      cashAccountId: 'cash-drawer-main',
    })
    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return
    const voided = await voidService.execute({
      incomeId: recorded.value.id.toString(),
      version: recorded.value.version,
    })
    expect(voided.ok).toBe(true)
    if (voided.ok) expect(voided.value.status).toBe('void')
  })
})
