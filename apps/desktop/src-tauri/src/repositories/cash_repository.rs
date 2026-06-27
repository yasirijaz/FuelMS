use rusqlite::{params, Row, Transaction};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::cash::{
    CashAccountDto, CashAccountVersionInputDto, CashTransferDto, CashTransferListQueryDto,
    CommandErrorDto, CreateCashAccountInputDto, RecordCashTransferInputDto,
    UpdateCashAccountInputDto,
};

const VALID_ACCOUNT_TYPES: [&str; 5] = ["drawer", "bank", "safe", "mobile_wallet", "other"];

pub struct CashRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> CashRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn map_account_row(row: &Row<'_>) -> rusqlite::Result<CashAccountDto> {
        Ok(CashAccountDto {
            id: row.get("id")?,
            name: row.get("name")?,
            account_type: row.get("account_type")?,
            balance_minor: row.get("balance_minor")?,
            is_active: row.get::<_, i64>("is_active")? != 0,
            display_order: row.get("display_order")?,
            notes: row.get("notes")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    fn map_transfer_row(row: &Row<'_>) -> rusqlite::Result<CashTransferDto> {
        Ok(CashTransferDto {
            id: row.get("id")?,
            from_account_id: row.get("from_account_id")?,
            from_account_name: row.get("from_account_name")?,
            to_account_id: row.get("to_account_id")?,
            to_account_name: row.get("to_account_name")?,
            amount_minor: row.get("amount_minor")?,
            transferred_at_iso: row.get("transferred_at")?,
            reference: row.get("reference")?,
            notes: row.get("notes")?,
            recorded_by: row.get("recorded_by")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    const ACCOUNT_SELECT: &'static str =
        "SELECT id, name, account_type, balance_minor, is_active, display_order, notes,
                created_at, updated_at, version
         FROM cash_accounts";

    const TRANSFER_SELECT: &'static str =
        "SELECT t.id, t.from_account_id, fa.name AS from_account_name,
                t.to_account_id, ta.name AS to_account_name,
                t.amount_minor, t.transferred_at, t.reference, t.notes, t.recorded_by,
                t.created_at, t.updated_at, t.version
         FROM cash_transfers t
         INNER JOIN cash_accounts fa ON fa.id = t.from_account_id
         INNER JOIN cash_accounts ta ON ta.id = t.to_account_id";

    pub fn list_accounts(&self, active_only: bool) -> Result<Vec<CashAccountDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = if active_only {
            format!(
                "{} WHERE is_active = 1 ORDER BY display_order ASC, name ASC",
                Self::ACCOUNT_SELECT
            )
        } else {
            format!("{} ORDER BY display_order ASC, name ASC", Self::ACCOUNT_SELECT)
        };

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map([], Self::map_account_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_account_by_id(&self, id: &str) -> Result<CashAccountDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE id = ?1", Self::ACCOUNT_SELECT);
        conn.query_row(&sql, params![id], Self::map_account_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("CashAccount", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    pub fn create_account(
        &self,
        input: &CreateCashAccountInputDto,
    ) -> Result<CashAccountDto, CommandErrorDto> {
        let name = input.name.trim();
        if name.is_empty() {
            return Err(conflict("ACCOUNT_NAME_REQUIRED", "Account name is required."));
        }
        if !VALID_ACCOUNT_TYPES.contains(&input.account_type.as_str()) {
            return Err(conflict("INVALID_ACCOUNT_TYPE", "Invalid cash account type."));
        }

        let opening = input.opening_balance_minor.unwrap_or(0);
        if opening < 0 {
            return Err(conflict(
                "INVALID_OPENING_BALANCE",
                "Opening balance cannot be negative.",
            ));
        }

        let conn = self.db.conn();
        let id = format!("cash-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let display_order = input.display_order.unwrap_or(0);

        conn.execute(
            "INSERT INTO cash_accounts
             (id, name, account_type, balance_minor, is_active, display_order, notes, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7, ?7, 1)",
            params![
                id,
                name,
                input.account_type,
                opening,
                display_order,
                input.notes.as_deref().map(str::trim),
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        self.find_account_by_id(&id)
    }

    pub fn update_account(
        &self,
        input: &UpdateCashAccountInputDto,
    ) -> Result<CashAccountDto, CommandErrorDto> {
        let name = input.name.trim();
        if name.is_empty() {
            return Err(conflict("ACCOUNT_NAME_REQUIRED", "Account name is required."));
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE cash_accounts
                 SET name = ?2, display_order = ?3, notes = ?4, updated_at = ?5, version = version + 1
                 WHERE id = ?1 AND version = ?6",
                params![
                    input.id,
                    name,
                    input.display_order,
                    input.notes.as_deref().map(str::trim),
                    now,
                    input.version,
                ],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "ACCOUNT_VERSION_CONFLICT",
                "Account was modified by another process. Refresh and try again.",
            ));
        }

        self.find_account_by_id(&input.id)
    }

    pub fn set_account_active(
        &self,
        input: &CashAccountVersionInputDto,
        active: bool,
    ) -> Result<CashAccountDto, CommandErrorDto> {
        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let flag: i64 = if active { 1 } else { 0 };

        let updated = conn
            .execute(
                "UPDATE cash_accounts
                 SET is_active = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4",
                params![input.account_id, flag, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "ACCOUNT_VERSION_CONFLICT",
                "Account was modified by another process. Refresh and try again.",
            ));
        }

        self.find_account_by_id(&input.account_id)
    }

    pub fn list_transfers(
        &self,
        query: &CashTransferListQueryDto,
    ) -> Result<Vec<CashTransferDto>, CommandErrorDto> {
        let limit = query.limit.unwrap_or(50).clamp(1, 500);
        let conn = self.db.conn();

        let mut sql = format!("{} WHERE 1=1", Self::TRANSFER_SELECT);

        if query.account_id.is_some() {
            sql.push_str(" AND (t.from_account_id = ?1 OR t.to_account_id = ?1)");
            sql.push_str(" ORDER BY t.transferred_at DESC LIMIT ?2");
        } else {
            sql.push_str(" ORDER BY t.transferred_at DESC LIMIT ?1");
        }

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = if let Some(ref account_id) = query.account_id {
            stmt.query_map(params![account_id, limit], Self::map_transfer_row)
        } else {
            stmt.query_map(params![limit], Self::map_transfer_row)
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn record_transfer(
        &self,
        input: &RecordCashTransferInputDto,
    ) -> Result<CashTransferDto, CommandErrorDto> {
        if input.from_account_id == input.to_account_id {
            return Err(conflict(
                "SAME_ACCOUNT_TRANSFER",
                "Source and destination must be different accounts.",
            ));
        }
        if input.amount_minor <= 0 {
            return Err(conflict(
                "INVALID_AMOUNT",
                "Transfer amount must be greater than zero.",
            ));
        }

        let from = self.find_account_by_id(&input.from_account_id)?;
        let to = self.find_account_by_id(&input.to_account_id)?;

        if !from.is_active || !to.is_active {
            return Err(conflict(
                "INACTIVE_ACCOUNT",
                "Both accounts must be active to transfer cash.",
            ));
        }
        if from.balance_minor < input.amount_minor {
            return Err(conflict(
                "INSUFFICIENT_BALANCE",
                "Source account does not have enough cash for this transfer.",
            ));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let id = format!("xfer-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        Self::apply_balance_delta_tx(&tx, &from.id, -input.amount_minor, &now)?;
        Self::apply_balance_delta_tx(&tx, &to.id, input.amount_minor, &now)?;

        tx.execute(
            "INSERT INTO cash_transfers
             (id, from_account_id, to_account_id, amount_minor, transferred_at, reference, notes,
              recorded_by, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9, 1)",
            params![
                id,
                input.from_account_id,
                input.to_account_id,
                input.amount_minor,
                input.transferred_at_iso,
                input.reference.as_deref().map(str::trim),
                input.notes.as_deref().map(str::trim),
                input.recorded_by,
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_transfer_by_id(&id)
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
                 WHERE id = ?1 AND balance_minor + ?2 >= 0",
                params![account_id, delta_minor, now],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "INSUFFICIENT_BALANCE",
                "Source account does not have enough cash for this transfer.",
            ));
        }

        Ok(())
    }

    fn find_transfer_by_id(&self, id: &str) -> Result<CashTransferDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE t.id = ?1", Self::TRANSFER_SELECT);
        conn.query_row(&sql, params![id], Self::map_transfer_row).map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => not_found("CashTransfer", id),
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

    #[test]
    fn seeded_accounts_exist() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        let repo = CashRepository::new(&conn);
        let accounts = repo.list_accounts(true).unwrap();
        assert_eq!(accounts.len(), 3);
    }

    #[test]
    fn transfer_moves_balance_atomically() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        let repo = CashRepository::new(&conn);

        let drawer = repo.find_account_by_id("cash-drawer-main").unwrap();
        let bank = repo.find_account_by_id("cash-bank-main").unwrap();

        conn.conn()
            .execute(
                "UPDATE cash_accounts SET balance_minor = 20000000 WHERE id = ?1",
                params![drawer.id],
            )
            .unwrap();

        let transfer = repo
            .record_transfer(&RecordCashTransferInputDto {
                from_account_id: drawer.id.clone(),
                to_account_id: bank.id.clone(),
                amount_minor: 18_000_000,
                transferred_at_iso: "2026-06-26T10:00:00.000Z".to_string(),
                reference: Some("Daily deposit".to_string()),
                notes: None,
                recorded_by: "owner".to_string(),
            })
            .unwrap();

        assert_eq!(transfer.amount_minor, 18_000_000);

        let drawer_after = repo.find_account_by_id(&drawer.id).unwrap();
        let bank_after = repo.find_account_by_id(&bank.id).unwrap();
        assert_eq!(drawer_after.balance_minor, 2_000_000);
        assert_eq!(bank_after.balance_minor, 18_000_000);
    }

    #[test]
    fn transfer_rejects_insufficient_balance() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        let repo = CashRepository::new(&conn);

        let err = repo
            .record_transfer(&RecordCashTransferInputDto {
                from_account_id: "cash-drawer-main".to_string(),
                to_account_id: "cash-bank-main".to_string(),
                amount_minor: 100,
                transferred_at_iso: "2026-06-26T10:00:00.000Z".to_string(),
                reference: None,
                notes: None,
                recorded_by: "owner".to_string(),
            })
            .unwrap_err();

        assert_eq!(err.code, "INSUFFICIENT_BALANCE");
    }
}
