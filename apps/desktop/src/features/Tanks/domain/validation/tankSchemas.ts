import { z } from 'zod'
import { FUEL_PRODUCT_CODES, parseFuelQuantityInput } from '@fuelms/shared'

export const createFuelTankInputSchema = z.object({
  name: z.string().trim().min(1, 'Tank name is required.'),
  productCode: z.enum(FUEL_PRODUCT_CODES),
  capacityLitres: z.number().positive('Capacity must be greater than zero.'),
  notes: z.string().optional(),
  displayOrder: z.number().int().optional(),
})

export type CreateFuelTankInput = z.infer<typeof createFuelTankInputSchema>

export const updateFuelTankInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Tank name is required.'),
  capacityLitres: z.number().positive('Capacity must be greater than zero.'),
  notes: z.string().optional(),
  displayOrder: z.number().int(),
  version: z.number().int().min(1),
})

export type UpdateFuelTankInput = z.infer<typeof updateFuelTankInputSchema>

export const tankVersionInputSchema = z.object({
  tankId: z.string().min(1),
  version: z.number().int().min(1),
})

export type TankVersionInput = z.infer<typeof tankVersionInputSchema>

export const recordTankDipInputSchema = z.object({
  tankId: z.string().min(1),
  readingAtIso: z.string().min(1),
  quantityLitres: z.number().min(0, 'Dip quantity cannot be negative.'),
  notes: z.string().optional(),
})

export type RecordTankDipInput = z.infer<typeof recordTankDipInputSchema>

export function parseCapacityLitresInput(raw: string): number | null {
  return parseFuelQuantityInput(raw)
}

export function parseDipLitresInput(raw: string): number | null {
  return parseFuelQuantityInput(raw)
}
