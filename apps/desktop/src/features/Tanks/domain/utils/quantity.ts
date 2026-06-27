/** Convert litres (UI) to integer milli-litres (persistence). */
export function litresToMilliLitres(litres: number): number {
  return Math.round(litres * 1000)
}

/** Convert milli-litres (persistence) to litres (UI). */
export function milliLitresToLitres(milliLitres: number): number {
  return milliLitres / 1000
}
