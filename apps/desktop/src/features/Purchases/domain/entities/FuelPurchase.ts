import { AggregateRoot } from '@fuelms/domain'
import type { FuelPurchaseId } from '../ids/FuelPurchaseId'
import { FuelPurchaseId as FuelPurchaseIdFactory } from '../ids/FuelPurchaseId'
import type { PurchasePaymentStatus } from '../valueObjects/PurchasePaymentStatus'
import type { PurchaseStatus } from '../valueObjects/PurchaseStatus'

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function computeTotalCostMinor(quantityMilliLitres: number, unitCostMinorPerLitre: number): number {
  return Math.floor((quantityMilliLitres * unitCostMinorPerLitre) / 1000)
}

/** Recorded fuel purchase — draft, posted, or void. */
export class FuelPurchase extends AggregateRoot<FuelPurchaseId> {
  private _purchaseDate: Date
  private _productId: string
  private _productCode: string
  private _supplierPartnerId: string | null
  private _supplierName: string | null
  private _quantityMilliLitres: number
  private _unitCostMinorPerLitre: number
  private _totalCostMinor: number
  private _invoiceReference: string | null
  private _paymentStatus: PurchasePaymentStatus
  private _notes: string | null
  private _status: PurchaseStatus
  private _batchId: string | null
  private _recordedBy: string
  private _createdAt: Date
  private _updatedAt: Date
  private _version: number

  private constructor(
    id: FuelPurchaseId,
    props: {
      purchaseDate: Date
      productId: string
      productCode: string
      supplierPartnerId: string | null
      supplierName: string | null
      quantityMilliLitres: number
      unitCostMinorPerLitre: number
      totalCostMinor: number
      invoiceReference: string | null
      paymentStatus: PurchasePaymentStatus
      notes: string | null
      status: PurchaseStatus
      batchId: string | null
      recordedBy: string
      createdAt: Date
      updatedAt: Date
      version: number
    },
  ) {
    super(id)
    this._purchaseDate = props.purchaseDate
    this._productId = props.productId
    this._productCode = props.productCode
    this._supplierPartnerId = props.supplierPartnerId
    this._supplierName = props.supplierName
    this._quantityMilliLitres = props.quantityMilliLitres
    this._unitCostMinorPerLitre = props.unitCostMinorPerLitre
    this._totalCostMinor = props.totalCostMinor
    this._invoiceReference = props.invoiceReference
    this._paymentStatus = props.paymentStatus
    this._notes = props.notes
    this._status = props.status
    this._batchId = props.batchId
    this._recordedBy = props.recordedBy
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._version = props.version
  }

  static reconstitute(props: {
    id: FuelPurchaseId
    purchaseDate: Date
    productId: string
    productCode: string
    supplierPartnerId: string | null
    supplierName: string | null
    quantityMilliLitres: number
    unitCostMinorPerLitre: number
    totalCostMinor: number
    invoiceReference: string | null
    paymentStatus: PurchasePaymentStatus
    notes: string | null
    status: PurchaseStatus
    batchId: string | null
    recordedBy: string
    createdAt: Date
    updatedAt: Date
    version: number
  }): FuelPurchase {
    return new FuelPurchase(props.id, props)
  }

  static createNewId(): FuelPurchaseId {
    return FuelPurchaseIdFactory.create()
  }

  get purchaseDate(): Date {
    return this._purchaseDate
  }

  get productId(): string {
    return this._productId
  }

  get productCode(): string {
    return this._productCode
  }

  get supplierPartnerId(): string | null {
    return this._supplierPartnerId
  }

  get supplierName(): string | null {
    return this._supplierName
  }

  get quantityMilliLitres(): number {
    return this._quantityMilliLitres
  }

  get unitCostMinorPerLitre(): number {
    return this._unitCostMinorPerLitre
  }

  get totalCostMinor(): number {
    return this._totalCostMinor
  }

  get invoiceReference(): string | null {
    return this._invoiceReference
  }

  get paymentStatus(): PurchasePaymentStatus {
    return this._paymentStatus
  }

  get notes(): string | null {
    return this._notes
  }

  get status(): PurchaseStatus {
    return this._status
  }

  get batchId(): string | null {
    return this._batchId
  }

  get recordedBy(): string {
    return this._recordedBy
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get version(): number {
    return this._version
  }

  isDraft(): boolean {
    return this._status === 'draft'
  }

  canPost(): boolean {
    return this._status === 'draft'
  }

  canVoid(): boolean {
    return this._status === 'draft'
  }

  markPosted(batchId?: string | null): void {
    this._status = 'posted'
    if (batchId !== undefined) {
      this._batchId = batchId
    }
    this._updatedAt = new Date()
  }

  markVoid(): void {
    this._status = 'void'
    this._updatedAt = new Date()
  }

  bumpVersion(): void {
    this._version += 1
  }

  setVersion(version: number): void {
    this._version = version
  }

  static computeTotal(
    quantityMilliLitres: number,
    unitCostMinorPerLitre: number,
  ): number {
    return computeTotalCostMinor(quantityMilliLitres, unitCostMinorPerLitre)
  }

  static trimOptionalText(value: string | undefined): string | null {
    return trimOrNull(value)
  }
}
