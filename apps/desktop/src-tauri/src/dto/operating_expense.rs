use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OperatingExpenseDto {
    pub id: String,
    pub expense_date_iso: String,
    pub category_code: String,
    pub amount_minor: i64,
    pub payment_status: String,
    pub payee_name: String,
    pub cash_account_id: Option<String>,
    pub cash_account_name: Option<String>,
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
pub struct OperatingExpenseListQueryDto {
    pub search: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordOperatingExpenseInputDto {
    pub expense_date_iso: String,
    pub category_code: String,
    pub amount_minor: i64,
    pub payment_status: String,
    pub payee_name: String,
    pub cash_account_id: Option<String>,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoidOperatingExpenseInputDto {
    pub expense_id: String,
    pub version: i64,
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
