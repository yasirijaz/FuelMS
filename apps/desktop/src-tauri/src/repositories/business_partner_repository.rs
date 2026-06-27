use rusqlite::{params, Row};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::business_partner::{
    AssignPartnerRoleInputDto, BusinessPartnerDto, BusinessPartnerListQueryDto, CommandErrorDto,
    CreateBusinessPartnerInputDto, PartnerVersionInputDto, RemovePartnerRoleInputDto,
    UpdateBusinessPartnerInputDto,
};

const VALID_ROLES: [&str; 5] = ["customer", "supplier", "employee", "owner", "other"];

pub struct BusinessPartnerRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> BusinessPartnerRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn is_valid_role(role: &str) -> bool {
        VALID_ROLES.contains(&role)
    }

    fn load_roles(&self, partner_id: &str) -> Result<Vec<String>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT role_code FROM partner_roles WHERE partner_id = ?1 ORDER BY role_code ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map(params![partner_id], |row| row.get::<_, String>(0))
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    fn map_partner_row(row: &Row<'_>) -> rusqlite::Result<(String, BusinessPartnerDto)> {
        let id: String = row.get("id")?;
        Ok((
            id.clone(),
            BusinessPartnerDto {
                id,
                display_name: row.get("display_name")?,
                legal_name: row.get("legal_name")?,
                phone: row.get("phone")?,
                email: row.get("email")?,
                tax_id: row.get("tax_id")?,
                address: row.get("address")?,
                notes: row.get("notes")?,
                is_active: row.get::<_, i64>("is_active")? == 1,
                roles: Vec::new(),
                created_at_iso: row.get("created_at")?,
                updated_at_iso: row.get("updated_at")?,
                version: row.get("version")?,
            },
        ))
    }

    fn attach_roles(
        &self,
        mut partner: BusinessPartnerDto,
    ) -> Result<BusinessPartnerDto, CommandErrorDto> {
        partner.roles = self.load_roles(&partner.id)?;
        Ok(partner)
    }

    pub fn list(
        &self,
        query: &BusinessPartnerListQueryDto,
    ) -> Result<Vec<BusinessPartnerDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = String::from(
            "SELECT DISTINCT bp.id, bp.display_name, bp.legal_name, bp.phone, bp.email, bp.tax_id,
                    bp.address, bp.notes, bp.is_active, bp.created_at, bp.updated_at, bp.version
             FROM business_partners bp",
        );

        let mut conditions = vec!["bp.deleted_at IS NULL".to_string()];

        if query.role_code.is_some() {
            sql.push_str(" INNER JOIN partner_roles pr ON pr.partner_id = bp.id");
            conditions.push("pr.role_code = ?".to_string());
        }

        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            conditions.push(
                "(LOWER(bp.display_name) LIKE ? OR LOWER(COALESCE(bp.phone, '')) LIKE ?
                  OR LOWER(COALESCE(bp.tax_id, '')) LIKE ?)"
                    .to_string(),
            );
        }

        if query.active_only.unwrap_or(false) {
            conditions.push("bp.is_active = 1".to_string());
        }

        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
        sql.push_str(" ORDER BY bp.display_name COLLATE NOCASE ASC");

        let search_pattern = query
            .search
            .as_ref()
            .map(|s| format!("%{}%", s.trim().to_lowercase()))
            .unwrap_or_default();

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let partials: Vec<BusinessPartnerDto> = if query.role_code.is_some()
            && query.search.as_ref().is_some_and(|s| !s.trim().is_empty())
        {
            stmt.query_map(
                params![
                    query.role_code.as_ref().unwrap(),
                    search_pattern,
                    search_pattern,
                    search_pattern
                ],
                Self::map_partner_row,
            )
        } else if query.role_code.is_some() {
            stmt.query_map(
                params![query.role_code.as_ref().unwrap()],
                Self::map_partner_row,
            )
        } else if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            stmt.query_map(
                params![search_pattern, search_pattern, search_pattern],
                Self::map_partner_row,
            )
        } else {
            stmt.query_map([], Self::map_partner_row)
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
        .filter_map(|row| row.ok().map(|(_, partner)| partner))
        .collect();

        partials
            .into_iter()
            .map(|partner| self.attach_roles(partner))
            .collect()
    }

    pub fn find_by_id(&self, id: &str) -> Result<BusinessPartnerDto, CommandErrorDto> {
        let conn = self.db.conn();
        let partner = conn
            .query_row(
                "SELECT id, display_name, legal_name, phone, email, tax_id, address, notes,
                        is_active, created_at, updated_at, version
                 FROM business_partners
                 WHERE id = ?1 AND deleted_at IS NULL",
                params![id],
                |row| Self::map_partner_row(row).map(|(_, partner)| partner),
            )
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("BusinessPartner", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })?;

        self.attach_roles(partner)
    }

    pub fn create(
        &self,
        input: &CreateBusinessPartnerInputDto,
    ) -> Result<BusinessPartnerDto, CommandErrorDto> {
        let display_name = input.display_name.trim();
        if display_name.is_empty() {
            return Err(conflict(
                "PARTNER_NAME_REQUIRED",
                "Display name is required.",
            ));
        }

        if input.roles.is_empty() {
            return Err(conflict(
                "PARTNER_ROLE_REQUIRED",
                "At least one role is required for a new partner.",
            ));
        }

        for role in &input.roles {
            if !Self::is_valid_role(role) {
                return Err(conflict("INVALID_ROLE", format!("Invalid role: {role}")));
            }
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let id = format!("bp-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        tx.execute(
            "INSERT INTO business_partners
             (id, display_name, legal_name, phone, email, tax_id, address, notes,
              is_active, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9, ?9, 1)",
            params![
                id,
                display_name,
                input.legal_name.as_deref().map(str::trim),
                input.phone.as_deref().map(str::trim),
                input.email.as_deref().map(str::trim),
                input.tax_id.as_deref().map(str::trim),
                input.address.as_deref().map(str::trim),
                input.notes.as_deref().map(str::trim),
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        for role in &input.roles {
            let role_id = format!("pr-{}", Uuid::new_v4());
            tx.execute(
                "INSERT INTO partner_roles (id, partner_id, role_code, assigned_at, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?4, ?4)",
                params![role_id, id, role, now],
            )
            .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&id)
    }

    pub fn update(
        &self,
        input: &UpdateBusinessPartnerInputDto,
    ) -> Result<BusinessPartnerDto, CommandErrorDto> {
        let display_name = input.display_name.trim();
        if display_name.is_empty() {
            return Err(conflict(
                "PARTNER_NAME_REQUIRED",
                "Display name is required.",
            ));
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE business_partners
                 SET display_name = ?2, legal_name = ?3, phone = ?4, email = ?5,
                     tax_id = ?6, address = ?7, notes = ?8, updated_at = ?9, version = version + 1
                 WHERE id = ?1 AND version = ?10 AND deleted_at IS NULL",
                params![
                    input.id,
                    display_name,
                    input.legal_name.as_deref().map(str::trim),
                    input.phone.as_deref().map(str::trim),
                    input.email.as_deref().map(str::trim),
                    input.tax_id.as_deref().map(str::trim),
                    input.address.as_deref().map(str::trim),
                    input.notes.as_deref().map(str::trim),
                    now,
                    input.version,
                ],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "PARTNER_VERSION_CONFLICT",
                "Partner was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.id)
    }

    pub fn set_active(
        &self,
        input: &PartnerVersionInputDto,
        active: bool,
    ) -> Result<BusinessPartnerDto, CommandErrorDto> {
        if active {
            let partner = self.find_by_id(&input.partner_id)?;
            if partner.roles.is_empty() {
                return Err(conflict(
                    "PARTNER_ROLE_REQUIRED",
                    "An active partner must have at least one role.",
                ));
            }
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let flag: i64 = if active { 1 } else { 0 };

        let updated = conn
            .execute(
                "UPDATE business_partners
                 SET is_active = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4 AND deleted_at IS NULL",
                params![input.partner_id, flag, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "PARTNER_VERSION_CONFLICT",
                "Partner was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.partner_id)
    }

    pub fn assign_role(
        &self,
        input: &AssignPartnerRoleInputDto,
    ) -> Result<BusinessPartnerDto, CommandErrorDto> {
        if !Self::is_valid_role(&input.role_code) {
            return Err(conflict("INVALID_ROLE", "Invalid role code."));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let role_id = format!("pr-{}", Uuid::new_v4());

        let inserted = tx
            .execute(
                "INSERT OR IGNORE INTO partner_roles
                 (id, partner_id, role_code, assigned_at, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?4, ?4)",
                params![role_id, input.partner_id, input.role_code, now],
            )
            .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        if inserted == 0 {
            return Err(conflict(
                "ROLE_ALREADY_ASSIGNED",
                "This partner already has that role.",
            ));
        }

        let updated = tx
            .execute(
                "UPDATE business_partners
                 SET updated_at = ?2, version = version + 1
                 WHERE id = ?1 AND version = ?3 AND deleted_at IS NULL",
                params![input.partner_id, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "PARTNER_VERSION_CONFLICT",
                "Partner was modified by another process. Refresh and try again.",
            ));
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&input.partner_id)
    }

    pub fn remove_role(
        &self,
        input: &RemovePartnerRoleInputDto,
    ) -> Result<BusinessPartnerDto, CommandErrorDto> {
        let partner = self.find_by_id(&input.partner_id)?;
        if partner.is_active && partner.roles.len() <= 1 {
            return Err(conflict(
                "LAST_ROLE",
                "Cannot remove the last role from an active partner.",
            ));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let deleted = tx
            .execute(
                "DELETE FROM partner_roles WHERE partner_id = ?1 AND role_code = ?2",
                params![input.partner_id, input.role_code],
            )
            .map_err(|e| db_error("DB_DELETE_FAILED", &e.to_string()))?;

        if deleted == 0 {
            return Err(not_found("PartnerRole", &input.role_code));
        }

        let updated = tx
            .execute(
                "UPDATE business_partners
                 SET updated_at = ?2, version = version + 1
                 WHERE id = ?1 AND version = ?3 AND deleted_at IS NULL",
                params![input.partner_id, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "PARTNER_VERSION_CONFLICT",
                "Partner was modified by another process. Refresh and try again.",
            ));
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&input.partner_id)
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
    use crate::db::connection::DbConnection;
    use crate::db::migrate::run_migrations;

    fn setup() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn create_partner_with_roles() {
        let db = setup();
        let repo = BusinessPartnerRepository::new(&db);

        let created = repo
            .create(&CreateBusinessPartnerInputDto {
                display_name: "National Oil Co.".to_string(),
                legal_name: None,
                phone: Some("03001234567".to_string()),
                email: None,
                tax_id: None,
                address: None,
                notes: None,
                roles: vec!["supplier".to_string()],
            })
            .unwrap();

        assert_eq!(created.display_name, "National Oil Co.");
        assert_eq!(created.roles, vec!["supplier".to_string()]);
    }
}
