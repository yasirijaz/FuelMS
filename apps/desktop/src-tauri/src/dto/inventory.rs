use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryProductSummaryDto {
    pub product_code: String,
    pub quantity_milli_litres: i64,
    pub valuation_minor: i64,
    pub batch_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryBatchDto {
    pub id: String,
    pub product_code: String,
    pub received_at_iso: String,
    pub quantity_milli_litres: i64,
    pub remaining_milli_litres: i64,
    pub unit_cost_minor_per_litre: i64,
    pub valuation_minor: i64,
    pub supplier_name: Option<String>,
    pub purchase_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryBatchListQueryDto {
    pub product_code: Option<String>,
    pub active_only: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryMovementDto {
    pub id: String,
    pub kind: String,
    pub occurred_at_iso: String,
    pub product_code: String,
    pub quantity_milli_litres: i64,
    pub reference_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryMovementListQueryDto {
    pub product_code: Option<String>,
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
