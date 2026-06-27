use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use rusqlite::params;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::db::migrate::{current_schema_version, max_supported_schema_version};
use crate::db::AppDatabase;
use crate::dto::backup::{
    BackupAuditEventDto, BackupManifestDto, BackupVerifyResultDto, CommandErrorDto,
    CreateBackupInputDto, RestoreBackupInputDto, RestoreBackupResultDto,
};

const BACKUP_SUFFIX: &str = ".fuelms-backup";
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupManifestFile {
    backup_id: String,
    app_version: String,
    schema_version: i64,
    created_at: String,
    created_by: String,
    database_sha256: String,
    database_size_bytes: i64,
    file_count: i64,
    notes: Option<String>,
}

pub struct BackupService;

impl BackupService {
    pub fn create_backup(
        db: &AppDatabase,
        backups_dir: &Path,
        input: &CreateBackupInputDto,
    ) -> Result<BackupManifestDto, CommandErrorDto> {
        let backup_id = format!(
            "backup-{}",
            chrono::Utc::now().format("%Y-%m-%dT%H-%M-%SZ")
        );
        let backup_id_for_audit = backup_id.clone();
        let tmp_dir = backups_dir.join(format!("{backup_id}{BACKUP_SUFFIX}.tmp"));
        let final_dir = backups_dir.join(format!("{backup_id}{BACKUP_SUFFIX}"));
        let db_snapshot = tmp_dir.join("fuelms.sqlite3");

        if tmp_dir.exists() {
            fs::remove_dir_all(&tmp_dir).map_err(|e| io_error("Failed to reset temp backup dir", e))?;
        }
        fs::create_dir_all(&tmp_dir).map_err(|e| io_error("Failed to create temp backup dir", e))?;

        let result = (|| {
            db.with_connection(|conn| {
                conn.conn()
                    .execute(
                        "VACUUM INTO ?1",
                        params![db_snapshot.to_string_lossy().to_string()],
                    )
                    .map_err(|e| db_error("VACUUM_INTO_FAILED", &e.to_string()))
            })?;

            Self::assert_integrity(&db_snapshot)?;
            let database_sha256 = Self::sha256_file(&db_snapshot)?;
            let database_size_bytes = fs::metadata(&db_snapshot)
                .map_err(|e| io_error("Failed to stat backup database", e))?
                .len() as i64;
            let schema_version = Self::schema_version_of_file(&db_snapshot)?;

            let manifest = BackupManifestFile {
                backup_id: backup_id.clone(),
                app_version: APP_VERSION.to_string(),
                schema_version,
                created_at: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
                created_by: input.actor.trim().to_string(),
                database_sha256: database_sha256.clone(),
                database_size_bytes,
                file_count: 0,
                notes: input.notes.as_deref().map(str::trim).map(str::to_string),
            };

            let manifest_path = tmp_dir.join("manifest.json");
            let json = serde_json::to_string_pretty(&manifest)
                .map_err(|e| io_error("Failed to serialize manifest", e))?;
            fs::write(&manifest_path, json).map_err(|e| io_error("Failed to write manifest", e))?;

            if final_dir.exists() {
                return Err(conflict("BACKUP_EXISTS", "A backup with this id already exists."));
            }
            fs::rename(&tmp_dir, &final_dir)
                .map_err(|e| io_error("Failed to finalize backup directory", e))?;

            Self::record_audit(
                db,
                "backup",
                "completed",
                Some(&backup_id),
                Some(final_dir.to_string_lossy().as_ref()),
                Some(schema_version),
                Some(&database_sha256),
                None,
                &input.actor,
            )?;

            Ok(BackupManifestDto {
                backup_id,
                backup_path: final_dir.to_string_lossy().to_string(),
                app_version: APP_VERSION.to_string(),
                schema_version,
                created_at_iso: manifest.created_at,
                created_by: input.actor.trim().to_string(),
                database_sha256,
                database_size_bytes,
                file_count: 0,
                is_verified: true,
            })
        })();

        if result.is_err() && tmp_dir.exists() {
            let _ = fs::remove_dir_all(&tmp_dir);
            let _ = Self::record_audit(
                db,
                "backup",
                "failed",
                Some(&backup_id_for_audit),
                None,
                None,
                None,
                result.as_ref().err().map(|e| e.message.clone()),
                &input.actor,
            );
        }

        result
    }

    pub fn list_backups(backups_dir: &Path) -> Result<Vec<BackupManifestDto>, CommandErrorDto> {
        if !backups_dir.exists() {
            return Ok(Vec::new());
        }

        let mut manifests = Vec::new();
        for entry in fs::read_dir(backups_dir).map_err(|e| io_error("Failed to read backups dir", e))? {
            let entry = entry.map_err(|e| io_error("Failed to read backup entry", e))?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default();
            if !name.ends_with(BACKUP_SUFFIX) {
                continue;
            }
            if let Ok(manifest) = Self::read_manifest_dir(&path) {
                manifests.push(manifest);
            }
        }

        manifests.sort_by(|a, b| b.created_at_iso.cmp(&a.created_at_iso));
        Ok(manifests)
    }

    pub fn verify_backup(backups_dir: &Path, backup_id: &str) -> Result<BackupVerifyResultDto, CommandErrorDto> {
        let dir = Self::backup_dir(backups_dir, backup_id)?;
        let manifest = Self::read_manifest_file(&dir)?;
        let db_path = dir.join("fuelms.sqlite3");

        if !db_path.exists() {
            return Ok(BackupVerifyResultDto {
                backup_id: backup_id.to_string(),
                is_valid: false,
                schema_version: manifest.schema_version,
                database_sha256: manifest.database_sha256,
                message: "Backup database file is missing.".to_string(),
            });
        }

        let actual_hash = Self::sha256_file(&db_path)?;
        if actual_hash != manifest.database_sha256 {
            return Ok(BackupVerifyResultDto {
                backup_id: backup_id.to_string(),
                is_valid: false,
                schema_version: manifest.schema_version,
                database_sha256: actual_hash,
                message: "Backup checksum does not match manifest.".to_string(),
            });
        }

        Self::assert_integrity(&db_path)?;
        if manifest.schema_version > max_supported_schema_version() {
            return Ok(BackupVerifyResultDto {
                backup_id: backup_id.to_string(),
                is_valid: false,
                schema_version: manifest.schema_version,
                database_sha256: actual_hash,
                message: "Backup schema version is newer than this application supports.".to_string(),
            });
        }

        Ok(BackupVerifyResultDto {
            backup_id: backup_id.to_string(),
            is_valid: true,
            schema_version: manifest.schema_version,
            database_sha256: actual_hash,
            message: "Backup verified successfully.".to_string(),
        })
    }

    pub fn restore_backup(
        db: &AppDatabase,
        backups_dir: &Path,
        input: &RestoreBackupInputDto,
    ) -> Result<RestoreBackupResultDto, CommandErrorDto> {
        if !input.acknowledge_replace {
            return Err(conflict(
                "RESTORE_NOT_ACKNOWLEDGED",
                "Restore requires explicit acknowledgement that current data will be replaced.",
            ));
        }

        let verify = Self::verify_backup(backups_dir, &input.backup_id)?;
        if !verify.is_valid {
            return Err(conflict("INVALID_BACKUP", verify.message));
        }

        let dir = Self::backup_dir(backups_dir, &input.backup_id)?;
        let backup_db = dir.join("fuelms.sqlite3");
        let live_db = db.path().to_path_buf();

        let safety_name = format!(
            "pre-restore-{}.sqlite3",
            chrono::Utc::now().format("%Y-%m-%dT%H-%M-%SZ")
        );
        let safety_copy = backups_dir.join(safety_name);

        db.close_connection();

        let restore_result: Result<(), CommandErrorDto> = (|| {
            fs::copy(&live_db, &safety_copy)
                .map_err(|e| io_error("Failed to create pre-restore safety copy", e))?;
            Self::remove_wal_shm(&live_db);
            fs::copy(&backup_db, &live_db)
                .map_err(|e| io_error("Failed to replace live database with backup", e))?;
            db.reopen_connection()
                .map_err(|e| db_error("DB_REOPEN_FAILED", &e))?;
            Ok(())
        })();

        if let Err(err) = restore_result {
            let _ = db.reopen_connection();
            let _ = Self::record_audit(
                db,
                "restore",
                "failed",
                Some(&input.backup_id),
                Some(dir.to_string_lossy().as_ref()),
                Some(verify.schema_version),
                Some(&verify.database_sha256),
                Some(err.message.clone()),
                &input.actor,
            );
            return Err(err);
        }

        let restored_at = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        Self::record_audit(
            db,
            "restore",
            "completed",
            Some(&input.backup_id),
            Some(dir.to_string_lossy().as_ref()),
            Some(verify.schema_version),
            Some(&verify.database_sha256),
            Some("Database restored from verified backup.".to_string()),
            &input.actor,
        )?;

        Ok(RestoreBackupResultDto {
            backup_id: input.backup_id.clone(),
            restored_at_iso: restored_at,
            schema_version: verify.schema_version,
            safety_copy_path: safety_copy.to_string_lossy().to_string(),
            message: "Restore completed. All data now reflects the backup point.".to_string(),
        })
    }

    pub fn list_audit_events(db: &AppDatabase, limit: i64) -> Result<Vec<BackupAuditEventDto>, CommandErrorDto> {
        db.with_connection(|conn| {
            let conn = conn.conn();
            let mut stmt = conn
                .prepare(
                    "SELECT id, event_type, status, backup_id, backup_path, schema_version,
                            database_sha256, message, actor, created_at
                     FROM backup_audit_events
                     ORDER BY created_at DESC
                     LIMIT ?1",
                )
                .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

            let rows = stmt
                .query_map(params![limit.max(1)], |row| {
                    Ok(BackupAuditEventDto {
                        id: row.get(0)?,
                        event_type: row.get(1)?,
                        status: row.get(2)?,
                        backup_id: row.get(3)?,
                        backup_path: row.get(4)?,
                        schema_version: row.get(5)?,
                        database_sha256: row.get(6)?,
                        message: row.get(7)?,
                        actor: row.get(8)?,
                        created_at_iso: row.get(9)?,
                    })
                })
                .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

            Ok(rows)
        })
    }

    fn backup_dir(backups_dir: &Path, backup_id: &str) -> Result<PathBuf, CommandErrorDto> {
        let dir = backups_dir.join(format!("{backup_id}{BACKUP_SUFFIX}"));
        if !dir.is_dir() {
            return Err(not_found("Backup", backup_id));
        }
        Ok(dir)
    }

    fn read_manifest_dir(dir: &Path) -> Result<BackupManifestDto, CommandErrorDto> {
        let manifest = Self::read_manifest_file(dir)?;
        let db_path = dir.join("fuelms.sqlite3");
        let is_verified = if db_path.exists() {
            Self::sha256_file(&db_path)
                .map(|hash| hash == manifest.database_sha256)
                .unwrap_or(false)
                && Self::assert_integrity(&db_path).is_ok()
        } else {
            false
        };

        Ok(BackupManifestDto {
            backup_id: manifest.backup_id,
            backup_path: dir.to_string_lossy().to_string(),
            app_version: manifest.app_version,
            schema_version: manifest.schema_version,
            created_at_iso: manifest.created_at,
            created_by: manifest.created_by,
            database_sha256: manifest.database_sha256,
            database_size_bytes: manifest.database_size_bytes,
            file_count: manifest.file_count,
            is_verified,
        })
    }

    fn read_manifest_file(dir: &Path) -> Result<BackupManifestFile, CommandErrorDto> {
        let manifest_path = dir.join("manifest.json");
        let raw = fs::read_to_string(&manifest_path)
            .map_err(|e| io_error("Failed to read backup manifest", e))?;
        serde_json::from_str(&raw).map_err(|e| conflict("INVALID_MANIFEST", e.to_string()))
    }

    fn schema_version_of_file(path: &Path) -> Result<i64, CommandErrorDto> {
        let conn = DbConnection::open(path).map_err(|e| db_error("DB_OPEN_FAILED", &e))?;
        current_schema_version(&conn).map_err(|e| db_error("SCHEMA_READ_FAILED", &e))
    }

    fn assert_integrity(path: &Path) -> Result<(), CommandErrorDto> {
        let conn = DbConnection::open(path).map_err(|e| db_error("DB_OPEN_FAILED", &e))?;
        let result: String = conn
            .conn()
            .query_row("PRAGMA integrity_check", [], |row| row.get(0))
            .map_err(|e| db_error("INTEGRITY_CHECK_FAILED", &e.to_string()))?;
        if result.to_lowercase() != "ok" {
            return Err(conflict(
                "INTEGRITY_CHECK_FAILED",
                format!("Database integrity check failed: {result}"),
            ));
        }
        Ok(())
    }

    fn sha256_file(path: &Path) -> Result<String, CommandErrorDto> {
        let mut file = fs::File::open(path).map_err(|e| io_error("Failed to open file for hash", e))?;
        let mut hasher = Sha256::new();
        let mut buffer = [0_u8; 8192];
        loop {
            let read = file
                .read(&mut buffer)
                .map_err(|e| io_error("Failed to read file for hash", e))?;
            if read == 0 {
                break;
            }
            hasher.update(&buffer[..read]);
        }
        Ok(hex::encode(hasher.finalize()))
    }

    fn remove_wal_shm(db_path: &Path) {
        let base = db_path.to_string_lossy();
        let _ = fs::remove_file(format!("{base}-wal"));
        let _ = fs::remove_file(format!("{base}-shm"));
    }

    fn record_audit(
        db: &AppDatabase,
        event_type: &str,
        status: &str,
        backup_id: Option<&str>,
        backup_path: Option<&str>,
        schema_version: Option<i64>,
        database_sha256: Option<&str>,
        message: Option<String>,
        actor: &str,
    ) -> Result<(), CommandErrorDto> {
        db.with_connection(|conn| {
            let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
            conn.conn()
                .execute(
                    "INSERT INTO backup_audit_events
                     (id, event_type, status, backup_id, backup_path, schema_version,
                      database_sha256, message, actor, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                    params![
                        format!("bae-{}", Uuid::new_v4()),
                        event_type,
                        status,
                        backup_id,
                        backup_path,
                        schema_version,
                        database_sha256,
                        message,
                        actor.trim(),
                        now,
                    ],
                )
                .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;
            Ok(())
        })
    }
}

fn db_error(code: &str, message: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.to_string(),
        kind: "infrastructure".to_string(),
    }
}

fn io_error(message: impl Into<String>, source: impl std::fmt::Display) -> CommandErrorDto {
    CommandErrorDto {
        code: "IO_ERROR".to_string(),
        message: format!("{}: {source}", message.into()),
        kind: "infrastructure".to_string(),
    }
}

fn not_found(entity: &str, id: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: "NOT_FOUND".to_string(),
        message: format!("{entity} '{id}' was not found."),
        kind: "not-found".to_string(),
    }
}

fn conflict(code: &str, message: impl Into<String>) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.into(),
        kind: "conflict".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_root() -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("fuelms-backup-test-{nanos}"))
    }

    #[test]
    fn create_and_verify_backup() {
        let root = temp_root();
        fs::create_dir_all(&root).unwrap();
        let db_path = root.join("fuelms.sqlite3");
        let backups_dir = root.join("backups");
        fs::create_dir_all(&backups_dir).unwrap();

        let db = AppDatabase::connect(db_path).unwrap();

        let manifest = BackupService::create_backup(
            &db,
            &backups_dir,
            &CreateBackupInputDto {
                actor: "owner".to_string(),
                notes: Some("Test backup".to_string()),
            },
        )
        .unwrap();

        assert!(manifest.is_verified);
        assert!(manifest.schema_version >= 12);

        let verify = BackupService::verify_backup(&backups_dir, &manifest.backup_id).unwrap();
        assert!(verify.is_valid);

        let listed = BackupService::list_backups(&backups_dir).unwrap();
        assert_eq!(listed.len(), 1);

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn restore_replaces_database_state() {
        let root = temp_root();
        fs::create_dir_all(&root).unwrap();
        let db_path = root.join("fuelms.sqlite3");
        let backups_dir = root.join("backups");
        fs::create_dir_all(&backups_dir).unwrap();

        let db = AppDatabase::connect(db_path.clone()).unwrap();

        let manifest = BackupService::create_backup(
            &db,
            &backups_dir,
            &CreateBackupInputDto {
                actor: "owner".to_string(),
                notes: None,
            },
        )
        .unwrap();

        db.with_connection(|conn| {
            conn.conn()
                .execute(
                    "INSERT INTO business_partners (id, display_name, created_at, updated_at)
                     VALUES ('bp-restore', 'After Backup', datetime('now'), datetime('now'))",
                    [],
                )
                .map_err(|e| e.to_string())?;
            Ok::<(), String>(())
        })
        .unwrap();

        BackupService::restore_backup(
            &db,
            &backups_dir,
            &RestoreBackupInputDto {
                backup_id: manifest.backup_id.clone(),
                actor: "owner".to_string(),
                acknowledge_replace: true,
            },
        )
        .unwrap();

        let count: i64 = db
            .with_connection(|conn| {
                conn.conn()
                    .query_row(
                        "SELECT COUNT(*) FROM business_partners WHERE id = 'bp-restore'",
                        [],
                        |row| row.get(0),
                    )
                    .map_err(|e| e.to_string())
            })
            .unwrap();
        assert_eq!(count, 0);

        let _ = fs::remove_dir_all(root);
    }
}
