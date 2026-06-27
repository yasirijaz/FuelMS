use rusqlite::{params, Row};

use crate::db::connection::DbConnection;
use crate::dto::accounting::{
    AccountingPeriodDto, AccountingPeriodVersionInputDto, CommandErrorDto,
};

pub struct AccountingPeriodRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> AccountingPeriodRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    const SELECT_SQL: &'static str =
        "SELECT id, period_key, period_type, start_date, end_date, status,
                closed_at, closed_by, created_at, updated_at, version
         FROM accounting_periods";

    fn map_row(row: &Row<'_>) -> rusqlite::Result<AccountingPeriodDto> {
        Ok(AccountingPeriodDto {
            id: row.get("id")?,
            period_key: row.get("period_key")?,
            period_type: row.get("period_type")?,
            start_date_iso: row.get("start_date")?,
            end_date_iso: row.get("end_date")?,
            status: row.get("status")?,
            closed_at_iso: row.get("closed_at")?,
            closed_by: row.get("closed_by")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    pub fn list(&self) -> Result<Vec<AccountingPeriodDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} ORDER BY start_date DESC", Self::SELECT_SQL);
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

    pub fn find_by_id(&self, id: &str) -> Result<AccountingPeriodDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE id = ?1", Self::SELECT_SQL);
        conn.query_row(&sql, params![id], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("AccountingPeriod", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    pub fn find_current(&self) -> Result<AccountingPeriodDto, CommandErrorDto> {
        let conn = self.db.conn();
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let sql = format!(
            "{} WHERE start_date <= ?1 AND end_date >= ?1 ORDER BY start_date DESC LIMIT 1",
            Self::SELECT_SQL
        );
        conn.query_row(&sql, params![today], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => conflict(
                    "NO_CURRENT_PERIOD",
                    "No accounting period covers today's date.",
                ),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    pub fn close_period(
        &self,
        input: &AccountingPeriodVersionInputDto,
    ) -> Result<AccountingPeriodDto, CommandErrorDto> {
        let conn = self.db.conn();
        let existing = self.find_by_id(&input.period_id)?;

        if existing.status == "closed" {
            return Err(conflict("ALREADY_CLOSED", "This period is already closed."));
        }
        if existing.version != input.version {
            return Err(conflict(
                "VERSION_CONFLICT",
                "Period was modified by another process. Refresh and try again.",
            ));
        }

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let updated = conn
            .execute(
                "UPDATE accounting_periods
                 SET status = 'closed', closed_at = ?1, closed_by = ?2,
                     updated_at = ?1, version = version + 1
                 WHERE id = ?3 AND version = ?4",
                params![now, input.actor.trim(), input.period_id, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "VERSION_CONFLICT",
                "Period was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.period_id)
    }

    pub fn reopen_period(
        &self,
        input: &AccountingPeriodVersionInputDto,
    ) -> Result<AccountingPeriodDto, CommandErrorDto> {
        let conn = self.db.conn();
        let existing = self.find_by_id(&input.period_id)?;

        if existing.status == "open" {
            return Err(conflict("ALREADY_OPEN", "This period is already open."));
        }
        if existing.version != input.version {
            return Err(conflict(
                "VERSION_CONFLICT",
                "Period was modified by another process. Refresh and try again.",
            ));
        }

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let updated = conn
            .execute(
                "UPDATE accounting_periods
                 SET status = 'open', closed_at = NULL, closed_by = NULL,
                     updated_at = ?1, version = version + 1
                 WHERE id = ?2 AND version = ?3",
                params![now, input.period_id, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "VERSION_CONFLICT",
                "Period was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.period_id)
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
        message: format!("{entity} not found: {id}"),
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

    fn test_db() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    #[test]
    fn close_and_reopen_period() {
        let db = test_db();
        let repo = AccountingPeriodRepository::new(&db);
        let current = repo.find_current().unwrap();
        assert_eq!(current.status, "open");

        let closed = repo
            .close_period(&AccountingPeriodVersionInputDto {
                period_id: current.id.clone(),
                version: current.version,
                actor: "owner".to_string(),
            })
            .unwrap();
        assert_eq!(closed.status, "closed");

        let reopened = repo
            .reopen_period(&AccountingPeriodVersionInputDto {
                period_id: closed.id,
                version: closed.version,
                actor: "owner".to_string(),
            })
            .unwrap();
        assert_eq!(reopened.status, "open");
    }
}
