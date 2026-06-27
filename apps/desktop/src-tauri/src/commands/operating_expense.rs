use tauri::State;

use crate::db::AppDatabase;
use crate::dto::operating_expense::{
    CommandResultDto, OperatingExpenseDto, OperatingExpenseListQueryDto,
    RecordOperatingExpenseInputDto, VoidOperatingExpenseInputDto,
};
use crate::repositories::operating_expense_repository::OperatingExpenseRepository;

#[tauri::command]
pub fn operating_expense_list(
    db: State<'_, AppDatabase>,
    query: OperatingExpenseListQueryDto,
) -> CommandResultDto<Vec<OperatingExpenseDto>> {
    match db.with_connection(|conn| OperatingExpenseRepository::new(conn).list(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn operating_expense_get_by_id(
    db: State<'_, AppDatabase>,
    expense_id: String,
) -> CommandResultDto<OperatingExpenseDto> {
    match db.with_connection(|conn| OperatingExpenseRepository::new(conn).find_by_id(&expense_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn operating_expense_record(
    db: State<'_, AppDatabase>,
    input: RecordOperatingExpenseInputDto,
) -> CommandResultDto<OperatingExpenseDto> {
    match db.with_connection(|conn| OperatingExpenseRepository::new(conn).record(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn operating_expense_void(
    db: State<'_, AppDatabase>,
    input: VoidOperatingExpenseInputDto,
) -> CommandResultDto<OperatingExpenseDto> {
    match db.with_connection(|conn| OperatingExpenseRepository::new(conn).void(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
