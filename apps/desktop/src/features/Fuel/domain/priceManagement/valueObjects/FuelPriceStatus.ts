export const FUEL_PRICE_STATUSES = ['scheduled', 'active', 'superseded', 'cancelled'] as const

export type FuelPriceStatus = (typeof FUEL_PRICE_STATUSES)[number]

export function isFuelPriceStatus(value: string): value is FuelPriceStatus {
  return (FUEL_PRICE_STATUSES as readonly string[]).includes(value)
}

export function fuelPriceStatusLabel(status: FuelPriceStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled'
    case 'active':
      return 'Active'
    case 'superseded':
      return 'Superseded'
    case 'cancelled':
      return 'Cancelled'
  }
}
