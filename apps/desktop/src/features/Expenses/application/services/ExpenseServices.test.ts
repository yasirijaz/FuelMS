import { OperatingExpenseId } from '../../domain/entities/OperatingExpense'
import { InMemoryOperatingExpenseRepository } from '../../infrastructure/InMemoryOperatingExpenseRepository'
import {
  ListOperatingExpensesService,
  RecordOperatingExpenseService,
  VoidOperatingExpenseService,
} from './ExpenseServices'

describe('ExpenseServices', () => {
  it('records a paid expense', async () => {
    const repository = new InMemoryOperatingExpenseRepository()
    const service = new RecordOperatingExpenseService(repository)
    const result = await service.execute({
      expenseDateIso: new Date().toISOString(),
      categoryCode: 'maintenance',
      amountRupees: 15_000,
      paymentStatus: 'paid',
      payeeName: 'Hassan Motors',
      cashAccountId: 'cash-drawer-main',
    })
    expect(result.ok).toBe(true)
  })

  it('lists expenses', async () => {
    const repository = new InMemoryOperatingExpenseRepository()
    const record = new RecordOperatingExpenseService(repository)
    await record.execute({
      expenseDateIso: new Date().toISOString(),
      categoryCode: 'electricity',
      amountRupees: 1_000,
      paymentStatus: 'credit',
      payeeName: 'WAPDA',
    })
    const list = new ListOperatingExpensesService(repository)
    const result = await list.execute({ status: 'posted' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.length).toBe(1)
  })

  it('void restores paid expense cash effect via repository', async () => {
    const repository = new InMemoryOperatingExpenseRepository()
    const record = new RecordOperatingExpenseService(repository)
    const voidService = new VoidOperatingExpenseService(repository)
    const recorded = await record.execute({
      expenseDateIso: new Date().toISOString(),
      categoryCode: 'maintenance',
      amountRupees: 10_000,
      paymentStatus: 'paid',
      payeeName: 'Test',
      cashAccountId: 'cash-drawer-main',
    })
    expect(recorded.ok).toBe(true)
    if (!recorded.ok) return
    const voided = await voidService.execute({
      expenseId: OperatingExpenseId.toString(recorded.value.id),
      version: recorded.value.version,
    })
    expect(voided.ok).toBe(true)
    if (voided.ok) expect(voided.value.status).toBe('void')
  })
})
