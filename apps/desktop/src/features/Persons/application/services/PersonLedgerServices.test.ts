import { InMemoryPersonLedgerRepository } from '../../infrastructure/InMemoryPersonLedgerRepository'
import {
  ListPersonLedgerBalancesService,
  ListPersonLedgerEntriesService,
  RecordPersonBorrowService,
} from './PersonLedgerServices'

describe('PersonLedgerServices', () => {
  it('lists balances', async () => {
    const repository = new InMemoryPersonLedgerRepository()
    const record = new RecordPersonBorrowService(repository)
    await record.execute({
      partnerId: 'bp-father',
      amountRupees: 10_000,
      entryDateIso: new Date().toISOString(),
      cashAccountId: 'cash-bank-main',
    })

    const list = new ListPersonLedgerBalancesService(repository)
    const result = await list.execute({ nonZeroOnly: true })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)
      expect(result.value[0]?.balanceMinor).toBe(-1_000_000)
    }
  })

  it('records borrow', async () => {
    const repository = new InMemoryPersonLedgerRepository()
    const service = new RecordPersonBorrowService(repository)
    const result = await service.execute({
      partnerId: 'bp-father',
      amountRupees: 5_000,
      entryDateIso: new Date().toISOString(),
      cashAccountId: 'cash-bank-main',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.entryType).toBe('borrow_from_person')
      expect(result.value.signedAmountMinor).toBe(-500_000)
    }
  })

  it('lists entries', async () => {
    const repository = new InMemoryPersonLedgerRepository()
    const record = new RecordPersonBorrowService(repository)
    await record.execute({
      partnerId: 'bp-father',
      amountRupees: 4_000,
      entryDateIso: new Date().toISOString(),
      cashAccountId: 'cash-bank-main',
    })

    const list = new ListPersonLedgerEntriesService(repository)
    const result = await list.execute({ partnerId: 'bp-father' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)
      expect(result.value[0]?.balanceAfterMinor).toBe(-400_000)
    }
  })
})
