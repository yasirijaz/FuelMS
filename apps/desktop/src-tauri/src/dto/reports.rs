use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportDateRangeQueryDto {
    pub from_date_iso: String,
    pub to_date_iso: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfitLossReportDto {
    pub from_date_iso: String,
    pub to_date_iso: String,
    pub fuel_sales_revenue_minor: i64,
    pub fuel_cogs_minor: i64,
    pub gross_profit_minor: i64,
    pub other_income_minor: i64,
    pub operating_expenses_minor: i64,
    pub net_operating_profit_minor: i64,
    pub posted_sale_count: i64,
    pub posted_expense_count: i64,
    pub posted_income_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelSalesSummaryLineDto {
    pub product_code: String,
    pub sale_count: i64,
    pub quantity_milli_litres: i64,
    pub revenue_minor: i64,
    pub cogs_minor: i64,
    pub gross_profit_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelSalesSummaryReportDto {
    pub from_date_iso: String,
    pub to_date_iso: String,
    pub lines: Vec<FuelSalesSummaryLineDto>,
    pub total_revenue_minor: i64,
    pub total_cogs_minor: i64,
    pub total_gross_profit_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashPositionLineDto {
    pub account_id: String,
    pub account_name: String,
    pub account_type: String,
    pub balance_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashPositionReportDto {
    pub as_of_iso: String,
    pub lines: Vec<CashPositionLineDto>,
    pub total_balance_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonBalanceLineDto {
    pub partner_id: String,
    pub partner_name: String,
    pub balance_minor: i64,
    pub entry_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonLedgerSummaryReportDto {
    pub as_of_iso: String,
    pub receivable_total_minor: i64,
    pub payable_total_minor: i64,
    pub lines: Vec<PersonBalanceLineDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrialBalanceLineDto {
    pub account_code: String,
    pub account_name: String,
    pub account_type: String,
    pub balance_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrialBalanceReportDto {
    pub as_of_iso: String,
    pub lines: Vec<TrialBalanceLineDto>,
    pub total_debit_minor: i64,
    pub total_credit_minor: i64,
    pub is_balanced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelProductLedgerLineDto {
    pub occurred_at_iso: String,
    pub kind: String,
    pub reference_id: String,
    pub label: String,
    pub notes: Option<String>,
    pub status: String,
    pub quantity_milli_litres: i64,
    pub money_in_minor: i64,
    pub money_out_minor: i64,
    pub gross_profit_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelProductLedgerProductDto {
    pub product_code: String,
    pub stock_milli_litres: i64,
    pub period_revenue_minor: i64,
    pub period_cogs_minor: i64,
    pub period_gross_profit_minor: i64,
    pub all_time_revenue_minor: i64,
    pub all_time_cogs_minor: i64,
    pub all_time_gross_profit_minor: i64,
    pub lines: Vec<FuelProductLedgerLineDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelProductLedgerReportDto {
    pub from_date_iso: String,
    pub to_date_iso: String,
    pub period_gross_profit_minor: i64,
    pub all_time_gross_profit_minor: i64,
    pub products: Vec<FuelProductLedgerProductDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandErrorDto {
    pub code: String,
    pub message: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResultDto<T> {
    pub ok: bool,
    pub value: Option<T>,
    pub error: Option<CommandErrorDto>,
}

impl<T> CommandResultDto<T> {
    pub fn ok(value: T) -> Self {
        Self {
            ok: true,
            value: Some(value),
            error: None,
        }
    }
}
