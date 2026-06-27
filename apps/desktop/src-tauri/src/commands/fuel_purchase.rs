use tauri::State;

use crate::db::AppDatabase;
use crate::dto::fuel_purchase::{
    CommandResultDto, FuelPurchaseDto, FuelPurchaseListQueryDto, PostFuelPurchaseInputDto,
    RecordFuelPurchaseInputDto, VoidFuelPurchaseInputDto,
};
use crate::repositories::fuel_purchase_repository::FuelPurchaseRepository;

#[tauri::command]
pub fn fuel_purchase_list(
    db: State<'_, AppDatabase>,
    query: FuelPurchaseListQueryDto,
) -> CommandResultDto<Vec<FuelPurchaseDto>> {
    match db.with_connection(|conn| FuelPurchaseRepository::new(conn).list(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_purchase_get_by_id(
    db: State<'_, AppDatabase>,
    purchase_id: String,
) -> CommandResultDto<FuelPurchaseDto> {
    match db.with_connection(|conn| FuelPurchaseRepository::new(conn).find_by_id(&purchase_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_purchase_record(
    db: State<'_, AppDatabase>,
    input: RecordFuelPurchaseInputDto,
) -> CommandResultDto<FuelPurchaseDto> {
    match db.with_connection(|conn| FuelPurchaseRepository::new(conn).record(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_purchase_post(
    db: State<'_, AppDatabase>,
    input: PostFuelPurchaseInputDto,
) -> CommandResultDto<FuelPurchaseDto> {
    match db.with_connection(|conn| FuelPurchaseRepository::new(conn).post(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_purchase_void(
    db: State<'_, AppDatabase>,
    input: VoidFuelPurchaseInputDto,
) -> CommandResultDto<FuelPurchaseDto> {
    match db.with_connection(|conn| FuelPurchaseRepository::new(conn).void_purchase(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
