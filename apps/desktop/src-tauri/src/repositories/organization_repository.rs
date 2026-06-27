use rusqlite::{params, Row};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::organization::{
    CommandErrorDto, CreateOrganizationInputDto, OrganizationDto, UpdateOrganizationInputDto,
};

pub struct OrganizationRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> OrganizationRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn map_row(row: &Row<'_>) -> rusqlite::Result<OrganizationDto> {
        Ok(OrganizationDto {
            id: row.get("id")?,
            name: row.get("name")?,
            legal_name: row.get("legal_name")?,
            address: row.get("address")?,
            city: row.get("city")?,
            phone: row.get("phone")?,
            tax_id: row.get("tax_id")?,
            status: row.get("status")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    const SELECT_COLUMNS: &'static str = "id, name, legal_name, address, city, phone, tax_id, status, created_at, updated_at, version";

    pub fn list_all(&self) -> Result<Vec<OrganizationDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!(
            "SELECT {} FROM organizations ORDER BY name COLLATE NOCASE ASC",
            Self::SELECT_COLUMNS
        );
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map([], Self::map_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn list_active(&self) -> Result<Vec<OrganizationDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!(
            "SELECT {} FROM organizations WHERE status = 'active' ORDER BY name COLLATE NOCASE ASC",
            Self::SELECT_COLUMNS
        );
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map([], Self::map_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_by_id(&self, id: &str) -> Result<OrganizationDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!(
            "SELECT {} FROM organizations WHERE id = ?1",
            Self::SELECT_COLUMNS
        );
        conn.query_row(&sql, params![id], Self::map_row).map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => not_found("Organization", id),
            _ => db_error("DB_QUERY_FAILED", &e.to_string()),
        })
    }

    pub fn exists_active_by_name_excluding(
        &self,
        name: &str,
        exclude_id: Option<&str>,
    ) -> Result<bool, CommandErrorDto> {
        let conn = self.db.conn();
        let normalized = name.trim().to_lowercase();
        let sql = if exclude_id.is_some() {
            "SELECT COUNT(*) FROM organizations
             WHERE status = 'active' AND LOWER(TRIM(name)) = ?1 AND id != ?2"
        } else {
            "SELECT COUNT(*) FROM organizations
             WHERE status = 'active' AND LOWER(TRIM(name)) = ?1"
        };

        let count: i64 = if let Some(exclude) = exclude_id {
            conn.query_row(sql, params![normalized, exclude], |row| row.get(0))
        } else {
            conn.query_row(sql, params![normalized], |row| row.get(0))
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        Ok(count > 0)
    }

    pub fn insert(&self, input: &CreateOrganizationInputDto) -> Result<OrganizationDto, CommandErrorDto> {
        let conn = self.db.conn();
        let id = format!("org-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        conn.execute(
            "INSERT INTO organizations
             (id, name, legal_name, address, city, phone, tax_id, status, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'active', ?8, ?8, 1)",
            params![
                id,
                input.name.trim(),
                input.legal_name.as_deref().map(str::trim),
                input.address.as_deref().map(str::trim),
                input.city.as_deref().map(str::trim),
                input.phone.as_deref().map(str::trim),
                input.tax_id.as_deref().map(str::trim),
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        self.find_by_id(&id)
    }

    pub fn update(&self, input: &UpdateOrganizationInputDto) -> Result<OrganizationDto, CommandErrorDto> {
        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn.execute(
            "UPDATE organizations
             SET name = ?2,
                 legal_name = ?3,
                 address = ?4,
                 city = ?5,
                 phone = ?6,
                 tax_id = ?7,
                 updated_at = ?8,
                 version = version + 1
             WHERE id = ?1 AND version = ?9 AND status = 'active'",
            params![
                input.id,
                input.name.trim(),
                input.legal_name.as_deref().map(str::trim),
                input.address.as_deref().map(str::trim),
                input.city.as_deref().map(str::trim),
                input.phone.as_deref().map(str::trim),
                input.tax_id.as_deref().map(str::trim),
                now,
                input.version,
            ],
        )
        .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            let existing = self.find_by_id(&input.id).ok();
            if existing.as_ref().map(|o| o.status.as_str()) == Some("archived") {
                return Err(conflict(
                    "ORGANIZATION_ARCHIVED",
                    "Archived organizations cannot be updated.",
                ));
            }
            return Err(conflict(
                "ORGANIZATION_VERSION_CONFLICT",
                "Organization was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.id)
    }

    pub fn archive(&self, id: &str, version: i64) -> Result<OrganizationDto, CommandErrorDto> {
        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn.execute(
            "UPDATE organizations
             SET status = 'archived', updated_at = ?2, version = version + 1
             WHERE id = ?1 AND version = ?3 AND status = 'active'",
            params![id, now, version],
        )
        .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            let existing = self.find_by_id(id).ok();
            if existing.as_ref().map(|o| o.status.as_str()) == Some("archived") {
                return Err(conflict(
                    "ORGANIZATION_ALREADY_ARCHIVED",
                    "Organization is already archived.",
                ));
            }
            return Err(conflict(
                "ORGANIZATION_VERSION_CONFLICT",
                "Organization was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(id)
    }
}

fn db_error(code: &str, message: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.to_string(),
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

fn conflict(code: &str, message: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.to_string(),
        kind: "conflict".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::connection::DbConnection;
    use crate::db::migrate::run_migrations;

    fn setup() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn create_and_list_organizations() {
        let db = setup();
        let repo = OrganizationRepository::new(&db);

        let created = repo
            .insert(&CreateOrganizationInputDto {
                name: "Main Pump".to_string(),
                legal_name: Some("Main Pump Pvt Ltd".to_string()),
                address: None,
                city: Some("Lahore".to_string()),
                phone: None,
                tax_id: None,
            })
            .unwrap();

        assert_eq!(created.name, "Main Pump");
        assert_eq!(created.status, "active");

        let all = repo.list_all().unwrap();
        assert_eq!(all.len(), 1);
    }

    #[test]
    fn duplicate_active_name_rejected_at_repository_level_via_exists_check() {
        let db = setup();
        let repo = OrganizationRepository::new(&db);

        repo.insert(&CreateOrganizationInputDto {
            name: "Station A".to_string(),
            legal_name: None,
            address: None,
            city: None,
            phone: None,
            tax_id: None,
        })
        .unwrap();

        assert!(repo
            .exists_active_by_name_excluding("station a", None)
            .unwrap());
    }
}
