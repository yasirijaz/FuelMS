import { describe, expect, it, beforeEach } from 'vitest'
import { unwrap } from '@fuelms/core'
import { InMemoryFuelSaleRepository } from '../../infrastructure/InMemoryFuelSaleRepository'
import {
  PostSaleService,
  RecordSaleService,
  VoidSaleService,
} from './SaleServices'

describe('SaleServices', () => {
  let repository: InMemoryFuelSaleRepository
  let recordService: RecordSaleService
  let postService: PostSaleService
  let voidService: VoidSaleService

  const defaultPriceRecordId = 'price-diesel-active'

  beforeEach(() => {
    repository = new InMemoryFuelSaleRepository()
    recordService = new RecordSaleService(repository)
    postService = new PostSaleService(repository)
    voidService = new VoidSaleService(repository)
  })

  it('records a cash sale as draft', async () => {
    const sale = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 500,
        unitPriceRupees: 295,
        fuelPriceRecordId: defaultPriceRecordId,
        saleDateIso: '2026-06-20T00:00:00.000Z',
        paymentMethod: 'cash',
        postImmediately: false,
      }),
    )

    expect(sale.productCode).toBe('diesel')
    expect(sale.status).toBe('draft')
    expect(sale.quantityMilliLitres).toBe(500_000)
  })

  it('rejects credit sale without customer', async () => {
    const result = await recordService.execute({
      productCode: 'petrol',
      quantityLitres: 200,
      unitPriceRupees: 310,
      fuelPriceRecordId: 'price-petrol-active',
      saleDateIso: '2026-06-20T00:00:00.000Z',
      paymentMethod: 'credit',
      postImmediately: false,
    })

    expect(result.ok).toBe(false)
  })

  it('rejects zero quantity', async () => {
    const result = await recordService.execute({
      productCode: 'diesel',
      quantityLitres: 0,
      unitPriceRupees: 295,
      fuelPriceRecordId: defaultPriceRecordId,
      saleDateIso: '2026-06-20T00:00:00.000Z',
      paymentMethod: 'cash',
      postImmediately: false,
    })

    expect(result.ok).toBe(false)
  })

  it('posts a draft sale and consumes stock', async () => {
    const draft = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 1000,
        unitPriceRupees: 295,
        fuelPriceRecordId: defaultPriceRecordId,
        saleDateIso: '2026-06-20T00:00:00.000Z',
        paymentMethod: 'cash',
        postImmediately: false,
      }),
    )

    const posted = unwrap(
      await postService.execute({
        saleId: draft.id.toString(),
        version: draft.version,
      }),
    )

    expect(posted.status).toBe('posted')
    expect(posted.totalCogsMinor).toBeGreaterThan(0)

    const stock = unwrap(await repository.getAvailableStock('diesel'))
    expect(stock.availableMilliLitres).toBe(9_000_000)
  })

  it('rejects post when stock is insufficient', async () => {
    const draft = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 12_000,
        unitPriceRupees: 295,
        fuelPriceRecordId: defaultPriceRecordId,
        saleDateIso: '2026-06-20T00:00:00.000Z',
        paymentMethod: 'cash',
        postImmediately: false,
      }),
    )

    const result = await postService.execute({
      saleId: draft.id.toString(),
      version: draft.version,
    })

    expect(result.ok).toBe(false)
  })

  it('cannot post a sale that is already posted', async () => {
    const posted = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 500,
        unitPriceRupees: 295,
        fuelPriceRecordId: defaultPriceRecordId,
        saleDateIso: '2026-06-20T00:00:00.000Z',
        paymentMethod: 'cash',
        postImmediately: true,
      }),
    )

    const result = await postService.execute({
      saleId: posted.id.toString(),
      version: posted.version,
    })

    expect(result.ok).toBe(false)
  })

  it('voids a draft sale', async () => {
    const draft = unwrap(
      await recordService.execute({
        productCode: 'diesel',
        quantityLitres: 200,
        unitPriceRupees: 295,
        fuelPriceRecordId: defaultPriceRecordId,
        saleDateIso: '2026-06-20T00:00:00.000Z',
        paymentMethod: 'card',
        postImmediately: false,
      }),
    )

    const voided = unwrap(
      await voidService.execute({
        saleId: draft.id.toString(),
        version: draft.version,
      }),
    )

    expect(voided.status).toBe('void')
  })
})
