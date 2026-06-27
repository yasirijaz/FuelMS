export const PURCHASE_STATUSES = ['draft', 'posted', 'void'] as const

export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number]

export function isPurchaseStatus(value: string): value is PurchaseStatus {
  return (PURCHASE_STATUSES as readonly string[]).includes(value)
}

export function purchaseStatusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'posted':
      return 'Posted'
    case 'void':
      return 'Void'
  }
}
