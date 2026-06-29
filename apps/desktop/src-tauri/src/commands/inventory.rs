use tauri::State;

use crate::db::AppDatabase;
use crate::dto::inventory::{
    CommandResultDto, InventoryBatchDto, InventoryBatchListQueryDto, InventoryMovementDto,
    InventoryMovementListQueryDto, InventoryProductSummaryDto,
};
use crate::repositories::inventory_repository::InventoryRepository;

#[tauri::command]
pub fn inventory_product_summary(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<Vec<InventoryProductSummaryDto>> {
    match db.with_business(|conn| InventoryRepository::new(conn).product_summary()) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn inventory_list_batches(
    db: State<'_, AppDatabase>,
    query: InventoryBatchListQueryDto,
) -> CommandResultDto<Vec<InventoryBatchDto>> {
    match db.with_business(|conn| InventoryRepository::new(conn).list_batches(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn inventory_list_movements(
    db: State<'_, AppDatabase>,
    query: InventoryMovementListQueryDto,
) -> CommandResultDto<Vec<InventoryMovementDto>> {
    match db.with_business(|conn| InventoryRepository::new(conn).list_movements(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
