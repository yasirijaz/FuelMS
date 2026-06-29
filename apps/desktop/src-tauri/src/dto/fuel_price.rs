use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelProductDto {
    pub id: String,
    pub code: String,
    pub name: String,
    pub unit: String,
    pub display_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelPriceRecordDto {
    pub id: String,
    pub product_id: String,
    pub product_code: String,
    pub price_per_litre_minor: i64,
    pub effective_from_iso: String,
    pub effective_to_iso: Option<String>,
    pub status: String,
    pub reason: Option<String>,
    pub reference: Option<String>,
    pub recorded_by: String,
    pub batch_id: Option<String>,
    pub superseded_by_id: Option<String>,
    pub is_locked: bool,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFuelPriceRecordResponse {
    pub record: FuelPriceRecordDto,
    pub superseded_record: Option<FuelPriceRecordDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceHistoryQueryDto {
    pub product_id: Option<String>,
    pub from_iso: Option<String>,
    pub to_iso: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelPriceChangeBatchDto {
    pub id: String,
    pub reason: Option<String>,
    pub reference: Option<String>,
    pub recorded_by: String,
    pub created_at_iso: String,
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
pub struct CommandResultDto<T: Serialize> {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<CommandErrorDto>,
}

impl<T: Serialize> CommandResultDto<T> {
    pub fn ok(value: T) -> Self {
        Self {
            ok: true,
            value: Some(value),
            error: None,
        }
    }
}
