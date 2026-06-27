use tauri::{AppHandle, State};

use crate::db::{backups_directory, AppDatabase};
use crate::dto::backup::{
    BackupAuditEventDto, BackupManifestDto, BackupVerifyResultDto, CommandResultDto,
    CreateBackupInputDto, RestoreBackupInputDto, RestoreBackupResultDto,
};
use crate::services::backup_service::BackupService;

#[tauri::command]
pub fn backup_create(
    app: AppHandle,
    db: State<'_, AppDatabase>,
    input: CreateBackupInputDto,
) -> CommandResultDto<BackupManifestDto> {
    let backups_dir = match backups_directory(&app) {
        Ok(dir) => dir,
        Err(message) => {
            return CommandResultDto {
                ok: false,
                value: None,
                error: Some(infra_error("BACKUP_PATH_FAILED", message)),
            };
        }
    };

    match BackupService::create_backup(&db, &backups_dir, &input) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn backup_list(app: AppHandle) -> CommandResultDto<Vec<BackupManifestDto>> {
    let backups_dir = match backups_directory(&app) {
        Ok(dir) => dir,
        Err(message) => {
            return CommandResultDto {
                ok: false,
                value: None,
                error: Some(infra_error("BACKUP_PATH_FAILED", message)),
            };
        }
    };

    match BackupService::list_backups(&backups_dir) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn backup_verify(app: AppHandle, backup_id: String) -> CommandResultDto<BackupVerifyResultDto> {
    let backups_dir = match backups_directory(&app) {
        Ok(dir) => dir,
        Err(message) => {
            return CommandResultDto {
                ok: false,
                value: None,
                error: Some(infra_error("BACKUP_PATH_FAILED", message)),
            };
        }
    };

    match BackupService::verify_backup(&backups_dir, &backup_id) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn backup_restore(
    app: AppHandle,
    db: State<'_, AppDatabase>,
    input: RestoreBackupInputDto,
) -> CommandResultDto<RestoreBackupResultDto> {
    let backups_dir = match backups_directory(&app) {
        Ok(dir) => dir,
        Err(message) => {
            return CommandResultDto {
                ok: false,
                value: None,
                error: Some(infra_error("BACKUP_PATH_FAILED", message)),
            };
        }
    };

    match BackupService::restore_backup(&db, &backups_dir, &input) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn backup_list_audit_events(
    db: State<'_, AppDatabase>,
    limit: Option<i64>,
) -> CommandResultDto<Vec<BackupAuditEventDto>> {
    match BackupService::list_audit_events(&db, limit.unwrap_or(20)) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn backup_get_storage_path(app: AppHandle) -> CommandResultDto<String> {
    match backups_directory(&app) {
        Ok(path) => CommandResultDto::ok(path.to_string_lossy().to_string()),
        Err(message) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(infra_error("BACKUP_PATH_FAILED", message)),
        },
    }
}

fn infra_error(code: &str, message: String) -> crate::dto::backup::CommandErrorDto {
    crate::dto::backup::CommandErrorDto {
        code: code.to_string(),
        message,
        kind: "infrastructure".to_string(),
    }
}
