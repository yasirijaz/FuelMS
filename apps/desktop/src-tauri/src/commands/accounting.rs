use tauri::State;

use crate::db::AppDatabase;
use crate::dto::accounting::{
    AccountingPeriodDto, AccountingPeriodVersionInputDto, CommandResultDto, JournalEntryDto,
    JournalListQueryDto, LedgerAccountDto,
};
use crate::repositories::accounting_period_repository::AccountingPeriodRepository;
use crate::repositories::journal_repository::JournalRepository;
use crate::repositories::ledger_account_repository::LedgerAccountRepository;

#[tauri::command]
pub fn accounting_ledger_account_list(
    db: State<'_, AppDatabase>,
    active_only: Option<bool>,
) -> CommandResultDto<Vec<LedgerAccountDto>> {
    match db.with_business(|conn| {
        LedgerAccountRepository::new(conn).list(active_only.unwrap_or(true))
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
pub fn accounting_ledger_account_get_by_id(
    db: State<'_, AppDatabase>,
    account_id: String,
) -> CommandResultDto<LedgerAccountDto> {
    match db.with_business(|conn| LedgerAccountRepository::new(conn).find_by_id(&account_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn accounting_journal_list(
    db: State<'_, AppDatabase>,
    query: JournalListQueryDto,
) -> CommandResultDto<Vec<JournalEntryDto>> {
    match db.with_business(|conn| JournalRepository::new(conn).list(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn accounting_journal_get_by_id(
    db: State<'_, AppDatabase>,
    journal_id: String,
) -> CommandResultDto<JournalEntryDto> {
    match db.with_business(|conn| JournalRepository::new(conn).find_by_id(&journal_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn accounting_period_list(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<Vec<AccountingPeriodDto>> {
    match db.with_business(|conn| AccountingPeriodRepository::new(conn).list()) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn accounting_period_get_current(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<AccountingPeriodDto> {
    match db.with_business(|conn| AccountingPeriodRepository::new(conn).find_current()) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn accounting_period_close(
    db: State<'_, AppDatabase>,
    input: AccountingPeriodVersionInputDto,
) -> CommandResultDto<AccountingPeriodDto> {
    match db.with_business(|conn| AccountingPeriodRepository::new(conn).close_period(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn accounting_period_reopen(
    db: State<'_, AppDatabase>,
    input: AccountingPeriodVersionInputDto,
) -> CommandResultDto<AccountingPeriodDto> {
    match db.with_business(|conn| AccountingPeriodRepository::new(conn).reopen_period(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
