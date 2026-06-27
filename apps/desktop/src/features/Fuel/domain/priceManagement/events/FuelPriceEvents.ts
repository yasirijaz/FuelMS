import { DomainEvent } from '@fuelms/domain'

export class FuelPriceChanged extends DomainEvent {
  readonly eventType = 'fuel.price.changed' as const
  readonly productCode: string
  readonly pricePerLitreMinor: number
  readonly effectiveFromIso: string

  constructor(
    aggregateId: string,
    productCode: string,
    pricePerLitreMinor: number,
    effectiveFromIso: string,
    correlationId?: string,
  ) {
    super(aggregateId, 'FuelPriceRecord', correlationId)
    this.productCode = productCode
    this.pricePerLitreMinor = pricePerLitreMinor
    this.effectiveFromIso = effectiveFromIso
  }
}

export class FuturePriceScheduled extends DomainEvent {
  readonly eventType = 'fuel.price.scheduled' as const
  readonly productCode: string
  readonly pricePerLitreMinor: number
  readonly effectiveFromIso: string

  constructor(
    aggregateId: string,
    productCode: string,
    pricePerLitreMinor: number,
    effectiveFromIso: string,
    correlationId?: string,
  ) {
    super(aggregateId, 'FuelPriceRecord', correlationId)
    this.productCode = productCode
    this.pricePerLitreMinor = pricePerLitreMinor
    this.effectiveFromIso = effectiveFromIso
  }
}

export class PriceActivated extends DomainEvent {
  readonly eventType = 'fuel.price.activated' as const
  readonly productCode: string
  readonly pricePerLitreMinor: number
  readonly effectiveFromIso: string
  readonly supersededRecordId: string | null

  constructor(
    aggregateId: string,
    productCode: string,
    pricePerLitreMinor: number,
    effectiveFromIso: string,
    supersededRecordId: string | null,
    correlationId?: string,
  ) {
    super(aggregateId, 'FuelPriceRecord', correlationId)
    this.productCode = productCode
    this.pricePerLitreMinor = pricePerLitreMinor
    this.effectiveFromIso = effectiveFromIso
    this.supersededRecordId = supersededRecordId
  }
}

export class FuelPriceCancelled extends DomainEvent {
  readonly eventType = 'fuel.price.cancelled' as const
  readonly productCode: string

  constructor(aggregateId: string, productCode: string, correlationId?: string) {
    super(aggregateId, 'FuelPriceRecord', correlationId)
    this.productCode = productCode
  }
}
