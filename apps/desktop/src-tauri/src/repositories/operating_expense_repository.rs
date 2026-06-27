use rusqlite::{params, Row, Transaction};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::operating_expense::{
    CommandErrorDto, OperatingExpenseDto, OperatingExpenseListQueryDto,
    RecordOperatingExpenseInputDto, VoidOperatingExpenseInputDto,
};

const VALID_CATEGORIES: [&str; 8] = [
    "maintenance",
    "electricity",
    "salary",
    "generator",
    "transport",
    "stationery",
    "vehicle_repair",
    "other",
];
const VALID_PAYMENT_STATUSES: [&str; 2] = ["paid", "credit"];

pub struct OperatingExpenseRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> OperatingExpenseRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    const SELECT_SQL: &'static str =
        "SELECT e.id, e.expense_date, e.category_code, e.amount_minor, e.payment_status,
                e.payee_name, e.cash_account_id, ca.name AS cash_account_name,
                e.reference, e.notes, e.status, e.recorded_by, e.created_at, e.updated_at, e.version
         FROM operating_expenses e
         LEFT JOIN cash_accounts ca ON ca.id = e.cash_account_id";

    fn map_row(row: &Row<'_>) -> rusqlite::Result<OperatingExpenseDto> {
        Ok(OperatingExpenseDto {
            id: row.get("id")?,
            expense_date_iso: row.get("expense_date")?,
            category_code: row.get("category_code")?,
            amount_minor: row.get("amount_minor")?,
            payment_status: row.get("payment_status")?,
            payee_name: row.get("payee_name")?,
            cash_account_id: row.get("cash_account_id")?,
            cash_account_name: row.get("cash_account_name")?,
            reference: row.get("reference")?,
            notes: row.get("notes")?,
            status: row.get("status")?,
            recorded_by: row.get("recorded_by")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    pub fn list(
        &self,
        query: &OperatingExpenseListQueryDto,
    ) -> Result<Vec<OperatingExpenseDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = format!("{} WHERE 1=1", Self::SELECT_SQL);
        let mut bind_status = false;
        let mut bind_search = false;

        if query
            .status
            .as_ref()
            .is_some_and(|s| s != "all" && !s.is_empty())
        {
            sql.push_str(" AND e.status = ?");
            bind_status = true;
        }
        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            sql.push_str(
                " AND (e.payee_name LIKE ? OR e.reference LIKE ? OR e.category_code LIKE ?)",
            );
            bind_search = true;
        }
        sql.push_str(" ORDER BY e.expense_date DESC, e.created_at DESC");

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let search_pattern = query
            .search
            .as_ref()
            .map(|s| format!("%{}%", s.trim()))
            .unwrap_or_default();

        let rows = match (bind_status, bind_search) {
            (true, true) => stmt.query_map(
                params![
                    query.status.as_ref().unwrap(),
                    search_pattern,
                    search_pattern,
                    search_pattern
                ],
                Self::map_row,
            ),
            (true, false) => stmt.query_map(params![query.status.as_ref().unwrap()], Self::map_row),
            (false, true) => stmt.query_map(
                params![search_pattern, search_pattern, search_pattern],
                Self::map_row,
            ),
            (false, false) => stmt.query_map([], Self::map_row),
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_by_id(&self, id: &str) -> Result<OperatingExpenseDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE e.id = ?1", Self::SELECT_SQL);
        conn.query_row(&sql, params![id], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("OperatingExpense", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    pub fn record(
        &self,
        input: &RecordOperatingExpenseInputDto,
    ) -> Result<OperatingExpenseDto, CommandErrorDto> {
        self.validate_record_input(input)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let id = format!("exp-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        if input.payment_status == "paid" {
            let account_id = input.cash_account_id.as_deref().unwrap();
            Self::apply_balance_delta_tx(&tx, account_id, -input.amount_minor, &now)?;
        }

        tx.execute(
            "INSERT INTO operating_expenses
             (id, expense_date, category_code, amount_minor, payment_status, payee_name,
              cash_account_id, reference, notes, status, recorded_by, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'posted', ?10, ?11, ?11, 1)",
            params![
                id,
                input.expense_date_iso,
                input.category_code,
                input.amount_minor,
                input.payment_status,
                input.payee_name.trim(),
                input.cash_account_id,
                input.reference.as_deref().map(str::trim),
                input.notes.as_deref().map(str::trim),
                input.recorded_by,
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&id)
    }

    pub fn void(
        &self,
        input: &VoidOperatingExpenseInputDto,
    ) -> Result<OperatingExpenseDto, CommandErrorDto> {
        let existing = self.find_by_id(&input.expense_id)?;
        if existing.status != "posted" {
            return Err(conflict(
                "EXPENSE_NOT_POSTED",
                "Only posted expenses can be voided.",
            ));
        }
        if existing.version != input.version {
            return Err(conflict(
                "EXPENSE_VERSION_CONFLICT",
                "Expense was modified by another process. Refresh and try again.",
            ));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        if existing.payment_status == "paid" {
            if let Some(ref account_id) = existing.cash_account_id {
                Self::apply_balance_delta_tx(&tx, account_id, existing.amount_minor, &now)?;
            }
        }

        let updated = tx
            .execute(
                "UPDATE operating_expenses
                 SET status = 'void', updated_at = ?2, version = version + 1
                 WHERE id = ?1 AND version = ?3 AND status = 'posted'",
                params![input.expense_id, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "EXPENSE_VERSION_CONFLICT",
                "Expense was modified by another process. Refresh and try again.",
            ));
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&input.expense_id)
    }

    fn validate_record_input(
        &self,
        input: &RecordOperatingExpenseInputDto,
    ) -> Result<(), CommandErrorDto> {
        if !VALID_CATEGORIES.contains(&input.category_code.as_str()) {
            return Err(conflict("INVALID_CATEGORY", "Invalid expense category."));
        }
        if !VALID_PAYMENT_STATUSES.contains(&input.payment_status.as_str()) {
            return Err(conflict(
                "INVALID_PAYMENT_STATUS",
                "Invalid payment status.",
            ));
        }
        if input.amount_minor <= 0 {
            return Err(conflict(
                "INVALID_AMOUNT",
                "Amount must be greater than zero.",
            ));
        }
        if input.payee_name.trim().is_empty() {
            return Err(conflict("PAYEE_REQUIRED", "Payee name is required."));
        }
        if input.payment_status == "paid" && input.cash_account_id.is_none() {
            return Err(conflict(
                "CASH_ACCOUNT_REQUIRED",
                "Cash account is required for paid expenses.",
            ));
        }
        if input.payment_status == "credit" && input.cash_account_id.is_some() {
            return Err(conflict(
                "CASH_ACCOUNT_NOT_ALLOWED",
                "Cash account must not be set for credit expenses.",
            ));
        }
        Ok(())
    }

    fn apply_balance_delta_tx(
        tx: &Transaction<'_>,
        account_id: &str,
        delta_minor: i64,
        now: &str,
    ) -> Result<(), CommandErrorDto> {
        let updated = tx
            .execute(
                "UPDATE cash_accounts
                 SET balance_minor = balance_minor + ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND is_active = 1 AND balance_minor + ?2 >= 0",
                params![account_id, delta_minor, now],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "INSUFFICIENT_CASH",
                "Selected cash account has insufficient balance or is inactive.",
            ));
        }
        Ok(())
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

    fn seed_drawer(conn: &DbConnection) {
        conn.conn()
            .execute(
                "UPDATE cash_accounts SET balance_minor = 20000000 WHERE id = 'cash-drawer-main'",
                [],
            )
            .unwrap();
    }

    #[test]
    fn paid_expense_reduces_cash() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        seed_drawer(&conn);
        let repo = OperatingExpenseRepository::new(&conn);

        repo.record(&RecordOperatingExpenseInputDto {
            expense_date_iso: "2026-06-26T10:00:00.000Z".to_string(),
            category_code: "maintenance".to_string(),
            amount_minor: 1_500_000,
            payment_status: "paid".to_string(),
            payee_name: "Hassan Motors".to_string(),
            cash_account_id: Some("cash-drawer-main".to_string()),
            reference: None,
            notes: None,
            recorded_by: "owner".to_string(),
        })
        .unwrap();

        let balance: i64 = conn
            .conn()
            .query_row(
                "SELECT balance_minor FROM cash_accounts WHERE id = 'cash-drawer-main'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(balance, 18_500_000);
    }

    #[test]
    fn void_restores_cash() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        seed_drawer(&conn);
        let repo = OperatingExpenseRepository::new(&conn);

        let expense = repo
            .record(&RecordOperatingExpenseInputDto {
                expense_date_iso: "2026-06-26T10:00:00.000Z".to_string(),
                category_code: "electricity".to_string(),
                amount_minor: 850_000,
                payment_status: "paid".to_string(),
                payee_name: "WAPDA".to_string(),
                cash_account_id: Some("cash-drawer-main".to_string()),
                reference: Some("Bill #123".to_string()),
                notes: None,
                recorded_by: "owner".to_string(),
            })
            .unwrap();

        repo.void(&VoidOperatingExpenseInputDto {
            expense_id: expense.id.clone(),
            version: expense.version,
        })
        .unwrap();

        let balance: i64 = conn
            .conn()
            .query_row(
                "SELECT balance_minor FROM cash_accounts WHERE id = 'cash-drawer-main'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(balance, 20_000_000);
    }
}
