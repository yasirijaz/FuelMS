import { rupeesToMinor } from '@fuelms/shared'
import { InMemoryCashRepository } from '../../infrastructure/InMemoryCashRepository'
import {
  ListCashAccountsService,
  RecordCashTransferService,
} from './CashServices'
import { CashAccountId } from '../../domain/entities/CashAccount'

describe('CashServices', () => {
  it('lists seeded accounts', async () => {
    const repository = new InMemoryCashRepository()
    const service = new ListCashAccountsService(repository)
    const result = await service.execute(true)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(3)
  })

  it('transfers cash between accounts', async () => {
    const repository = new InMemoryCashRepository()
    const listService = new ListCashAccountsService(repository)
    const transferService = new RecordCashTransferService(repository)

    const accounts = await listService.execute(true)
    expect(accounts.ok).toBe(true)
    if (!accounts.ok) return

    const drawer = accounts.value.find((account) => account.accountType === 'drawer')!
    const bank = accounts.value.find((account) => account.accountType === 'bank')!

    const transfer = await transferService.execute({
      fromAccountId: CashAccountId.toString(drawer.id),
      toAccountId: CashAccountId.toString(bank.id),
      amountRupees: 180_000,
      transferredAtIso: new Date().toISOString(),
      reference: 'Daily deposit',
    })
    expect(transfer.ok).toBe(true)

    const refreshed = await listService.execute(true)
    expect(refreshed.ok).toBe(true)
    if (!refreshed.ok) return

    const drawerAfter = refreshed.value.find(
      (account) => account.id === drawer.id,
    )!
    const bankAfter = refreshed.value.find((account) => account.id === bank.id)!

    expect(drawerAfter.balanceMinor).toBe(rupeesToMinor(20_000))
    expect(bankAfter.balanceMinor).toBe(rupeesToMinor(680_000))
  })

  it('rejects insufficient balance', async () => {
    const repository = new InMemoryCashRepository()
    const transferService = new RecordCashTransferService(repository)

    const result = await transferService.execute({
      fromAccountId: 'cash-safe-main',
      toAccountId: 'cash-bank-main',
      amountRupees: 100,
      transferredAtIso: new Date().toISOString(),
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INSUFFICIENT_BALANCE')
  })
})
