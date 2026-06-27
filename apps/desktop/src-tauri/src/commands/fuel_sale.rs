use tauri::State;

use crate::db::AppDatabase;
use crate::dto::fuel_sale::{
    CommandResultDto, FuelSaleDto, FuelSaleListQueryDto, PostFuelSaleInputDto,
    ProductStockDto, RecordFuelSaleInputDto, VoidFuelSaleInputDto,
};
use crate::repositories::fuel_sale_repository::FuelSaleRepository;

#[tauri::command]
pub fn fuel_sale_list(
    db: State<'_, AppDatabase>,
    query: FuelSaleListQueryDto,
) -> CommandResultDto<Vec<FuelSaleDto>> {
    match db.with_connection(|conn| FuelSaleRepository::new(conn).list(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_sale_get_by_id(
    db: State<'_, AppDatabase>,
    sale_id: String,
) -> CommandResultDto<FuelSaleDto> {
    match db.with_connection(|conn| FuelSaleRepository::new(conn).find_by_id(&sale_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_sale_available_stock(
    db: State<'_, AppDatabase>,
    product_code: String,
) -> CommandResultDto<ProductStockDto> {
    match db.with_connection(|conn| FuelSaleRepository::new(conn).available_stock_by_product(&product_code)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_sale_record(
    db: State<'_, AppDatabase>,
    input: RecordFuelSaleInputDto,
) -> CommandResultDto<FuelSaleDto> {
    match db.with_connection(|conn| FuelSaleRepository::new(conn).record(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_sale_post(
    db: State<'_, AppDatabase>,
    input: PostFuelSaleInputDto,
) -> CommandResultDto<FuelSaleDto> {
    match db.with_connection(|conn| FuelSaleRepository::new(conn).post(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn fuel_sale_void(
    db: State<'_, AppDatabase>,
    input: VoidFuelSaleInputDto,
) -> CommandResultDto<FuelSaleDto> {
    match db.with_connection(|conn| FuelSaleRepository::new(conn).void_sale(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
