use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonLedgerEntryDto {
    pub id: String,
    pub partner_id: String,
    pub partner_name: String,
    pub entry_date_iso: String,
    pub entry_type: String,
    pub signed_amount_minor: i64,
    pub balance_after_minor: i64,
    pub cash_account_id: Option<String>,
    pub cash_account_name: Option<String>,
    pub source_type: String,
    pub source_id: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub recorded_by: String,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonLedgerBalanceDto {
    pub partner_id: String,
    pub partner_name: String,
    pub roles: Vec<String>,
    pub balance_minor: i64,
    pub entry_count: i64,
    pub last_entry_date_iso: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonLedgerBalanceListQueryDto {
    pub search: Option<String>,
    pub role_code: Option<String>,
    pub non_zero_only: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonLedgerEntryListQueryDto {
    pub partner_id: String,
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPersonBorrowInputDto {
    pub partner_id: String,
    pub amount_minor: i64,
    pub entry_date_iso: String,
    pub cash_account_id: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPersonRepayBorrowedInputDto {
    pub partner_id: String,
    pub amount_minor: i64,
    pub entry_date_iso: String,
    pub cash_account_id: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPersonLendInputDto {
    pub partner_id: String,
    pub amount_minor: i64,
    pub entry_date_iso: String,
    pub cash_account_id: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordPersonCollectLoanInputDto {
    pub partner_id: String,
    pub amount_minor: i64,
    pub entry_date_iso: String,
    pub cash_account_id: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
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
