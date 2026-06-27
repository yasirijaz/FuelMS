use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FuelTankDto {
    pub id: String,
    pub name: String,
    pub product_id: String,
    pub product_code: String,
    pub capacity_milli_litres: i64,
    pub is_active: bool,
    pub display_order: i64,
    pub notes: Option<String>,
    pub book_milli_litres: i64,
    pub fill_percent: i64,
    pub last_dip_milli_litres: Option<i64>,
    pub last_dip_at_iso: Option<String>,
    pub variance_milli_litres: Option<i64>,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TankDipReadingDto {
    pub id: String,
    pub tank_id: String,
    pub reading_at_iso: String,
    pub quantity_milli_litres: i64,
    pub recorded_by: String,
    pub notes: Option<String>,
    pub created_at_iso: String,
    pub updated_at_iso: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFuelTankInputDto {
    pub name: String,
    pub product_code: String,
    pub capacity_milli_litres: i64,
    pub notes: Option<String>,
    pub display_order: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFuelTankInputDto {
    pub id: String,
    pub name: String,
    pub capacity_milli_litres: i64,
    pub notes: Option<String>,
    pub display_order: i64,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TankVersionInputDto {
    pub tank_id: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordTankDipInputDto {
    pub tank_id: String,
    pub reading_at_iso: String,
    pub quantity_milli_litres: i64,
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
