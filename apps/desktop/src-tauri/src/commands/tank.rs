use tauri::State;

use crate::db::AppDatabase;
use crate::dto::tank::{
    CommandResultDto, CreateFuelTankInputDto, FuelTankDto, RecordTankDipInputDto,
    TankDipReadingDto, TankVersionInputDto, UpdateFuelTankInputDto,
};
use crate::repositories::tank_repository::TankRepository;

#[tauri::command]
pub fn tank_list(
    db: State<'_, AppDatabase>,
    active_only: Option<bool>,
) -> CommandResultDto<Vec<FuelTankDto>> {
    match db.with_business(|conn| TankRepository::new(conn).list_all(active_only.unwrap_or(true)))
    {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_get_by_id(
    db: State<'_, AppDatabase>,
    tank_id: String,
) -> CommandResultDto<FuelTankDto> {
    match db.with_business(|conn| TankRepository::new(conn).find_by_id(&tank_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_create(
    db: State<'_, AppDatabase>,
    input: CreateFuelTankInputDto,
) -> CommandResultDto<FuelTankDto> {
    match db.with_business(|conn| TankRepository::new(conn).create(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_update(
    db: State<'_, AppDatabase>,
    input: UpdateFuelTankInputDto,
) -> CommandResultDto<FuelTankDto> {
    match db.with_business(|conn| TankRepository::new(conn).update(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_activate(
    db: State<'_, AppDatabase>,
    input: TankVersionInputDto,
) -> CommandResultDto<FuelTankDto> {
    match db.with_business(|conn| TankRepository::new(conn).set_active(&input, true)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_deactivate(
    db: State<'_, AppDatabase>,
    input: TankVersionInputDto,
) -> CommandResultDto<FuelTankDto> {
    match db.with_business(|conn| TankRepository::new(conn).set_active(&input, false)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_record_dip(
    db: State<'_, AppDatabase>,
    input: RecordTankDipInputDto,
) -> CommandResultDto<TankDipReadingDto> {
    match db.with_business(|conn| TankRepository::new(conn).record_dip(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn tank_list_dips(
    db: State<'_, AppDatabase>,
    tank_id: String,
    limit: Option<i64>,
) -> CommandResultDto<Vec<TankDipReadingDto>> {
    match db
        .with_business(|conn| TankRepository::new(conn).list_dips(&tank_id, limit.unwrap_or(20)))
    {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
