use rusqlite::{params, Row};

use crate::db::connection::DbConnection;
use crate::dto::organization::{CommandErrorDto, WorkspaceDto};

pub const DEFAULT_WORKSPACE_ID: &str = "workspace-default";

pub struct WorkspaceRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> WorkspaceRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn map_row(row: &Row<'_>) -> rusqlite::Result<WorkspaceDto> {
        Ok(WorkspaceDto {
            id: row.get("id")?,
            name: row.get("name")?,
            active_organization_id: row.get("active_organization_id")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    pub fn ensure_default(&self) -> Result<WorkspaceDto, CommandErrorDto> {
        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        conn.execute(
            "INSERT OR IGNORE INTO workspaces (id, name, active_organization_id, created_at, updated_at, version)
             VALUES (?1, 'Default Workspace', NULL, ?2, ?2, 1)",
            params![DEFAULT_WORKSPACE_ID, now],
        )
        .map_err(|e| CommandErrorDto {
            code: "DB_INSERT_FAILED".to_string(),
            message: e.to_string(),
            kind: "infrastructure".to_string(),
        })?;

        self.get_default()
    }

    pub fn update_name(&self, name: &str, version: i64) -> Result<WorkspaceDto, CommandErrorDto> {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            return Err(CommandErrorDto {
                code: "WORKSPACE_NAME_REQUIRED".to_string(),
                message: "Workspace name is required.".to_string(),
                kind: "validation".to_string(),
            });
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE workspaces
                 SET name = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4",
                params![DEFAULT_WORKSPACE_ID, trimmed, now, version],
            )
            .map_err(|e| CommandErrorDto {
                code: "DB_UPDATE_FAILED".to_string(),
                message: e.to_string(),
                kind: "infrastructure".to_string(),
            })?;

        if updated == 0 {
            return Err(CommandErrorDto {
                code: "WORKSPACE_VERSION_CONFLICT".to_string(),
                message: "Workspace was modified by another process. Refresh and try again.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        self.get_default()
    }

    pub fn get_default(&self) -> Result<WorkspaceDto, CommandErrorDto> {
        let conn = self.db.conn();
        conn.query_row(
            "SELECT id, name, active_organization_id, updated_at, version
             FROM workspaces WHERE id = ?1",
            params![DEFAULT_WORKSPACE_ID],
            Self::map_row,
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => CommandErrorDto {
                code: "WORKSPACE_NOT_FOUND".to_string(),
                message: "Default workspace was not initialized.".to_string(),
                kind: "not-found".to_string(),
            },
            _ => CommandErrorDto {
                code: "DB_QUERY_FAILED".to_string(),
                message: e.to_string(),
                kind: "infrastructure".to_string(),
            },
        })
    }

    pub fn set_active_organization(
        &self,
        organization_id: Option<&str>,
        version: i64,
    ) -> Result<WorkspaceDto, CommandErrorDto> {
        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE workspaces
                 SET active_organization_id = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4",
                params![DEFAULT_WORKSPACE_ID, organization_id, now, version],
            )
            .map_err(|e| CommandErrorDto {
                code: "DB_UPDATE_FAILED".to_string(),
                message: e.to_string(),
                kind: "infrastructure".to_string(),
            })?;

        if updated == 0 {
            return Err(CommandErrorDto {
                code: "WORKSPACE_VERSION_CONFLICT".to_string(),
                message: "Workspace was modified by another process. Refresh and try again.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        self.get_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::connection::DbConnection;
    use crate::db::migrate::run_migrations;
    use crate::dto::organization::CreateOrganizationInputDto;
    use crate::repositories::OrganizationRepository;

    #[test]
    fn ensure_default_inserts_workspace_when_missing() {
        let db = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        db.conn()
            .execute_batch(
                "CREATE TABLE workspaces (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    active_organization_id TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    version INTEGER NOT NULL DEFAULT 1
                );",
            )
            .unwrap();

        let workspace_repo = WorkspaceRepository::new(&db);
        let workspace = workspace_repo.ensure_default().unwrap();
        assert_eq!(workspace.id, DEFAULT_WORKSPACE_ID);
        assert_eq!(workspace.name, "Default Workspace");
    }

    #[test]
    fn workspace_bootstrapped_and_active_org_can_be_set() {
        let db = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&db).unwrap();

        let workspace_repo = WorkspaceRepository::new(&db);
        let org_repo = OrganizationRepository::new(&db);

        let workspace = workspace_repo.get_default().unwrap();
        assert_eq!(workspace.id, DEFAULT_WORKSPACE_ID);
        assert!(workspace.active_organization_id.is_none());

        let org = org_repo
            .insert(&CreateOrganizationInputDto {
                name: "Pump One".to_string(),
                legal_name: None,
                address: None,
                city: None,
                phone: None,
                tax_id: None,
            })
            .unwrap();

        let updated = workspace_repo
            .set_active_organization(Some(&org.id), workspace.version)
            .unwrap();

        assert_eq!(updated.active_organization_id.as_deref(), Some(org.id.as_str()));
    }
}
