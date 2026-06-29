use rusqlite::{params, Row, Transaction};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::accounting::{
    CommandErrorDto, JournalEntryDto, JournalLineDto, JournalListQueryDto, PostJournalInputDto,
};

pub struct JournalRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> JournalRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    const HEADER_SELECT: &'static str =
        "SELECT je.id, je.entry_date, je.memo, je.source_type, je.source_id, je.posting_status,
                je.posted_at, je.posted_by, je.created_at, je.updated_at, je.version,
                COALESCE(SUM(jl.debit_minor), 0) AS total_debit_minor,
                COALESCE(SUM(jl.credit_minor), 0) AS total_credit_minor,
                COUNT(jl.id) AS line_count
         FROM journal_entries je
         LEFT JOIN journal_lines jl ON jl.entry_id = je.id";

    fn map_header_row(row: &Row<'_>) -> rusqlite::Result<JournalEntryDto> {
        Ok(JournalEntryDto {
            id: row.get("id")?,
            entry_date_iso: row.get("entry_date")?,
            memo: row.get("memo")?,
            source_type: row.get("source_type")?,
            source_id: row.get("source_id")?,
            posting_status: row.get("posting_status")?,
            posted_at_iso: row.get("posted_at")?,
            posted_by: row.get("posted_by")?,
            total_debit_minor: row.get("total_debit_minor")?,
            total_credit_minor: row.get("total_credit_minor")?,
            line_count: row.get("line_count")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
            lines: None,
        })
    }

    fn map_line_row(row: &Row<'_>) -> rusqlite::Result<JournalLineDto> {
        Ok(JournalLineDto {
            id: row.get("id")?,
            account_id: row.get("account_id")?,
            account_code: row.get("account_code")?,
            account_name: row.get("account_name")?,
            line_memo: row.get("line_memo")?,
            debit_minor: row.get("debit_minor")?,
            credit_minor: row.get("credit_minor")?,
        })
    }

    pub fn list(
        &self,
        query: &JournalListQueryDto,
    ) -> Result<Vec<JournalEntryDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = format!("{} WHERE 1=1", Self::HEADER_SELECT);
        let mut bind_values: Vec<rusqlite::types::Value> = Vec::new();

        if query
            .posting_status
            .as_ref()
            .is_some_and(|s| s != "all" && !s.is_empty())
        {
            sql.push_str(" AND je.posting_status = ?");
            bind_values.push(query.posting_status.clone().unwrap().into());
        }
        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            let pattern = format!("%{}%", query.search.as_ref().unwrap().trim());
            sql.push_str(" AND (je.memo LIKE ? OR je.source_type LIKE ? OR je.source_id LIKE ?)");
            bind_values.push(pattern.clone().into());
            bind_values.push(pattern.clone().into());
            bind_values.push(pattern.into());
        }
        if query.from_date_iso.as_ref().is_some_and(|s| !s.is_empty()) {
            sql.push_str(" AND je.entry_date >= ?");
            bind_values.push(query.from_date_iso.clone().unwrap().into());
        }
        if query.to_date_iso.as_ref().is_some_and(|s| !s.is_empty()) {
            sql.push_str(" AND je.entry_date <= ?");
            bind_values.push(query.to_date_iso.clone().unwrap().into());
        }

        sql.push_str(" GROUP BY je.id ORDER BY je.entry_date DESC, je.created_at DESC");
        if let Some(limit) = query.limit.filter(|l| *l > 0) {
            sql.push_str(&format!(" LIMIT {limit}"));
        }

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let param_refs: Vec<&dyn rusqlite::ToSql> = bind_values
            .iter()
            .map(|v| v as &dyn rusqlite::ToSql)
            .collect();

        let rows = stmt
            .query_map(param_refs.as_slice(), Self::map_header_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_by_id(&self, id: &str) -> Result<JournalEntryDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE je.id = ?1 GROUP BY je.id", Self::HEADER_SELECT);
        let mut entry = conn
            .query_row(&sql, params![id], Self::map_header_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("JournalEntry", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })?;

        entry.lines = Some(self.load_lines(id)?);
        Ok(entry)
    }

    fn load_lines(&self, entry_id: &str) -> Result<Vec<JournalLineDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT jl.id, jl.account_id, la.code AS account_code, la.name AS account_name,
                        jl.line_memo, jl.debit_minor, jl.credit_minor
                 FROM journal_lines jl
                 INNER JOIN ledger_accounts la ON la.id = jl.account_id
                 WHERE jl.entry_id = ?1
                 ORDER BY jl.debit_minor DESC, la.code ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map(params![entry_id], Self::map_line_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    #[cfg_attr(not(test), allow(dead_code))]
    pub fn post(&self, input: &PostJournalInputDto) -> Result<JournalEntryDto, CommandErrorDto> {
        validate_post_input(input)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let result = self.post_in_tx(&tx, input);

        match result {
            Ok(id) => {
                tx.commit()
                    .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;
                self.find_by_id(&id)
            }
            Err(e) => {
                let _ = tx.rollback();
                Err(e)
            }
        }
    }

    #[cfg_attr(not(test), allow(dead_code))]
    pub fn post_in_tx(
        &self,
        tx: &Transaction<'_>,
        input: &PostJournalInputDto,
    ) -> Result<String, CommandErrorDto> {
        validate_post_input(input)?;
        Self::assert_period_open_for_date(tx, &input.entry_date_iso)?;

        for line in &input.lines {
            let active: i64 = tx
                .query_row(
                    "SELECT is_active FROM ledger_accounts WHERE id = ?1",
                    params![line.account_id],
                    |row| row.get(0),
                )
                .map_err(|e| match e {
                    rusqlite::Error::QueryReturnedNoRows => {
                        not_found("LedgerAccount", &line.account_id)
                    }
                    _ => db_error("DB_QUERY_FAILED", &e.to_string()),
                })?;
            if active == 0 {
                return Err(conflict(
                    "INACTIVE_ACCOUNT",
                    "Cannot post to an inactive ledger account.",
                ));
            }
        }

        let id = format!("je-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        tx.execute(
            "INSERT INTO journal_entries
             (id, entry_date, memo, source_type, source_id, posting_status,
              posted_at, posted_by, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, 'posted', ?6, ?7, ?6, ?6, 1)",
            params![
                id,
                input.entry_date_iso,
                input.memo.as_deref().map(str::trim),
                input.source_type.trim(),
                input.source_id.trim(),
                now,
                input.posted_by.trim(),
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        for line in &input.lines {
            let line_id = format!("jl-{}", Uuid::new_v4());
            tx.execute(
                "INSERT INTO journal_lines
                 (id, entry_id, account_id, line_memo, debit_minor, credit_minor)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    line_id,
                    id,
                    line.account_id,
                    line.line_memo.as_deref().map(str::trim),
                    line.debit_minor,
                    line.credit_minor,
                ],
            )
            .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;
        }

        Ok(id)
    }

    #[cfg_attr(not(test), allow(dead_code))]
    pub fn assert_period_open_for_date(
        tx: &Transaction<'_>,
        entry_date: &str,
    ) -> Result<(), CommandErrorDto> {
        let date = entry_date.split('T').next().unwrap_or(entry_date);
        let status: Option<String> = tx
            .query_row(
                "SELECT status FROM accounting_periods
                 WHERE start_date <= ?1 AND end_date >= ?1
                 ORDER BY start_date DESC LIMIT 1",
                params![date],
                |row| row.get(0),
            )
            .ok();

        match status.as_deref() {
            Some("open") => Ok(()),
            Some("closed") => Err(conflict(
                "PERIOD_CLOSED",
                "Cannot post to a closed accounting period.",
            )),
            _ => Err(conflict(
                "NO_OPEN_PERIOD",
                "No accounting period covers this entry date.",
            )),
        }
    }
}

#[cfg_attr(not(test), allow(dead_code))]
fn validate_post_input(input: &PostJournalInputDto) -> Result<(), CommandErrorDto> {
    if input.lines.len() < 2 {
        return Err(conflict(
            "JOURNAL_MIN_LINES",
            "A journal entry requires at least two lines.",
        ));
    }

    let mut total_debit: i64 = 0;
    let mut total_credit: i64 = 0;

    for line in &input.lines {
        let has_debit = line.debit_minor > 0;
        let has_credit = line.credit_minor > 0;
        if has_debit == has_credit {
            return Err(conflict(
                "INVALID_LINE",
                "Each journal line must have either a debit or a credit amount.",
            ));
        }
        if line.debit_minor < 0 || line.credit_minor < 0 {
            return Err(conflict(
                "NEGATIVE_AMOUNT",
                "Journal amounts cannot be negative.",
            ));
        }
        total_debit += line.debit_minor;
        total_credit += line.credit_minor;
    }

    if total_debit != total_credit {
        return Err(conflict(
            "UNBALANCED_JOURNAL",
            "Total debits must equal total credits.",
        ));
    }

    if total_debit == 0 {
        return Err(conflict(
            "ZERO_JOURNAL",
            "Journal entry total cannot be zero.",
        ));
    }

    Ok(())
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
    use crate::dto::accounting::PostJournalLineInputDto;

    fn test_db() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn sample_post_input(amount: i64) -> PostJournalInputDto {
        PostJournalInputDto {
            entry_date_iso: "2026-06-15T10:00:00.000Z".to_string(),
            memo: Some("Test journal".to_string()),
            source_type: "test".to_string(),
            source_id: "test-1".to_string(),
            posted_by: "owner".to_string(),
            lines: vec![
                PostJournalLineInputDto {
                    account_id: "la-cash-drawer".to_string(),
                    line_memo: None,
                    debit_minor: amount,
                    credit_minor: 0,
                },
                PostJournalLineInputDto {
                    account_id: "la-fuel-sales".to_string(),
                    line_memo: None,
                    debit_minor: 0,
                    credit_minor: amount,
                },
            ],
        }
    }

    #[test]
    fn balanced_journal_posts_and_updates_account_balance() {
        let db = test_db();
        let journal_repo = JournalRepository::new(&db);
        let account_repo =
            crate::repositories::ledger_account_repository::LedgerAccountRepository::new(&db);

        journal_repo.post(&sample_post_input(50_000)).unwrap();

        let cash = account_repo.find_by_id("la-cash-drawer").unwrap();
        let revenue = account_repo.find_by_id("la-fuel-sales").unwrap();
        assert_eq!(cash.balance_minor, 50_000);
        assert_eq!(revenue.balance_minor, 50_000);
    }

    #[test]
    fn unbalanced_journal_rejected() {
        let db = test_db();
        let repo = JournalRepository::new(&db);
        let mut input = sample_post_input(50_000);
        input.lines[1].credit_minor = 40_000;
        let err = repo.post(&input).unwrap_err();
        assert_eq!(err.code, "UNBALANCED_JOURNAL");
    }

    #[test]
    fn closed_period_blocks_posting() {
        let db = test_db();
        let conn = db.conn();
        conn.execute(
            "UPDATE accounting_periods SET status = 'closed' WHERE period_key = '2026-06'",
            [],
        )
        .unwrap();

        let repo = JournalRepository::new(&db);
        let err = repo.post(&sample_post_input(10_000)).unwrap_err();
        assert_eq!(err.code, "PERIOD_CLOSED");
    }
}
