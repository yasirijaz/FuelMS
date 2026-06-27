use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashAccountDto {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub balance_minor: i64,
    pub is_active: bool,
    pub display_order: i64,
    pub notes: Option<String>,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashTransferDto {
    pub id: String,
    pub from_account_id: String,
    pub from_account_name: String,
    pub to_account_id: String,
    pub to_account_name: String,
    pub amount_minor: i64,
    pub transferred_at_iso: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCashAccountInputDto {
    pub name: String,
    pub account_type: String,
    pub opening_balance_minor: Option<i64>,
    pub display_order: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCashAccountInputDto {
    pub id: String,
    pub name: String,
    pub display_order: i64,
    pub notes: Option<String>,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashAccountVersionInputDto {
    pub account_id: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordCashTransferInputDto {
    pub from_account_id: String,
    pub to_account_id: String,
    pub amount_minor: i64,
    pub transferred_at_iso: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CashTransferListQueryDto {
    pub account_id: Option<String>,
    pub limit: Option<i64>,
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
