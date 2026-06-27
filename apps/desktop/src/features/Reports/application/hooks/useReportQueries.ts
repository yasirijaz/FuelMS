import { useQuery } from '@tanstack/react-query'
import type { ReportDateRangeQuery } from '../../domain'
import {
  getCashPositionReportService,
  getFuelProductLedgerReportService,
  getFuelSalesSummaryReportService,
  getPersonLedgerSummaryReportService,
  getProfitLossReportService,
  getTrialBalanceReportService,
  reportsQueryKeys,
} from '../reportsModule'
import {
  mapCashPositionToView,
  mapFuelProductLedgerToView,
  mapFuelSalesSummaryToView,
  mapPersonLedgerSummaryToView,
  mapProfitLossToView,
  mapTrialBalanceToView,
} from '../types/ReportViewTypes'

export function useProfitLossReport(query: ReportDateRangeQuery) {
  return useQuery({
    queryKey: reportsQueryKeys.profitLoss(query),
    queryFn: async () => {
      const result = await getProfitLossReportService.execute(query)
      if (!result.ok) throw result.error
      return mapProfitLossToView(result.value)
    },
    staleTime: 15_000,
  })
}

export function useFuelSalesSummaryReport(query: ReportDateRangeQuery) {
  return useQuery({
    queryKey: reportsQueryKeys.fuelSalesSummary(query),
    queryFn: async () => {
      const result = await getFuelSalesSummaryReportService.execute(query)
      if (!result.ok) throw result.error
      return mapFuelSalesSummaryToView(result.value)
    },
    staleTime: 15_000,
  })
}

export function useFuelProductLedgerReport(query: ReportDateRangeQuery) {
  return useQuery({
    queryKey: reportsQueryKeys.fuelProductLedger(query),
    queryFn: async () => {
      const result = await getFuelProductLedgerReportService.execute(query)
      if (!result.ok) throw result.error
      return mapFuelProductLedgerToView(result.value)
    },
    staleTime: 15_000,
  })
}

export function useCashPositionReport() {
  return useQuery({
    queryKey: reportsQueryKeys.cashPosition(),
    queryFn: async () => {
      const result = await getCashPositionReportService.execute()
      if (!result.ok) throw result.error
      return mapCashPositionToView(result.value)
    },
    staleTime: 15_000,
  })
}

export function usePersonLedgerSummaryReport() {
  return useQuery({
    queryKey: reportsQueryKeys.personLedgerSummary(),
    queryFn: async () => {
      const result = await getPersonLedgerSummaryReportService.execute()
      if (!result.ok) throw result.error
      return mapPersonLedgerSummaryToView(result.value)
    },
    staleTime: 15_000,
  })
}

export function useTrialBalanceReport() {
  return useQuery({
    queryKey: reportsQueryKeys.trialBalance(),
    queryFn: async () => {
      const result = await getTrialBalanceReportService.execute()
      if (!result.ok) throw result.error
      return mapTrialBalanceToView(result.value)
    },
    staleTime: 15_000,
  })
}
