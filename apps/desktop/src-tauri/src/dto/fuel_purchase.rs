use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelPurchaseDto {
    pub id: String,
    pub purchase_date_iso: String,
    pub product_id: String,
    pub product_code: String,
    pub supplier_partner_id: Option<String>,
    pub supplier_name: Option<String>,
    pub quantity_milli_litres: i64,
    pub unit_cost_minor_per_litre: i64,
    pub total_cost_minor: i64,
    pub invoice_reference: Option<String>,
    pub payment_status: String,
    pub notes: Option<String>,
    pub status: String,
    pub batch_id: Option<String>,
    pub recorded_by: String,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelPurchaseListQueryDto {
    pub search: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordFuelPurchaseInputDto {
    pub purchase_date_iso: String,
    pub product_code: String,
    pub supplier_partner_id: Option<String>,
    pub quantity_milli_litres: i64,
    pub unit_cost_minor_per_litre: i64,
    pub invoice_reference: Option<String>,
    pub payment_status: String,
    pub notes: Option<String>,
    pub post_immediately: bool,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostFuelPurchaseInputDto {
    pub purchase_id: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoidFuelPurchaseInputDto {
    pub purchase_id: String,
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
