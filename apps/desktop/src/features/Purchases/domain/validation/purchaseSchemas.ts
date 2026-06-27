import { z } from 'zod'
import { FUEL_PRODUCT_CODES } from '@fuelms/shared'
import { PURCHASE_PAYMENT_STATUSES } from '../valueObjects/PurchasePaymentStatus'
import { PURCHASE_STATUSES } from '../valueObjects/PurchaseStatus'

const optionalText = (max: number) => z.string().trim().max(max).optional()

/** Structural validation for UI/application commands — not authoritative over domain rules. */
export const recordFuelPurchaseInputSchema = z.object({
  productCode: z.enum(FUEL_PRODUCT_CODES),
  quantityLitres: z
    .number({ error: 'Quantity is required.' })
    .positive('Quantity must be greater than zero.'),
  unitCostRupees: z
    .number({ error: 'Purchase rate is required.' })
    .positive('Purchase rate must be greater than zero.'),
  purchaseDateIso: z
    .string({ error: 'Purchase date is required.' })
    .min(1, 'Purchase date is required.'),
  supplierPartnerId: z.string().trim().min(1).optional(),
  paymentStatus: z.enum(PURCHASE_PAYMENT_STATUSES),
  invoiceReference: optionalText(200),
  notes: optionalText(1000),
  postImmediately: z.boolean(),
})

export type RecordFuelPurchaseInput = z.infer<typeof recordFuelPurchaseInputSchema>

export const fuelPurchaseListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(PURCHASE_STATUSES).optional(),
})

export type FuelPurchaseListQuery = z.infer<typeof fuelPurchaseListQuerySchema>

export const purchaseVersionInputSchema = z.object({
  purchaseId: z.string().min(1, 'Purchase id is required.'),
  version: z.number().int().positive(),
})

export type PurchaseVersionInput = z.infer<typeof purchaseVersionInputSchema>
