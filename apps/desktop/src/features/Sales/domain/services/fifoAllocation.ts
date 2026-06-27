export interface FifoBatch {
  id: string
  remainingMilliLitres: number
  unitCostMinorPerLitre: number
}

export interface FifoConsumption {
  batchId: string
  quantityMilliLitres: number
  unitCostMinorPerLitre: number
  costMinor: number
}

export type FifoError =
  | { kind: 'insufficient-stock'; availableMilli: number; requestedMilli: number }
  | { kind: 'invalid-quantity' }

export function fifoErrorMessage(error: FifoError): string {
  switch (error.kind) {
    case 'insufficient-stock':
      return `Insufficient stock. Available: ${(error.availableMilli / 1000).toFixed(3)} L, requested: ${(error.requestedMilli / 1000).toFixed(3)} L.`
    case 'invalid-quantity':
      return 'Quantity must be greater than zero.'
  }
}

/** Deterministic FIFO allocation — mirrors Rust `allocate_fifo`. */
export function allocateFifo(
  batches: readonly FifoBatch[],
  quantityMilliLitres: number,
): Result<FifoConsumption[], FifoError> {
  if (quantityMilliLitres <= 0) {
    return { ok: false, error: { kind: 'invalid-quantity' } }
  }

  const available = batches.reduce((sum, batch) => sum + batch.remainingMilliLitres, 0)
  if (available < quantityMilliLitres) {
    return {
      ok: false,
      error: {
        kind: 'insufficient-stock',
        availableMilli: available,
        requestedMilli: quantityMilliLitres,
      },
    }
  }

  let remaining = quantityMilliLitres
  const consumptions: FifoConsumption[] = []

  for (const batch of batches) {
    if (remaining <= 0) break
    if (batch.remainingMilliLitres <= 0) continue

    const take = Math.min(remaining, batch.remainingMilliLitres)
    const costMinor = Math.floor((take * batch.unitCostMinorPerLitre) / 1000)
    consumptions.push({
      batchId: batch.id,
      quantityMilliLitres: take,
      unitCostMinorPerLitre: batch.unitCostMinorPerLitre,
      costMinor,
    })
    remaining -= take
  }

  return { ok: true, value: consumptions }
}

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
