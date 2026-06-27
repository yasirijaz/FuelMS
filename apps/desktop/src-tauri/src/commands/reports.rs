use tauri::State;

use crate::db::AppDatabase;
use crate::dto::reports::{
    CashPositionReportDto, CommandResultDto, FuelProductLedgerReportDto, FuelSalesSummaryReportDto,
    PersonLedgerSummaryReportDto, ProfitLossReportDto, ReportDateRangeQueryDto,
    TrialBalanceReportDto,
};
use crate::repositories::reports_repository::ReportsRepository;

#[tauri::command]
pub fn report_profit_loss(
    db: State<'_, AppDatabase>,
    query: ReportDateRangeQueryDto,
) -> CommandResultDto<ProfitLossReportDto> {
    match db.with_connection(|conn| ReportsRepository::new(conn).profit_loss(&query)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn report_fuel_sales_summary(
    db: State<'_, AppDatabase>,
    query: ReportDateRangeQueryDto,
) -> CommandResultDto<FuelSalesSummaryReportDto> {
    match db.with_connection(|conn| ReportsRepository::new(conn).fuel_sales_summary(&query)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn report_fuel_product_ledger(
    db: State<'_, AppDatabase>,
    query: ReportDateRangeQueryDto,
) -> CommandResultDto<FuelProductLedgerReportDto> {
    match db.with_connection(|conn| ReportsRepository::new(conn).fuel_product_ledger(&query)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn report_cash_position(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<CashPositionReportDto> {
    match db.with_connection(|conn| ReportsRepository::new(conn).cash_position()) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn report_person_ledger_summary(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<PersonLedgerSummaryReportDto> {
    match db.with_connection(|conn| ReportsRepository::new(conn).person_ledger_summary()) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn report_trial_balance(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<TrialBalanceReportDto> {
    match db.with_connection(|conn| ReportsRepository::new(conn).trial_balance()) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
