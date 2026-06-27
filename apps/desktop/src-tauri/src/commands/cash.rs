use tauri::State;

use crate::db::AppDatabase;
use crate::dto::cash::{
    CashAccountDto, CashAccountVersionInputDto, CashTransferDto, CashTransferListQueryDto,
    CommandResultDto, CreateCashAccountInputDto, RecordCashTransferInputDto,
    UpdateCashAccountInputDto,
};
use crate::repositories::cash_repository::CashRepository;

#[tauri::command]
pub fn cash_account_list(
    db: State<'_, AppDatabase>,
    active_only: Option<bool>,
) -> CommandResultDto<Vec<CashAccountDto>> {
    match db.with_connection(|conn| CashRepository::new(conn).list_accounts(active_only.unwrap_or(true))) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_account_get_by_id(
    db: State<'_, AppDatabase>,
    account_id: String,
) -> CommandResultDto<CashAccountDto> {
    match db.with_connection(|conn| CashRepository::new(conn).find_account_by_id(&account_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_account_create(
    db: State<'_, AppDatabase>,
    input: CreateCashAccountInputDto,
) -> CommandResultDto<CashAccountDto> {
    match db.with_connection(|conn| CashRepository::new(conn).create_account(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_account_update(
    db: State<'_, AppDatabase>,
    input: UpdateCashAccountInputDto,
) -> CommandResultDto<CashAccountDto> {
    match db.with_connection(|conn| CashRepository::new(conn).update_account(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_account_activate(
    db: State<'_, AppDatabase>,
    input: CashAccountVersionInputDto,
) -> CommandResultDto<CashAccountDto> {
    match db.with_connection(|conn| CashRepository::new(conn).set_account_active(&input, true)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_account_deactivate(
    db: State<'_, AppDatabase>,
    input: CashAccountVersionInputDto,
) -> CommandResultDto<CashAccountDto> {
    match db.with_connection(|conn| CashRepository::new(conn).set_account_active(&input, false)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_transfer_list(
    db: State<'_, AppDatabase>,
    query: CashTransferListQueryDto,
) -> CommandResultDto<Vec<CashTransferDto>> {
    match db.with_connection(|conn| CashRepository::new(conn).list_transfers(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn cash_transfer_record(
    db: State<'_, AppDatabase>,
    input: RecordCashTransferInputDto,
) -> CommandResultDto<CashTransferDto> {
    match db.with_connection(|conn| CashRepository::new(conn).record_transfer(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
