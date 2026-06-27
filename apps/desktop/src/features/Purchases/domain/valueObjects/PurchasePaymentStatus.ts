export const PURCHASE_PAYMENT_STATUSES = ['paid', 'credit'] as const

export type PurchasePaymentStatus = (typeof PURCHASE_PAYMENT_STATUSES)[number]

export function isPurchasePaymentStatus(value: string): value is PurchasePaymentStatus {
  return (PURCHASE_PAYMENT_STATUSES as readonly string[]).includes(value)
}

export function purchasePaymentStatusLabel(status: PurchasePaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'Paid'
    case 'credit':
      return 'Credit'
  }
}
