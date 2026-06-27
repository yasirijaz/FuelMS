import { AggregateRoot } from '@fuelms/domain'
import type { FuelSaleId } from '../ids/FuelSaleId'
import { FuelSaleId as FuelSaleIdFactory } from '../ids/FuelSaleId'
import type { SalePaymentMethod } from '../valueObjects/SalePaymentMethod'
import type { SaleStatus } from '../valueObjects/SaleStatus'

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function computeTotalRevenueMinor(
  quantityMilliLitres: number,
  unitPriceMinorPerLitre: number,
): number {
  return Math.floor((quantityMilliLitres * unitPriceMinorPerLitre) / 1000)
}

/** Recorded fuel sale — draft, posted, or void. */
export class FuelSale extends AggregateRoot<FuelSaleId> {
  private _saleDate: Date
  private _productId: string
  private _productCode: string
  private _customerPartnerId: string | null
  private _customerName: string | null
  private _quantityMilliLitres: number
  private _unitPriceMinorPerLitre: number
  private _fuelPriceRecordId: string
  private _totalRevenueMinor: number
  private _totalCogsMinor: number
  private _paymentMethod: SalePaymentMethod
  private _reference: string | null
  private _notes: string | null
  private _status: SaleStatus
  private _recordedBy: string
  private _createdAt: Date
  private _updatedAt: Date
  private _version: number

  private constructor(
    id: FuelSaleId,
    props: {
      saleDate: Date
      productId: string
      productCode: string
      customerPartnerId: string | null
      customerName: string | null
      quantityMilliLitres: number
      unitPriceMinorPerLitre: number
      fuelPriceRecordId: string
      totalRevenueMinor: number
      totalCogsMinor: number
      paymentMethod: SalePaymentMethod
      reference: string | null
      notes: string | null
      status: SaleStatus
      recordedBy: string
      createdAt: Date
      updatedAt: Date
      version: number
    },
  ) {
    super(id)
    this._saleDate = props.saleDate
    this._productId = props.productId
    this._productCode = props.productCode
    this._customerPartnerId = props.customerPartnerId
    this._customerName = props.customerName
    this._quantityMilliLitres = props.quantityMilliLitres
    this._unitPriceMinorPerLitre = props.unitPriceMinorPerLitre
    this._fuelPriceRecordId = props.fuelPriceRecordId
    this._totalRevenueMinor = props.totalRevenueMinor
    this._totalCogsMinor = props.totalCogsMinor
    this._paymentMethod = props.paymentMethod
    this._reference = props.reference
    this._notes = props.notes
    this._status = props.status
    this._recordedBy = props.recordedBy
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._version = props.version
  }

  static reconstitute(props: {
    id: FuelSaleId
    saleDate: Date
    productId: string
    productCode: string
    customerPartnerId: string | null
    customerName: string | null
    quantityMilliLitres: number
    unitPriceMinorPerLitre: number
    fuelPriceRecordId: string
    totalRevenueMinor: number
    totalCogsMinor: number
    paymentMethod: SalePaymentMethod
    reference: string | null
    notes: string | null
    status: SaleStatus
    recordedBy: string
    createdAt: Date
    updatedAt: Date
    version: number
  }): FuelSale {
    return new FuelSale(props.id, props)
  }

  static createNewId(): FuelSaleId {
    return FuelSaleIdFactory.create()
  }

  get saleDate(): Date {
    return this._saleDate
  }

  get productId(): string {
    return this._productId
  }

  get productCode(): string {
    return this._productCode
  }

  get customerPartnerId(): string | null {
    return this._customerPartnerId
  }

  get customerName(): string | null {
    return this._customerName
  }

  get quantityMilliLitres(): number {
    return this._quantityMilliLitres
  }

  get unitPriceMinorPerLitre(): number {
    return this._unitPriceMinorPerLitre
  }

  get fuelPriceRecordId(): string {
    return this._fuelPriceRecordId
  }

  get totalRevenueMinor(): number {
    return this._totalRevenueMinor
  }

  get totalCogsMinor(): number {
    return this._totalCogsMinor
  }

  get paymentMethod(): SalePaymentMethod {
    return this._paymentMethod
  }

  get reference(): string | null {
    return this._reference
  }

  get notes(): string | null {
    return this._notes
  }

  get status(): SaleStatus {
    return this._status
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

  markPosted(totalCogsMinor: number): void {
    this._status = 'posted'
    this._totalCogsMinor = totalCogsMinor
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
    unitPriceMinorPerLitre: number,
  ): number {
    return computeTotalRevenueMinor(quantityMilliLitres, unitPriceMinorPerLitre)
  }

  static trimOptionalText(value: string | undefined): string | null {
    return trimOrNull(value)
  }
}
