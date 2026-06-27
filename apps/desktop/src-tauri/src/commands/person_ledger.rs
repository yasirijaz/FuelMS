use tauri::State;

use crate::db::AppDatabase;
use crate::dto::person_ledger::{
    CommandResultDto, PersonLedgerBalanceDto, PersonLedgerBalanceListQueryDto,
    PersonLedgerEntryDto, PersonLedgerEntryListQueryDto, RecordPersonBorrowInputDto,
    RecordPersonCollectLoanInputDto, RecordPersonLendInputDto, RecordPersonRepayBorrowedInputDto,
};
use crate::repositories::person_ledger_repository::PersonLedgerRepository;

#[tauri::command]
pub fn person_ledger_list_balances(
    db: State<'_, AppDatabase>,
    query: PersonLedgerBalanceListQueryDto,
) -> CommandResultDto<Vec<PersonLedgerBalanceDto>> {
    match db.with_connection(|conn| PersonLedgerRepository::new(conn).list_balances(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn person_ledger_list_entries(
    db: State<'_, AppDatabase>,
    query: PersonLedgerEntryListQueryDto,
) -> CommandResultDto<Vec<PersonLedgerEntryDto>> {
    match db.with_connection(|conn| PersonLedgerRepository::new(conn).list_entries(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn person_ledger_record_borrow(
    db: State<'_, AppDatabase>,
    input: RecordPersonBorrowInputDto,
) -> CommandResultDto<PersonLedgerEntryDto> {
    match db.with_connection(|conn| PersonLedgerRepository::new(conn).record_borrow(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn person_ledger_record_repay_borrowed(
    db: State<'_, AppDatabase>,
    input: RecordPersonRepayBorrowedInputDto,
) -> CommandResultDto<PersonLedgerEntryDto> {
    match db.with_connection(|conn| PersonLedgerRepository::new(conn).record_repay_borrowed(&input))
    {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn person_ledger_record_lend(
    db: State<'_, AppDatabase>,
    input: RecordPersonLendInputDto,
) -> CommandResultDto<PersonLedgerEntryDto> {
    match db.with_connection(|conn| PersonLedgerRepository::new(conn).record_lend(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn person_ledger_record_collect_loan(
    db: State<'_, AppDatabase>,
    input: RecordPersonCollectLoanInputDto,
) -> CommandResultDto<PersonLedgerEntryDto> {
    match db.with_connection(|conn| PersonLedgerRepository::new(conn).record_collect_loan(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
