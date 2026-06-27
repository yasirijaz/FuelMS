import type { PeriodStatus } from '../valueObjects/PeriodStatus'
import type { PeriodType } from '../valueObjects/PeriodType'

export type AccountingPeriodId = string & { readonly __brand: 'AccountingPeriodId' }
export const AccountingPeriodId = {
  fromPersisted(value: string): AccountingPeriodId {
    return value as AccountingPeriodId
  },
  toString(id: AccountingPeriodId): string {
    return id
  },
}

export type AccountingPeriod = {
  id: AccountingPeriodId
  periodKey: string
  periodType: PeriodType
  startDate: Date
  endDate: Date
  status: PeriodStatus
  closedAt?: Date
  closedBy?: string
  createdAt: Date
  updatedAt: Date
  version: number
}
