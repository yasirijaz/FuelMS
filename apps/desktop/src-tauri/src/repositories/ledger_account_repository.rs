use rusqlite::{params, Row};

use crate::db::connection::DbConnection;
use crate::dto::accounting::{CommandErrorDto, LedgerAccountDto};

pub struct LedgerAccountRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> LedgerAccountRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    const SELECT_WITH_BALANCE: &'static str =
        "SELECT la.id, la.code, la.name, la.account_type, la.parent_id,
                la.is_system, la.is_active, la.normal_balance, la.display_order, la.notes,
                la.created_at, la.updated_at, la.version,
                CASE la.normal_balance
                  WHEN 'debit' THEN COALESCE(SUM(jl.debit_minor), 0) - COALESCE(SUM(jl.credit_minor), 0)
                  ELSE COALESCE(SUM(jl.credit_minor), 0) - COALESCE(SUM(jl.debit_minor), 0)
                END AS balance_minor
         FROM ledger_accounts la
         LEFT JOIN journal_lines jl ON jl.account_id = la.id
         LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.posting_status = 'posted'";

    fn map_row(row: &Row<'_>) -> rusqlite::Result<LedgerAccountDto> {
        Ok(LedgerAccountDto {
            id: row.get("id")?,
            code: row.get("code")?,
            name: row.get("name")?,
            account_type: row.get("account_type")?,
            parent_id: row.get("parent_id")?,
            is_system: row.get::<_, i64>("is_system")? != 0,
            is_active: row.get::<_, i64>("is_active")? != 0,
            normal_balance: row.get("normal_balance")?,
            display_order: row.get("display_order")?,
            notes: row.get("notes")?,
            balance_minor: row.get("balance_minor")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    pub fn list(&self, active_only: bool) -> Result<Vec<LedgerAccountDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = Self::SELECT_WITH_BALANCE.to_string();
        if active_only {
            sql.push_str(" WHERE la.is_active = 1");
        }
        sql.push_str(" GROUP BY la.id ORDER BY la.display_order ASC, la.code ASC");

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

    pub fn find_by_id(&self, id: &str) -> Result<LedgerAccountDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!(
            "{} WHERE la.id = ?1 GROUP BY la.id",
            Self::SELECT_WITH_BALANCE
        );
        conn.query_row(&sql, params![id], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("LedgerAccount", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    #[cfg_attr(not(test), allow(dead_code))]
    pub fn find_by_code(&self, code: &str) -> Result<LedgerAccountDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!(
            "{} WHERE la.code = ?1 GROUP BY la.id",
            Self::SELECT_WITH_BALANCE
        );
        conn.query_row(&sql, params![code], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("LedgerAccount", code),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
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

fn not_found(entity: &str, id: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: "NOT_FOUND".to_string(),
        message: format!("{entity} not found: {id}"),
        kind: "not-found".to_string(),
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
    fn seeded_chart_of_accounts_loads() {
        let db = test_db();
        let repo = LedgerAccountRepository::new(&db);
        let accounts = repo.list(false).unwrap();
        assert!(accounts.len() >= 20);
        let fuel_sales = repo.find_by_code("4100").unwrap();
        assert_eq!(fuel_sales.name, "Fuel Sales Revenue");
        assert_eq!(fuel_sales.balance_minor, 0);
    }
}
