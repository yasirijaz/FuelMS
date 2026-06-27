use rusqlite::{params, Row, Transaction};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::person_ledger::{
    CommandErrorDto, PersonLedgerBalanceDto, PersonLedgerBalanceListQueryDto, PersonLedgerEntryDto,
    PersonLedgerEntryListQueryDto, RecordPersonBorrowInputDto, RecordPersonCollectLoanInputDto,
    RecordPersonLendInputDto, RecordPersonRepayBorrowedInputDto,
};

pub struct PersonLedgerRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> PersonLedgerRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    const ENTRY_SELECT: &'static str =
        "SELECT e.id, e.partner_id, bp.display_name AS partner_name, e.entry_date, e.entry_type,
                e.signed_amount_minor, e.balance_after_minor, e.cash_account_id,
                ca.name AS cash_account_name, e.source_type, e.source_id, e.reference, e.notes,
                e.status, e.recorded_by, e.created_at, e.updated_at, e.version
         FROM person_ledger_entries e
         INNER JOIN business_partners bp ON bp.id = e.partner_id
         LEFT JOIN cash_accounts ca ON ca.id = e.cash_account_id";

    fn map_entry_row(row: &Row<'_>) -> rusqlite::Result<PersonLedgerEntryDto> {
        Ok(PersonLedgerEntryDto {
            id: row.get("id")?,
            partner_id: row.get("partner_id")?,
            partner_name: row.get("partner_name")?,
            entry_date_iso: row.get("entry_date")?,
            entry_type: row.get("entry_type")?,
            signed_amount_minor: row.get("signed_amount_minor")?,
            balance_after_minor: row.get("balance_after_minor")?,
            cash_account_id: row.get("cash_account_id")?,
            cash_account_name: row.get("cash_account_name")?,
            source_type: row.get("source_type")?,
            source_id: row.get("source_id")?,
            reference: row.get("reference")?,
            notes: row.get("notes")?,
            status: row.get("status")?,
            recorded_by: row.get("recorded_by")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    pub fn list_balances(
        &self,
        query: &PersonLedgerBalanceListQueryDto,
    ) -> Result<Vec<PersonLedgerBalanceDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = String::from(
            "SELECT bp.id AS partner_id, bp.display_name AS partner_name,
                    COALESCE(SUM(CASE WHEN ple.status = 'posted' THEN ple.signed_amount_minor ELSE 0 END), 0) AS balance_minor,
                    COUNT(CASE WHEN ple.status = 'posted' THEN ple.id END) AS entry_count,
                    MAX(CASE WHEN ple.status = 'posted' THEN ple.entry_date END) AS last_entry_date
             FROM business_partners bp
             LEFT JOIN person_ledger_entries ple ON ple.partner_id = bp.id
             WHERE bp.deleted_at IS NULL",
        );

        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            sql.push_str(" AND bp.display_name LIKE ?");
        }

        if query.role_code.as_ref().is_some_and(|r| !r.is_empty()) {
            sql.push_str(
                " AND EXISTS (
                    SELECT 1 FROM partner_roles pr
                    WHERE pr.partner_id = bp.id AND pr.role_code = ?
                  )",
            );
        }

        sql.push_str(" GROUP BY bp.id, bp.display_name");

        if query.non_zero_only.unwrap_or(false) {
            sql.push_str(" HAVING balance_minor != 0");
        }

        sql.push_str(" ORDER BY ABS(balance_minor) DESC, bp.display_name ASC");

        let search_pattern = query.search.as_ref().map(|s| format!("%{}%", s.trim()));

        let mut bind_values: Vec<rusqlite::types::Value> = Vec::new();
        if let Some(pattern) = search_pattern {
            bind_values.push(pattern.into());
        }
        if query.role_code.as_ref().is_some_and(|r| !r.is_empty()) {
            bind_values.push(query.role_code.clone().unwrap().into());
        }

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let param_refs: Vec<&dyn rusqlite::ToSql> = bind_values
            .iter()
            .map(|v| v as &dyn rusqlite::ToSql)
            .collect();

        let rows: Vec<(String, String, i64, i64, Option<String>)> = stmt
            .query_map(param_refs.as_slice(), |row| {
                Ok((
                    row.get("partner_id")?,
                    row.get("partner_name")?,
                    row.get("balance_minor")?,
                    row.get("entry_count")?,
                    row.get("last_entry_date")?,
                ))
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        let mut balances = Vec::with_capacity(rows.len());
        for (partner_id, partner_name, balance_minor, entry_count, last_entry_date) in rows {
            let roles = self.load_roles(&partner_id)?;
            balances.push(PersonLedgerBalanceDto {
                partner_id,
                partner_name,
                roles,
                balance_minor,
                entry_count,
                last_entry_date_iso: last_entry_date,
            });
        }

        Ok(balances)
    }

    fn load_roles(&self, partner_id: &str) -> Result<Vec<String>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare("SELECT role_code FROM partner_roles WHERE partner_id = ?1 ORDER BY role_code")
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map(params![partner_id], |row| row.get::<_, String>(0))
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn list_entries(
        &self,
        query: &PersonLedgerEntryListQueryDto,
    ) -> Result<Vec<PersonLedgerEntryDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = format!(
            "{} WHERE e.partner_id = ?1 ORDER BY e.entry_date DESC, e.created_at DESC",
            Self::ENTRY_SELECT
        );
        if let Some(limit) = query.limit.filter(|l| *l > 0) {
            sql.push_str(&format!(" LIMIT {limit}"));
        }

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map(params![query.partner_id], Self::map_entry_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_entry_by_id(&self, id: &str) -> Result<PersonLedgerEntryDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE e.id = ?1", Self::ENTRY_SELECT);
        conn.query_row(&sql, params![id], Self::map_entry_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("PersonLedgerEntry", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    pub fn record_borrow(
        &self,
        input: &RecordPersonBorrowInputDto,
    ) -> Result<PersonLedgerEntryDto, CommandErrorDto> {
        self.validate_cash_amount(input.amount_minor)?;
        self.ensure_partner_exists(&input.partner_id)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = now_iso();
        Self::apply_balance_delta_tx(&tx, &input.cash_account_id, input.amount_minor, &now)?;

        let id = Self::insert_entry_tx(
            &tx,
            &input.partner_id,
            &input.entry_date_iso,
            "borrow_from_person",
            -input.amount_minor,
            Some(&input.cash_account_id),
            "person_ledger_borrow",
            &format!("borrow-{}", Uuid::new_v4()),
            input.reference.as_deref(),
            input.notes.as_deref(),
            &input.recorded_by,
        )?;

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_entry_by_id(&id)
    }

    pub fn record_repay_borrowed(
        &self,
        input: &RecordPersonRepayBorrowedInputDto,
    ) -> Result<PersonLedgerEntryDto, CommandErrorDto> {
        self.validate_cash_amount(input.amount_minor)?;
        self.ensure_partner_exists(&input.partner_id)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = now_iso();
        Self::apply_balance_delta_tx(&tx, &input.cash_account_id, -input.amount_minor, &now)?;

        let id = Self::insert_entry_tx(
            &tx,
            &input.partner_id,
            &input.entry_date_iso,
            "repay_borrowed",
            input.amount_minor,
            Some(&input.cash_account_id),
            "person_ledger_repay",
            &format!("repay-{}", Uuid::new_v4()),
            input.reference.as_deref(),
            input.notes.as_deref(),
            &input.recorded_by,
        )?;

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_entry_by_id(&id)
    }

    pub fn record_lend(
        &self,
        input: &RecordPersonLendInputDto,
    ) -> Result<PersonLedgerEntryDto, CommandErrorDto> {
        self.validate_cash_amount(input.amount_minor)?;
        self.ensure_partner_exists(&input.partner_id)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = now_iso();
        Self::apply_balance_delta_tx(&tx, &input.cash_account_id, -input.amount_minor, &now)?;

        let id = Self::insert_entry_tx(
            &tx,
            &input.partner_id,
            &input.entry_date_iso,
            "lend_to_person",
            input.amount_minor,
            Some(&input.cash_account_id),
            "person_ledger_lend",
            &format!("lend-{}", Uuid::new_v4()),
            input.reference.as_deref(),
            input.notes.as_deref(),
            &input.recorded_by,
        )?;

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_entry_by_id(&id)
    }

    pub fn record_collect_loan(
        &self,
        input: &RecordPersonCollectLoanInputDto,
    ) -> Result<PersonLedgerEntryDto, CommandErrorDto> {
        self.validate_cash_amount(input.amount_minor)?;
        self.ensure_partner_exists(&input.partner_id)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = now_iso();
        Self::apply_balance_delta_tx(&tx, &input.cash_account_id, input.amount_minor, &now)?;

        let id = Self::insert_entry_tx(
            &tx,
            &input.partner_id,
            &input.entry_date_iso,
            "collect_loan_repayment",
            -input.amount_minor,
            Some(&input.cash_account_id),
            "person_ledger_collect",
            &format!("collect-{}", Uuid::new_v4()),
            input.reference.as_deref(),
            input.notes.as_deref(),
            &input.recorded_by,
        )?;

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_entry_by_id(&id)
    }

    pub fn append_credit_purchase_tx(
        tx: &Transaction<'_>,
        partner_id: &str,
        purchase_id: &str,
        amount_minor: i64,
        entry_date_iso: &str,
        recorded_by: &str,
        reference: Option<&str>,
    ) -> Result<(), CommandErrorDto> {
        if amount_minor <= 0 {
            return Ok(());
        }
        Self::insert_entry_tx(
            tx,
            partner_id,
            entry_date_iso,
            "credit_fuel_purchase",
            -amount_minor,
            None,
            "fuel_purchase",
            purchase_id,
            reference,
            None,
            recorded_by,
        )?;
        Ok(())
    }

    pub fn append_credit_sale_tx(
        tx: &Transaction<'_>,
        partner_id: &str,
        sale_id: &str,
        amount_minor: i64,
        entry_date_iso: &str,
        recorded_by: &str,
        reference: Option<&str>,
    ) -> Result<(), CommandErrorDto> {
        if amount_minor <= 0 {
            return Ok(());
        }
        Self::insert_entry_tx(
            tx,
            partner_id,
            entry_date_iso,
            "credit_fuel_sale",
            amount_minor,
            None,
            "fuel_sale",
            sale_id,
            reference,
            None,
            recorded_by,
        )?;
        Ok(())
    }

    fn insert_entry_tx(
        tx: &Transaction<'_>,
        partner_id: &str,
        entry_date_iso: &str,
        entry_type: &str,
        signed_amount_minor: i64,
        cash_account_id: Option<&str>,
        source_type: &str,
        source_id: &str,
        reference: Option<&str>,
        notes: Option<&str>,
        recorded_by: &str,
    ) -> Result<String, CommandErrorDto> {
        let current_balance: i64 = tx
            .query_row(
                "SELECT COALESCE(SUM(signed_amount_minor), 0)
                 FROM person_ledger_entries
                 WHERE partner_id = ?1 AND status = 'posted'",
                params![partner_id],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let balance_after = current_balance + signed_amount_minor;
        let id = format!("ple-{}", Uuid::new_v4());
        let now = now_iso();

        tx.execute(
            "INSERT INTO person_ledger_entries
             (id, partner_id, entry_date, entry_type, signed_amount_minor, balance_after_minor,
              cash_account_id, source_type, source_id, reference, notes, status, recorded_by,
              created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'posted', ?12, ?13, ?13, 1)",
            params![
                id,
                partner_id,
                entry_date_iso,
                entry_type,
                signed_amount_minor,
                balance_after,
                cash_account_id,
                source_type,
                source_id,
                reference.map(str::trim),
                notes.map(str::trim),
                recorded_by.trim(),
                now,
            ],
        )
        .map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                conflict(
                    "DUPLICATE_LEDGER_SOURCE",
                    "A ledger entry already exists for this source.",
                )
            } else {
                db_error("DB_INSERT_FAILED", &e.to_string())
            }
        })?;

        Ok(id)
    }

    fn ensure_partner_exists(&self, partner_id: &str) -> Result<(), CommandErrorDto> {
        let conn = self.db.conn();
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM business_partners WHERE id = ?1 AND deleted_at IS NULL",
                params![partner_id],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        if exists == 0 {
            return Err(not_found("BusinessPartner", partner_id));
        }
        Ok(())
    }

    fn validate_cash_amount(&self, amount_minor: i64) -> Result<(), CommandErrorDto> {
        if amount_minor <= 0 {
            return Err(conflict(
                "INVALID_AMOUNT",
                "Amount must be greater than zero.",
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

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
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

    fn test_db() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn seed_partner(conn: &DbConnection) -> String {
        let now = "2026-06-26T10:00:00.000Z";
        conn.conn()
            .execute(
                "INSERT INTO business_partners (id, display_name, created_at, updated_at)
                 VALUES ('bp-father', 'Father', ?1, ?1)",
                [now],
            )
            .unwrap();
        conn.conn()
            .execute(
                "INSERT INTO partner_roles (id, partner_id, role_code, assigned_at, created_at, updated_at)
                 VALUES ('pr-1', 'bp-father', 'owner', ?1, ?1, ?1)",
                [now],
            )
            .unwrap();
        "bp-father".to_string()
    }

    fn seed_cash(conn: &DbConnection) {
        conn.conn()
            .execute(
                "UPDATE cash_accounts SET balance_minor = 5000000 WHERE id = 'cash-bank-main'",
                [],
            )
            .unwrap();
    }

    #[test]
    fn borrow_increases_payable_balance() {
        let db = test_db();
        seed_partner(&db);
        seed_cash(&db);
        let repo = PersonLedgerRepository::new(&db);

        repo.record_borrow(&RecordPersonBorrowInputDto {
            partner_id: "bp-father".to_string(),
            amount_minor: 1_000_000,
            entry_date_iso: "2026-06-15T10:00:00.000Z".to_string(),
            cash_account_id: "cash-bank-main".to_string(),
            reference: None,
            notes: None,
            recorded_by: "owner".to_string(),
        })
        .unwrap();

        let balances = repo
            .list_balances(&PersonLedgerBalanceListQueryDto {
                search: None,
                role_code: None,
                non_zero_only: Some(true),
            })
            .unwrap();
        assert_eq!(balances.len(), 1);
        assert_eq!(balances[0].balance_minor, -1_000_000);
    }

    #[test]
    fn lend_creates_receivable() {
        let db = test_db();
        seed_partner(&db);
        seed_cash(&db);
        let repo = PersonLedgerRepository::new(&db);

        repo.record_lend(&RecordPersonLendInputDto {
            partner_id: "bp-father".to_string(),
            amount_minor: 400_000,
            entry_date_iso: "2026-06-16T10:00:00.000Z".to_string(),
            cash_account_id: "cash-bank-main".to_string(),
            reference: None,
            notes: None,
            recorded_by: "owner".to_string(),
        })
        .unwrap();

        let entries = repo
            .list_entries(&PersonLedgerEntryListQueryDto {
                partner_id: "bp-father".to_string(),
                limit: None,
            })
            .unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].balance_after_minor, 400_000);
    }

    #[test]
    fn repay_reduces_payable() {
        let db = test_db();
        seed_partner(&db);
        seed_cash(&db);
        let repo = PersonLedgerRepository::new(&db);

        repo.record_borrow(&RecordPersonBorrowInputDto {
            partner_id: "bp-father".to_string(),
            amount_minor: 1_000_000,
            entry_date_iso: "2026-06-15T10:00:00.000Z".to_string(),
            cash_account_id: "cash-bank-main".to_string(),
            reference: None,
            notes: None,
            recorded_by: "owner".to_string(),
        })
        .unwrap();

        repo.record_repay_borrowed(&RecordPersonRepayBorrowedInputDto {
            partner_id: "bp-father".to_string(),
            amount_minor: 250_000,
            entry_date_iso: "2026-06-20T10:00:00.000Z".to_string(),
            cash_account_id: "cash-bank-main".to_string(),
            reference: None,
            notes: None,
            recorded_by: "owner".to_string(),
        })
        .unwrap();

        let balances = repo
            .list_balances(&PersonLedgerBalanceListQueryDto {
                search: None,
                role_code: None,
                non_zero_only: Some(true),
            })
            .unwrap();
        assert_eq!(balances[0].balance_minor, -750_000);
    }
}
