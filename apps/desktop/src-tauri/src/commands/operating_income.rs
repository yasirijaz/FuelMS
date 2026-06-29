use tauri::State;

use crate::db::AppDatabase;
use crate::dto::operating_income::{
    CommandResultDto, OperatingIncomeDto, OperatingIncomeListQueryDto,
    RecordOperatingIncomeInputDto, VoidOperatingIncomeInputDto,
};
use crate::repositories::operating_income_repository::OperatingIncomeRepository;

#[tauri::command]
pub fn operating_income_list(
    db: State<'_, AppDatabase>,
    query: OperatingIncomeListQueryDto,
) -> CommandResultDto<Vec<OperatingIncomeDto>> {
    match db.with_business(|conn| OperatingIncomeRepository::new(conn).list(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn operating_income_get_by_id(
    db: State<'_, AppDatabase>,
    income_id: String,
) -> CommandResultDto<OperatingIncomeDto> {
    match db.with_business(|conn| OperatingIncomeRepository::new(conn).find_by_id(&income_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn operating_income_record(
    db: State<'_, AppDatabase>,
    input: RecordOperatingIncomeInputDto,
) -> CommandResultDto<OperatingIncomeDto> {
    match db.with_business(|conn| OperatingIncomeRepository::new(conn).record(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn operating_income_void(
    db: State<'_, AppDatabase>,
    input: VoidOperatingIncomeInputDto,
) -> CommandResultDto<OperatingIncomeDto> {
    match db.with_business(|conn| OperatingIncomeRepository::new(conn).void(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
