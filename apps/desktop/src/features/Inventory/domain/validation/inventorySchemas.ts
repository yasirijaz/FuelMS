import { z } from 'zod'
import { FUEL_PRODUCT_CODES } from '@fuelms/shared'

export const inventoryBatchListQuerySchema = z.object({
  productCode: z.enum(FUEL_PRODUCT_CODES).optional(),
  activeOnly: z.boolean().optional(),
})

export type InventoryBatchListQuery = z.infer<typeof inventoryBatchListQuerySchema>

export const inventoryMovementListQuerySchema = z.object({
  productCode: z.enum(FUEL_PRODUCT_CODES).optional(),
  limit: z.number().int().min(1).max(500).optional(),
})

export type InventoryMovementListQuery = z.infer<typeof inventoryMovementListQuerySchema>
