use tauri::State;

use crate::db::AppDatabase;
use crate::dto::fuel_price::{
    CommandResultDto, FuelPriceChangeBatchDto, FuelPriceRecordDto, PriceHistoryQueryDto,
    SaveFuelPriceRecordResponse,
};
use crate::repositories::{FuelPriceRepository, FuelProductRepository};

#[tauri::command]
pub fn fuel_price_list_products(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<Vec<crate::dto::fuel_price::FuelProductDto>> {
    match db.with_connection(|conn| FuelProductRepository::new(conn).list_active()) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_get_product_by_code(
    db: State<'_, AppDatabase>,
    code: String,
) -> CommandResultDto<crate::dto::fuel_price::FuelProductDto> {
    match db.with_connection(|conn| FuelProductRepository::new(conn).find_by_code(&code)) {
        Ok(dto) => CommandResultDto::ok(dto),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_get_product_by_id(
    db: State<'_, AppDatabase>,
    product_id: String,
) -> CommandResultDto<crate::dto::fuel_price::FuelProductDto> {
    match db.with_connection(|conn| FuelProductRepository::new(conn).find_by_id(&product_id)) {
        Ok(dto) => CommandResultDto::ok(dto),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_get_record_by_id(
    db: State<'_, AppDatabase>,
    record_id: String,
) -> CommandResultDto<FuelPriceRecordDto> {
    match db.with_connection(|conn| FuelPriceRepository::new(conn).find_by_id(&record_id)) {
        Ok(dto) => CommandResultDto::ok(dto),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_get_active_by_product(
    db: State<'_, AppDatabase>,
    product_id: String,
) -> CommandResultDto<Option<FuelPriceRecordDto>> {
    match db.with_connection(|conn| FuelPriceRepository::new(conn).find_active_by_product(&product_id)) {
        Ok(dto) => CommandResultDto::ok(dto),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_list_active(db: State<'_, AppDatabase>) -> CommandResultDto<Vec<FuelPriceRecordDto>> {
    match db.with_connection(|conn| FuelPriceRepository::new(conn).list_active()) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_list_scheduled_by_product(
    db: State<'_, AppDatabase>,
    product_id: String,
) -> CommandResultDto<Vec<FuelPriceRecordDto>> {
    match db.with_connection(|conn| {
        FuelPriceRepository::new(conn).list_scheduled_by_product(&product_id)
    }) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_list_due_scheduled(
    db: State<'_, AppDatabase>,
    as_of_iso: String,
) -> CommandResultDto<Vec<FuelPriceRecordDto>> {
    match db.with_connection(|conn| FuelPriceRepository::new(conn).list_due_scheduled(&as_of_iso)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_list_history(
    db: State<'_, AppDatabase>,
    query: PriceHistoryQueryDto,
) -> CommandResultDto<Vec<FuelPriceRecordDto>> {
    let limit = query.limit.unwrap_or(100);
    match db.with_connection(|conn| {
        FuelPriceRepository::new(conn).list_history(
            query.product_id.as_deref(),
            query.from_iso.as_deref(),
            query.to_iso.as_deref(),
            limit,
        )
    }) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_save_new(
    db: State<'_, AppDatabase>,
    record: FuelPriceRecordDto,
) -> CommandResultDto<SaveFuelPriceRecordResponse> {
    match db.with_connection(|conn| FuelPriceRepository::new(conn).save_new(&record)) {
        Ok(response) => CommandResultDto::ok(response),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_update_record(
    db: State<'_, AppDatabase>,
    record: FuelPriceRecordDto,
) -> CommandResultDto<()> {
    match db.with_connection(|conn| FuelPriceRepository::new(conn).update(&record)) {
        Ok(()) => CommandResultDto::ok(()),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_save_batch(
    db: State<'_, AppDatabase>,
    batch: FuelPriceChangeBatchDto,
) -> CommandResultDto<()> {
    match db.with_connection(|conn| {
        FuelPriceRepository::new(conn).save_batch(
            &batch.id,
            batch.reason.as_deref(),
            batch.reference.as_deref(),
            &batch.recorded_by,
            &batch.created_at_iso,
        )
    }) {
        Ok(()) => CommandResultDto::ok(()),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_price_log_blocked_edit(
    db: State<'_, AppDatabase>,
    product_id: String,
    price_record_id: String,
    actor_id: String,
    detail: serde_json::Value,
) -> CommandResultDto<()> {
    let detail_json = detail.to_string();
    let audit_id = uuid::Uuid::new_v4().to_string();
    let occurred_at = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

    match db.with_connection(|conn| {
        FuelPriceRepository::new(conn).log_blocked_edit(
            "blocked_historical_edit",
            Some(&product_id),
            Some(&price_record_id),
            &actor_id,
            &detail_json,
            &occurred_at,
            &audit_id,
        )
    }) {
        Ok(()) => CommandResultDto::ok(()),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
