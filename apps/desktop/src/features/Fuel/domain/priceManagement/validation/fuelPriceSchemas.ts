import { z } from 'zod'
import { FUEL_PRODUCT_CODES } from '../valueObjects/FuelProductCode'

/** Structural validation for UI/application commands — not authoritative over domain rules. */
export const recordFuelPriceInputSchema = z.object({
  productCode: z.enum(FUEL_PRODUCT_CODES),
  priceRupees: z
    .number({ error: 'Selling price is required.' })
    .positive('Selling price must be greater than zero.'),
  effectiveFromIso: z
    .string({ error: 'Effective date/time is required.' })
    .min(1, 'Effective date/time is required.'),
  reason: z.string().max(500).optional(),
  reference: z.string().max(200).optional(),
})

export type RecordFuelPriceInput = z.infer<typeof recordFuelPriceInputSchema>

export const recordBulkFuelPricesInputSchema = z.object({
  prices: z
    .array(recordFuelPriceInputSchema)
    .min(1, 'At least one product price is required.')
    .max(3),
  sharedEffectiveFromIso: z.string().min(1),
  reason: z.string().max(500).optional(),
  reference: z.string().max(200).optional(),
})

export type RecordBulkFuelPricesInput = z.infer<typeof recordBulkFuelPricesInputSchema>

export const priceHistoryFilterSchema = z.object({
  productCode: z.enum(FUEL_PRODUCT_CODES).optional(),
  fromIso: z.string().optional(),
  toIso: z.string().optional(),
  limit: z.number().int().positive().max(500).default(100),
})

export type PriceHistoryFilter = z.infer<typeof priceHistoryFilterSchema>
