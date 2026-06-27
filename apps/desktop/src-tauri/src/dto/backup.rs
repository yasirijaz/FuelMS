use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupManifestDto {
    pub backup_id: String,
    pub backup_path: String,
    pub app_version: String,
    pub schema_version: i64,
    pub created_at_iso: String,
    pub created_by: String,
    pub database_sha256: String,
    pub database_size_bytes: i64,
    pub file_count: i64,
    pub is_verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupVerifyResultDto {
    pub backup_id: String,
    pub is_valid: bool,
    pub schema_version: i64,
    pub database_sha256: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBackupInputDto {
    pub actor: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupInputDto {
    pub backup_id: String,
    pub actor: String,
    pub acknowledge_replace: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupResultDto {
    pub backup_id: String,
    pub restored_at_iso: String,
    pub schema_version: i64,
    pub safety_copy_path: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupAuditEventDto {
    pub id: String,
    pub event_type: String,
    pub status: String,
    pub backup_id: Option<String>,
    pub backup_path: Option<String>,
    pub schema_version: Option<i64>,
    pub database_sha256: Option<String>,
    pub message: Option<String>,
    pub actor: String,
    pub created_at_iso: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandErrorDto {
    pub code: String,
    pub message: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResultDto<T> {
    pub ok: bool,
    pub value: Option<T>,
    pub error: Option<CommandErrorDto>,
}

impl<T> CommandResultDto<T> {
    pub fn ok(value: T) -> Self {
        Self {
            ok: true,
            value: Some(value),
            error: None,
        }
    }
}
