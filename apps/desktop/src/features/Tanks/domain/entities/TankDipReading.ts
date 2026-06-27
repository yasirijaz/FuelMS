export type TankDipReading = {
  id: string
  tankId: string
  readingAt: Date
  quantityMilliLitres: number
  recordedBy: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  version: number
}
