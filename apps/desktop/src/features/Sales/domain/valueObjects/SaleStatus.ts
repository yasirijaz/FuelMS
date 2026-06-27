export const SALE_STATUSES = ['draft', 'posted', 'void'] as const

export type SaleStatus = (typeof SALE_STATUSES)[number]

export function isSaleStatus(value: string): value is SaleStatus {
  return (SALE_STATUSES as readonly string[]).includes(value)
}

export function saleStatusLabel(status: SaleStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'posted':
      return 'Posted'
    case 'void':
      return 'Void'
  }
}
