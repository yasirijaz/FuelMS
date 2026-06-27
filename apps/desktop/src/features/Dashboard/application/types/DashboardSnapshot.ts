import type { FuelProductCode, InventoryProductSummary } from '@fuelms/shared'

export type DashboardKpi = {
  id: 'todaySales' | 'todayProfit' | 'cashBalance'
  label: string
  amountMinor: number
  trendPercent?: number
}

export type FuelStockLevel = {
  productCode: FuelProductCode
  fillPercent: number
  capacityLitres?: number
}

export type DashboardQuickAction = {
  id: string
  label: string
  to: string
}

export type DashboardSnapshot = {
  kpis: DashboardKpi[]
  fuelStock: FuelStockLevel[]
  inventoryProducts: InventoryProductSummary[]
  quickActions: DashboardQuickAction[]
}
