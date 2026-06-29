use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LedgerAccountDto {
    pub id: String,
    pub code: String,
    pub name: String,
    pub account_type: String,
    pub parent_id: Option<String>,
    pub is_system: bool,
    pub is_active: bool,
    pub normal_balance: String,
    pub display_order: i64,
    pub notes: Option<String>,
    pub balance_minor: i64,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalLineDto {
    pub id: String,
    pub account_id: String,
    pub account_code: String,
    pub account_name: String,
    pub line_memo: Option<String>,
    pub debit_minor: i64,
    pub credit_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryDto {
    pub id: String,
    pub entry_date_iso: String,
    pub memo: Option<String>,
    pub source_type: String,
    pub source_id: String,
    pub posting_status: String,
    pub posted_at_iso: Option<String>,
    pub posted_by: Option<String>,
    pub total_debit_minor: i64,
    pub total_credit_minor: i64,
    pub line_count: i64,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lines: Option<Vec<JournalLineDto>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingPeriodDto {
    pub id: String,
    pub period_key: String,
    pub period_type: String,
    pub start_date_iso: String,
    pub end_date_iso: String,
    pub status: String,
    pub closed_at_iso: Option<String>,
    pub closed_by: Option<String>,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalListQueryDto {
    pub search: Option<String>,
    pub posting_status: Option<String>,
    pub from_date_iso: Option<String>,
    pub to_date_iso: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountingPeriodVersionInputDto {
    pub period_id: String,
    pub version: i64,
    pub actor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(not(test), allow(dead_code))]
pub struct PostJournalLineInputDto {
    pub account_id: String,
    pub line_memo: Option<String>,
    pub debit_minor: i64,
    pub credit_minor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(not(test), allow(dead_code))]
pub struct PostJournalInputDto {
    pub entry_date_iso: String,
    pub memo: Option<String>,
    pub source_type: String,
    pub source_id: String,
    pub posted_by: String,
    pub lines: Vec<PostJournalLineInputDto>,
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
