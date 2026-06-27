import { z } from 'zod'
import { FUEL_PRODUCT_CODES } from '@fuelms/shared'
import { SALE_PAYMENT_METHODS } from '../valueObjects/SalePaymentMethod'
import { SALE_STATUSES } from '../valueObjects/SaleStatus'

const optionalText = (max: number) => z.string().trim().max(max).optional()

/** Structural validation for UI/application commands — not authoritative over domain rules. */
export const recordFuelSaleInputSchema = z.object({
  productCode: z.enum(FUEL_PRODUCT_CODES),
  quantityLitres: z
    .number({ error: 'Quantity is required.' })
    .positive('Quantity must be greater than zero.'),
  unitPriceRupees: z
    .number({ error: 'Selling price is required.' })
    .positive('Selling price must be greater than zero.'),
  fuelPriceRecordId: z
    .string({ error: 'Active fuel price is required.' })
    .min(1, 'Active fuel price is required.'),
  saleDateIso: z
    .string({ error: 'Sale date is required.' })
    .min(1, 'Sale date is required.'),
  customerPartnerId: z.string().trim().min(1).optional(),
  paymentMethod: z.enum(SALE_PAYMENT_METHODS),
  reference: optionalText(200),
  notes: optionalText(1000),
  postImmediately: z.boolean(),
})

export type RecordFuelSaleInput = z.infer<typeof recordFuelSaleInputSchema>

export const fuelSaleListQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    status: z.enum(SALE_STATUSES).optional(),
    fromDateIso: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be YYYY-MM-DD.')
      .optional(),
    toDateIso: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be YYYY-MM-DD.')
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.fromDateIso || !data.toDateIso) return true
      return data.fromDateIso <= data.toDateIso
    },
    { message: 'From date must be on or before to date.' },
  )

export type FuelSaleListQuery = z.infer<typeof fuelSaleListQuerySchema>

export const saleVersionInputSchema = z.object({
  saleId: z.string().min(1, 'Sale id is required.'),
  version: z.number().int().positive(),
})

export type SaleVersionInput = z.infer<typeof saleVersionInputSchema>
