use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelSaleDto {
    pub id: String,
    pub sale_date_iso: String,
    pub product_id: String,
    pub product_code: String,
    pub customer_partner_id: Option<String>,
    pub customer_name: Option<String>,
    pub quantity_milli_litres: i64,
    pub unit_price_minor_per_litre: i64,
    pub fuel_price_record_id: String,
    pub total_revenue_minor: i64,
    pub total_cogs_minor: i64,
    pub payment_method: String,
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
pub struct FuelSaleListQueryDto {
    pub search: Option<String>,
    pub status: Option<String>,
    pub from_date_iso: Option<String>,
    pub to_date_iso: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordFuelSaleInputDto {
    pub sale_date_iso: String,
    pub product_code: String,
    pub customer_partner_id: Option<String>,
    pub quantity_milli_litres: i64,
    pub unit_price_minor_per_litre: i64,
    pub fuel_price_record_id: String,
    pub payment_method: String,
    pub reference: Option<String>,
    pub notes: Option<String>,
    pub post_immediately: bool,
    pub recorded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostFuelSaleInputDto {
    pub sale_id: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoidFuelSaleInputDto {
    pub sale_id: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductStockDto {
    pub product_code: String,
    pub available_milli_litres: i64,
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
