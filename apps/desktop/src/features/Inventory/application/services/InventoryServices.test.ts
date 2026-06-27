import { InMemoryInventoryRepository } from '../../infrastructure/InMemoryInventoryRepository'
import {
  ListInventoryBatchesService,
  ListInventoryMovementsService,
  ProductSummaryService,
} from './InventoryServices'

describe('InventoryServices', () => {
  const repository = new InMemoryInventoryRepository()
  const summaryService = new ProductSummaryService(repository)
  const batchesService = new ListInventoryBatchesService(repository)
  const movementsService = new ListInventoryMovementsService(repository)

  it('returns product summary for all fuel products', async () => {
    const result = await summaryService.execute()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(3)
    const diesel = result.value.find((item) => item.productCode === 'diesel')
    expect(diesel?.quantityMilliLitres).toBeGreaterThan(0)
  })

  it('lists active batches', async () => {
    const result = await batchesService.execute({ activeOnly: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.length).toBeGreaterThan(0)
    expect(result.value.every((batch) => batch.remainingMilliLitres > 0)).toBe(true)
  })

  it('lists stock movements', async () => {
    const result = await movementsService.execute({ limit: 10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.length).toBeGreaterThan(0)
  })
})
