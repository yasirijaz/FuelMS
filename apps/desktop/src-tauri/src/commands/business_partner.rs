use tauri::State;

use crate::db::AppDatabase;
use crate::dto::business_partner::{
    AssignPartnerRoleInputDto, BusinessPartnerDto, BusinessPartnerListQueryDto,
    CommandResultDto, CreateBusinessPartnerInputDto, PartnerVersionInputDto,
    RemovePartnerRoleInputDto, UpdateBusinessPartnerInputDto,
};
use crate::repositories::business_partner_repository::BusinessPartnerRepository;

#[tauri::command]
pub fn business_partner_list(
    db: State<'_, AppDatabase>,
    query: BusinessPartnerListQueryDto,
) -> CommandResultDto<Vec<BusinessPartnerDto>> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).list(&query)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_get_by_id(
    db: State<'_, AppDatabase>,
    partner_id: String,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).find_by_id(&partner_id)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_create(
    db: State<'_, AppDatabase>,
    input: CreateBusinessPartnerInputDto,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).create(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_update(
    db: State<'_, AppDatabase>,
    input: UpdateBusinessPartnerInputDto,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).update(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_activate(
    db: State<'_, AppDatabase>,
    input: PartnerVersionInputDto,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).set_active(&input, true)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_deactivate(
    db: State<'_, AppDatabase>,
    input: PartnerVersionInputDto,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).set_active(&input, false)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_assign_role(
    db: State<'_, AppDatabase>,
    input: AssignPartnerRoleInputDto,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).assign_role(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn business_partner_remove_role(
    db: State<'_, AppDatabase>,
    input: RemovePartnerRoleInputDto,
) -> CommandResultDto<BusinessPartnerDto> {
    match db.with_connection(|conn| BusinessPartnerRepository::new(conn).remove_role(&input)) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
