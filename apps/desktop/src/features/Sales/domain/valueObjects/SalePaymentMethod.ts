export const SALE_PAYMENT_METHODS = ['cash', 'credit', 'card'] as const

export type SalePaymentMethod = (typeof SALE_PAYMENT_METHODS)[number]

export function isSalePaymentMethod(value: string): value is SalePaymentMethod {
  return (SALE_PAYMENT_METHODS as readonly string[]).includes(value)
}

export function salePaymentMethodLabel(method: SalePaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'Cash'
    case 'credit':
      return 'Credit'
    case 'card':
      return 'Card'
  }
}
