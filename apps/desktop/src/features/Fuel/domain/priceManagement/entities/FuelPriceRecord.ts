import { ok, err } from '@fuelms/core'
import type { Result } from '@fuelms/core'
import { DomainError } from '@fuelms/core'
import { AggregateRoot } from '@fuelms/domain'
import type { FuelPriceRecordId } from '../ids/FuelPriceRecordId'
import type { FuelProductId } from '../ids/FuelProductId'
import type { FuelPriceChangeBatchId } from '../ids/FuelPriceChangeBatchId'
import { FuelPriceRecordId as RecordIdFactory } from '../ids/FuelPriceRecordId'
import type { PricePerLitre } from '../valueObjects/PricePerLitre'
import type { EffectiveDateTime } from '../valueObjects/EffectiveDateTime'
import type { FuelPriceStatus } from '../valueObjects/FuelPriceStatus'
import type { FuelProductCode } from '../valueObjects/FuelProductCode'
import {
  canCancelPriceRecord,
  canModifyPriceRecord,
} from '../policies/FuelPriceImmutabilityPolicy'
import {
  FuelPriceChanged,
  FuturePriceScheduled,
  FuelPriceCancelled,
  PriceActivated,
} from '../events/FuelPriceEvents'

export interface RecordFuelPriceParams {
  productId: FuelProductId
  productCode: FuelProductCode
  pricePerLitre: PricePerLitre
  effectiveFrom: EffectiveDateTime
  recordedBy: string
  reason?: string
  reference?: string
  batchId?: FuelPriceChangeBatchId
  asOf?: Date
}

/**
 * FuelPriceRecord — aggregate root for a single selling price declaration.
 *
 * Business rules enforced here:
 * - Immediate prices activate now; future prices stay scheduled
 * - Scheduled prices can be cancelled before activation
 * - Active/superseded/locked records are immutable (spec A5)
 * - Supersession closes the previous active record without rewriting history
 */
export class FuelPriceRecord extends AggregateRoot<FuelPriceRecordId> {
  private _productId: FuelProductId
  private _productCode: FuelProductCode
  private _pricePerLitre: PricePerLitre
  private _effectiveFrom: EffectiveDateTime
  private _effectiveTo: EffectiveDateTime | null
  private _status: FuelPriceStatus
  private _reason: string | null
  private _reference: string | null
  private _recordedBy: string
  private _batchId: FuelPriceChangeBatchId | null
  private _supersededById: FuelPriceRecordId | null
  private _isLocked: boolean
  private _version: number

  private constructor(
    id: FuelPriceRecordId,
    props: {
      productId: FuelProductId
      productCode: FuelProductCode
      pricePerLitre: PricePerLitre
      effectiveFrom: EffectiveDateTime
      effectiveTo: EffectiveDateTime | null
      status: FuelPriceStatus
      reason: string | null
      reference: string | null
      recordedBy: string
      batchId: FuelPriceChangeBatchId | null
      supersededById: FuelPriceRecordId | null
      isLocked: boolean
      version: number
    },
  ) {
    super(id)
    this._productId = props.productId
    this._productCode = props.productCode
    this._pricePerLitre = props.pricePerLitre
    this._effectiveFrom = props.effectiveFrom
    this._effectiveTo = props.effectiveTo
    this._status = props.status
    this._reason = props.reason
    this._reference = props.reference
    this._recordedBy = props.recordedBy
    this._batchId = props.batchId
    this._supersededById = props.supersededById
    this._isLocked = props.isLocked
    this._version = props.version
  }

  /** Record a new price — scheduled if effectiveFrom is in the future, active otherwise. */
  static record(params: RecordFuelPriceParams): Result<FuelPriceRecord, DomainError> {
    const asOf = params.asOf ?? new Date()
    const isFuture = params.effectiveFrom.isInFuture(asOf)
    const status: FuelPriceStatus = isFuture ? 'scheduled' : 'active'

    const record = new FuelPriceRecord(RecordIdFactory.create(), {
      productId: params.productId,
      productCode: params.productCode,
      pricePerLitre: params.pricePerLitre,
      effectiveFrom: params.effectiveFrom,
      effectiveTo: null,
      status,
      reason: params.reason?.trim() || null,
      reference: params.reference?.trim() || null,
      recordedBy: params.recordedBy,
      batchId: params.batchId ?? null,
      supersededById: null,
      isLocked: false,
      version: 1,
    })

    if (isFuture) {
      record.raise(
        new FuturePriceScheduled(
          record.id.toString(),
          params.productCode,
          params.pricePerLitre.minorPerLitre,
          params.effectiveFrom.iso,
          params.batchId?.toString(),
        ),
      )
    } else {
      record.raise(
        new FuelPriceChanged(
          record.id.toString(),
          params.productCode,
          params.pricePerLitre.minorPerLitre,
          params.effectiveFrom.iso,
          params.batchId?.toString(),
        ),
      )
      record.raise(
        new PriceActivated(
          record.id.toString(),
          params.productCode,
          params.pricePerLitre.minorPerLitre,
          params.effectiveFrom.iso,
          null,
          params.batchId?.toString(),
        ),
      )
    }

    return ok(record)
  }

  /** Rehydrate from persistence — no domain events raised. */
  static restore(props: {
    id: FuelPriceRecordId
    productId: FuelProductId
    productCode: FuelProductCode
    pricePerLitre: PricePerLitre
    effectiveFrom: EffectiveDateTime
    effectiveTo: EffectiveDateTime | null
    status: FuelPriceStatus
    reason: string | null
    reference: string | null
    recordedBy: string
    batchId: FuelPriceChangeBatchId | null
    supersededById: FuelPriceRecordId | null
    isLocked: boolean
    version: number
  }): FuelPriceRecord {
    return new FuelPriceRecord(props.id, props)
  }

  /** Cancel a scheduled price before it becomes active. */
  cancel(): Result<void, DomainError> {
    if (!canCancelPriceRecord(this._status, this._isLocked)) {
      return err(
        new DomainError(
          'PRICE_NOT_CANCELLABLE',
          'Only scheduled prices that have not been used can be cancelled.',
        ),
      )
    }
    this._status = 'cancelled'
    this.raise(new FuelPriceCancelled(this.id.toString(), this._productCode))
    return ok(undefined)
  }

  /** Mark this active record as superseded when a newer price activates. */
  markSuperseded(by: FuelPriceRecordId, effectiveTo: EffectiveDateTime): Result<void, DomainError> {
    if (this._status !== 'active') {
      return err(
        new DomainError(
          'INVALID_SUPERSESSION',
          'Only active price records can be superseded.',
        ),
      )
    }
    this._status = 'superseded'
    this._effectiveTo = effectiveTo
    this._supersededById = by
    return ok(undefined)
  }

  /** Activate a scheduled price when effective_from is reached. */
  activate(asOf: Date = new Date()): Result<void, DomainError> {
    if (this._status !== 'scheduled') {
      return err(
        new DomainError('INVALID_ACTIVATION', 'Only scheduled prices can be activated.'),
      )
    }
    if (this._effectiveFrom.isInFuture(asOf)) {
      return err(
        new DomainError(
          'ACTIVATION_TOO_EARLY',
          'Scheduled price cannot activate before its effective date/time.',
        ),
      )
    }
    this._status = 'active'
    this.raise(
      new PriceActivated(
        this.id.toString(),
        this._productCode,
        this._pricePerLitre.minorPerLitre,
        this._effectiveFrom.iso,
        null,
      ),
    )
    return ok(undefined)
  }

  canModify(): boolean {
    return canModifyPriceRecord(this._status, this._isLocked)
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  get productId(): FuelProductId {
    return this._productId
  }
  get productCode(): FuelProductCode {
    return this._productCode
  }
  get pricePerLitre(): PricePerLitre {
    return this._pricePerLitre
  }
  get effectiveFrom(): EffectiveDateTime {
    return this._effectiveFrom
  }
  get effectiveTo(): EffectiveDateTime | null {
    return this._effectiveTo
  }
  get status(): FuelPriceStatus {
    return this._status
  }
  get reason(): string | null {
    return this._reason
  }
  get reference(): string | null {
    return this._reference
  }
  get recordedBy(): string {
    return this._recordedBy
  }
  get batchId(): FuelPriceChangeBatchId | null {
    return this._batchId
  }
  get supersededById(): FuelPriceRecordId | null {
    return this._supersededById
  }
  get isLocked(): boolean {
    return this._isLocked
  }
  get version(): number {
    return this._version
  }
}

/** Helper to chain record creation with validation results. */
export function recordFuelPriceFromValidated(
  params: Omit<RecordFuelPriceParams, 'pricePerLitre' | 'effectiveFrom'> & {
    priceResult: Result<PricePerLitre, import('@fuelms/core').ValidationError>
    effectiveFromResult: Result<EffectiveDateTime, import('@fuelms/core').ValidationError>
  },
): Result<FuelPriceRecord, DomainError | import('@fuelms/core').ValidationError> {
  if (!params.priceResult.ok) return params.priceResult
  if (!params.effectiveFromResult.ok) return params.effectiveFromResult
  return FuelPriceRecord.record({
    ...params,
    pricePerLitre: params.priceResult.value,
    effectiveFrom: params.effectiveFromResult.value,
  })
}
