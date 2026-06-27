import { InMemoryTankRepository } from '../../infrastructure/InMemoryTankRepository'
import {
  CreateTankService,
  ListTanksService,
  RecordTankDipService,
} from './TankServices'
import { FuelTankId } from '../../domain/entities/FuelTank'

describe('TankServices', () => {
  it('lists seeded tanks', async () => {
    const repository = new InMemoryTankRepository()
    const service = new ListTanksService(repository)
    const result = await service.execute(true)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(3)
  })

  it('creates a tank', async () => {
    const repository = new InMemoryTankRepository()
    const service = new CreateTankService(repository)
    const result = await service.execute({
      name: 'Spare Diesel',
      productCode: 'diesel',
      capacityLitres: 15000,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.name).toBe('Spare Diesel')
  })

  it('records dip without changing book stock semantics in repository', async () => {
    const repository = new InMemoryTankRepository()
    const listService = new ListTanksService(repository)
    const dipService = new RecordTankDipService(repository)

    const tanks = await listService.execute(true)
    expect(tanks.ok).toBe(true)
    if (!tanks.ok) return

    const tank = tanks.value[0]!
    const bookBefore = tank.bookMilliLitres

    const dip = await dipService.execute({
      tankId: FuelTankId.toString(tank.id),
      readingAtIso: new Date().toISOString(),
      quantityLitres: 1000,
    })
    expect(dip.ok).toBe(true)

    const refreshed = await listService.execute(true)
    expect(refreshed.ok).toBe(true)
    if (!refreshed.ok) return

    const updated = refreshed.value.find((row) => row.id === tank.id)!
    expect(updated.bookMilliLitres).toBe(bookBefore)
    expect(updated.lastDipMilliLitres).toBe(1_000_000)
    expect(updated.varianceMilliLitres).toBe(1_000_000 - bookBefore)
  })
})
