export type TodaySalesBucket = {
  saleCount: number
  quantityLitres: number
  revenueMinor: number
}

export type TodaySalesSummary = {
  dateIso: string
  posted: TodaySalesBucket
  draft: TodaySalesBucket
}

export const EMPTY_TODAY_SALES_BUCKET: TodaySalesBucket = {
  saleCount: 0,
  quantityLitres: 0,
  revenueMinor: 0,
}
