import { describe, expect, it, beforeEach } from 'vitest'
import { unwrap } from '@fuelms/core'
import { InMemoryFuelPurchaseRepository } from '../../infrastructure/InMemoryFuelPurchaseRepository'
import {
  PostPurchaseService,
  RecordPurchaseService,
  VoidPurchaseService,
} from './PurchaseServices'

describe('PurchaseServices', () => {
  let repository: InMemoryFuelPurchaseRepository
  let recordService: RecordPurchaseService
  let postService: PostPurchaseService
  let voidService: VoidPurchaseService

  beforeEach(() => {
    repository = new InMemoryFuelPurchaseRepository()
    recordService = new RecordPurchaseService(repository)
    postService = new PostPurchaseService(repository)
    voidService = new VoidPurchaseService(repository)
  })

  it('records a paid purchase as draft', async () => {
    const purchase = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 1500,
        unitCostRupees: 285.5,
        purchaseDateIso: '2026-06-20T00:00:00.000Z',
        paymentStatus: 'paid',
        postImmediately: false,
      }),
    )

    expect(purchase.productCode).toBe('diesel')
    expect(purchase.status).toBe('draft')
    expect(purchase.quantityMilliLitres).toBe(1_500_000)
  })

  it('rejects credit purchase without supplier', async () => {
    const result = await recordService.execute({
      productCode: 'petrol',
      quantityLitres: 500,
      unitCostRupees: 290,
      purchaseDateIso: '2026-06-20T00:00:00.000Z',
      paymentStatus: 'credit',
      postImmediately: false,
    })

    expect(result.ok).toBe(false)
  })

  it('rejects zero quantity', async () => {
    const result = await recordService.execute({
      productCode: 'diesel',
      quantityLitres: 0,
      unitCostRupees: 285,
      purchaseDateIso: '2026-06-20T00:00:00.000Z',
      paymentStatus: 'paid',
      postImmediately: false,
    })

    expect(result.ok).toBe(false)
  })

  it('posts a draft purchase', async () => {
    const draft = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 1000,
        unitCostRupees: 280,
        purchaseDateIso: '2026-06-20T00:00:00.000Z',
        paymentStatus: 'paid',
        postImmediately: false,
      }),
    )

    const posted = unwrap(
      await postService.execute({
        purchaseId: draft.id.toString(),
        version: draft.version,
      }),
    )

    expect(posted.status).toBe('posted')
    expect(posted.batchId).toBeTruthy()
  })

  it('cannot post a purchase that is already posted', async () => {
    const posted = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 1000,
        unitCostRupees: 280,
        purchaseDateIso: '2026-06-20T00:00:00.000Z',
        paymentStatus: 'paid',
        postImmediately: true,
      }),
    )

    const result = await postService.execute({
      purchaseId: posted.id.toString(),
      version: posted.version,
    })

    expect(result.ok).toBe(false)
  })

  it('voids a draft purchase', async () => {
    const draft = unwrap(
      await recordService.execute({
        productCode: 'hobc',
        quantityLitres: 200,
        unitCostRupees: 350,
        purchaseDateIso: '2026-06-20T00:00:00.000Z',
        paymentStatus: 'paid',
        postImmediately: false,
      }),
    )

    const voided = unwrap(
      await voidService.execute({
        purchaseId: draft.id.toString(),
        version: draft.version,
      }),
    )

    expect(voided.status).toBe('void')
  })
})
