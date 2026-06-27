use rusqlite::{params, Row, Transaction};

use crate::db::connection::DbConnection;
use crate::dto::fuel_price::{CommandErrorDto, FuelPriceRecordDto, SaveFuelPriceRecordResponse};

pub struct FuelPriceRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> FuelPriceRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn map_row(row: &Row<'_>) -> rusqlite::Result<FuelPriceRecordDto> {
        Ok(FuelPriceRecordDto {
            id: row.get("id")?,
            product_id: row.get("product_id")?,
            product_code: row.get("product_code")?,
            price_per_litre_minor: row.get("price_per_litre_minor")?,
            effective_from_iso: row.get("effective_from")?,
            effective_to_iso: row.get("effective_to")?,
            status: row.get("status")?,
            reason: row.get("reason")?,
            reference: row.get("reference")?,
            recorded_by: row.get("recorded_by")?,
            batch_id: row.get("batch_id")?,
            superseded_by_id: row.get("superseded_by_id")?,
            is_locked: row.get::<_, i64>("is_locked")? != 0,
            version: row.get("version")?,
        })
    }

    const SELECT_FIELDS: &'static str = "SELECT r.id, r.product_id, p.code AS product_code,
        r.price_per_litre_minor, r.effective_from, r.effective_to, r.status,
        r.reason, r.reference, r.recorded_by, r.batch_id, r.superseded_by_id,
        r.is_locked, r.version
        FROM fuel_price_records r
        INNER JOIN fuel_products p ON p.id = r.product_id";

    pub fn find_by_id(&self, id: &str) -> Result<FuelPriceRecordDto, CommandErrorDto> {
        let sql = format!("{} WHERE r.id = ?1", Self::SELECT_FIELDS);
        self.db
            .conn()
            .query_row(&sql, params![id], Self::map_row)
            .map_err(map_query_error(id))
    }

    pub fn find_active_by_product(
        &self,
        product_id: &str,
    ) -> Result<Option<FuelPriceRecordDto>, CommandErrorDto> {
        let sql = format!(
            "{} WHERE r.product_id = ?1 AND r.status = 'active' LIMIT 1",
            Self::SELECT_FIELDS
        );
        match self
            .db
            .conn()
            .query_row(&sql, params![product_id], Self::map_row)
        {
            Ok(row) => Ok(Some(row)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(db_error("DB_QUERY_FAILED", &e.to_string())),
        }
    }

    pub fn list_active(&self) -> Result<Vec<FuelPriceRecordDto>, CommandErrorDto> {
        let sql = format!(
            "{} WHERE r.status = 'active' ORDER BY p.display_order ASC",
            Self::SELECT_FIELDS
        );
        self.query_list(&sql, params![])
    }

    pub fn list_scheduled_by_product(
        &self,
        product_id: &str,
    ) -> Result<Vec<FuelPriceRecordDto>, CommandErrorDto> {
        let sql = format!(
            "{} WHERE r.product_id = ?1 AND r.status = 'scheduled' ORDER BY r.effective_from ASC",
            Self::SELECT_FIELDS
        );
        self.query_list(&sql, params![product_id])
    }

    pub fn list_due_scheduled(
        &self,
        as_of_iso: &str,
    ) -> Result<Vec<FuelPriceRecordDto>, CommandErrorDto> {
        let sql = format!(
            "{} WHERE r.status = 'scheduled' AND r.effective_from <= ?1 ORDER BY r.effective_from ASC",
            Self::SELECT_FIELDS
        );
        self.query_list(&sql, params![as_of_iso])
    }

    pub fn list_history(
        &self,
        product_id: Option<&str>,
        from_iso: Option<&str>,
        to_iso: Option<&str>,
        limit: i64,
    ) -> Result<Vec<FuelPriceRecordDto>, CommandErrorDto> {
        let mut sql = format!(
            "{} WHERE r.status IN ('active', 'superseded', 'scheduled', 'cancelled')",
            Self::SELECT_FIELDS
        );
        let mut bind: Vec<String> = Vec::new();

        if let Some(pid) = product_id {
            sql.push_str(&format!(" AND r.product_id = ?{}", bind.len() + 1));
            bind.push(pid.to_string());
        }
        if let Some(from) = from_iso {
            sql.push_str(&format!(" AND r.effective_from >= ?{}", bind.len() + 1));
            bind.push(from.to_string());
        }
        if let Some(to) = to_iso {
            sql.push_str(&format!(" AND r.effective_from <= ?{}", bind.len() + 1));
            bind.push(to.to_string());
        }
        sql.push_str(" ORDER BY r.effective_from DESC");
        sql.push_str(&format!(" LIMIT ?{}", bind.len() + 1));
        bind.push(limit.to_string());

        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let params: Vec<&dyn rusqlite::ToSql> =
            bind.iter().map(|s| s as &dyn rusqlite::ToSql).collect();

        let rows = stmt
            .query_map(params.as_slice(), Self::map_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn save_new(
        &self,
        record: &FuelPriceRecordDto,
    ) -> Result<SaveFuelPriceRecordResponse, CommandErrorDto> {
        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let mut superseded_id: Option<String> = None;

        if record.status == "active" {
            if let Some(current) = Self::find_active_in_tx(&tx, &record.product_id)? {
                superseded_id = Some(current.id.clone());
                Self::supersede_tx(&tx, &current, &record.id, &record.effective_from_iso)?;
            }
        }

        Self::insert_tx(&tx, record)?;
        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        let saved = self.find_by_id(&record.id)?;
        let superseded = match superseded_id {
            Some(id) => Some(self.find_by_id(&id)?),
            None => None,
        };
        Ok(SaveFuelPriceRecordResponse {
            record: saved,
            superseded_record: superseded,
        })
    }

    pub fn update(&self, record: &FuelPriceRecordDto) -> Result<(), CommandErrorDto> {
        let conn = self.db.conn();
        let updated = conn
            .execute(
                "UPDATE fuel_price_records SET
                    status = ?2,
                    effective_to = ?3,
                    superseded_by_id = ?4,
                    is_locked = ?5,
                    updated_at = datetime('now'),
                    version = version + 1
                 WHERE id = ?1 AND version = ?6 AND is_locked = 0",
                params![
                    record.id,
                    record.status,
                    record.effective_to_iso,
                    record.superseded_by_id,
                    if record.is_locked { 1 } else { 0 },
                    record.version,
                ],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(CommandErrorDto {
                code: "CONFLICT".to_string(),
                message: "Price record was modified by another process or is locked.".to_string(),
                kind: "conflict".to_string(),
            });
        }
        Ok(())
    }

    pub fn save_batch(
        &self,
        id: &str,
        reason: Option<&str>,
        reference: Option<&str>,
        recorded_by: &str,
        created_at_iso: &str,
    ) -> Result<(), CommandErrorDto> {
        self.db
            .conn()
            .execute(
                "INSERT INTO fuel_price_change_batches (id, reason, reference, recorded_by, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, reason, reference, recorded_by, created_at_iso],
            )
            .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;
        Ok(())
    }

    pub fn log_blocked_edit(
        &self,
        action: &str,
        product_id: Option<&str>,
        price_record_id: Option<&str>,
        actor_id: &str,
        detail_json: &str,
        occurred_at_iso: &str,
        id: &str,
    ) -> Result<(), CommandErrorDto> {
        self.db
            .conn()
            .execute(
                "INSERT INTO fuel_price_audit_log
                 (id, action, product_id, price_record_id, actor_id, detail_json, occurred_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    id,
                    action,
                    product_id,
                    price_record_id,
                    actor_id,
                    detail_json,
                    occurred_at_iso
                ],
            )
            .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;
        Ok(())
    }

    fn query_list<P: rusqlite::Params>(
        &self,
        sql: &str,
        params: P,
    ) -> Result<Vec<FuelPriceRecordDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;
        let rows = stmt
            .query_map(params, Self::map_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;
        Ok(rows)
    }

    fn find_active_in_tx(
        tx: &Transaction<'_>,
        product_id: &str,
    ) -> Result<Option<FuelPriceRecordDto>, CommandErrorDto> {
        let sql = format!(
            "{} WHERE r.product_id = ?1 AND r.status = 'active' LIMIT 1",
            Self::SELECT_FIELDS
        );
        match tx.query_row(&sql, params![product_id], Self::map_row) {
            Ok(row) => Ok(Some(row)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(db_error("DB_QUERY_FAILED", &e.to_string())),
        }
    }

    fn insert_tx(tx: &Transaction<'_>, record: &FuelPriceRecordDto) -> Result<(), CommandErrorDto> {
        tx.execute(
            "INSERT INTO fuel_price_records
             (id, product_id, batch_id, price_per_litre_minor, effective_from, effective_to,
              status, reason, reference, recorded_by, superseded_by_id, is_locked,
              created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, datetime('now'), datetime('now'), ?13)",
            params![
                record.id,
                record.product_id,
                record.batch_id,
                record.price_per_litre_minor,
                record.effective_from_iso,
                record.effective_to_iso,
                record.status,
                record.reason,
                record.reference,
                record.recorded_by,
                record.superseded_by_id,
                if record.is_locked { 1 } else { 0 },
                record.version,
            ],
        )
        .map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                CommandErrorDto {
                    code: "DUPLICATE_PRICE_SLOT".to_string(),
                    message: "A price already exists for this product at the same effective time."
                        .to_string(),
                    kind: "conflict".to_string(),
                }
            } else {
                db_error("DB_INSERT_FAILED", &e.to_string())
            }
        })?;
        Ok(())
    }

    fn supersede_tx(
        tx: &Transaction<'_>,
        current: &FuelPriceRecordDto,
        new_id: &str,
        effective_to_iso: &str,
    ) -> Result<(), CommandErrorDto> {
        let updated = tx
            .execute(
                "UPDATE fuel_price_records SET
                    status = 'superseded',
                    effective_to = ?2,
                    superseded_by_id = ?3,
                    updated_at = datetime('now'),
                    version = version + 1
                 WHERE id = ?1 AND status = 'active' AND is_locked = 0",
                params![current.id, effective_to_iso, new_id],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(CommandErrorDto {
                code: "SUPERSESSION_FAILED".to_string(),
                message: "Could not supersede the current active price.".to_string(),
                kind: "conflict".to_string(),
            });
        }
        Ok(())
    }
}

fn map_query_error(id: &str) -> impl FnOnce(rusqlite::Error) -> CommandErrorDto {
    let id = id.to_string();
    move |e| match e {
        rusqlite::Error::QueryReturnedNoRows => CommandErrorDto {
            code: "NOT_FOUND".to_string(),
            message: format!("FuelPriceRecord with id \"{id}\" was not found."),
            kind: "not-found".to_string(),
        },
        _ => db_error("DB_QUERY_FAILED", &e.to_string()),
    }
}

fn db_error(code: &str, message: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.to_string(),
        kind: "infrastructure".to_string(),
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    use crate::db::connection::DbConnection;
    use crate::db::migrate::run_migrations;

    fn setup() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn sample_record(
        id: &str,
        product_id: &str,
        minor: i64,
        effective: &str,
        status: &str,
    ) -> FuelPriceRecordDto {
        FuelPriceRecordDto {
            id: id.to_string(),
            product_id: product_id.to_string(),
            product_code: "diesel".to_string(),
            price_per_litre_minor: minor,
            effective_from_iso: effective.to_string(),
            effective_to_iso: None,
            status: status.to_string(),
            reason: None,
            reference: None,
            recorded_by: "owner".to_string(),
            batch_id: None,
            superseded_by_id: None,
            is_locked: false,
            version: 1,
        }
    }

    #[test]
    fn save_new_active_supersedes_previous_active() {
        let db = setup();
        let repo = FuelPriceRepository::new(&db);

        let first = sample_record(
            "rec-1",
            "fuel-product-diesel",
            28000,
            "2026-01-01T00:00:00.000Z",
            "active",
        );
        repo.save_new(&first).unwrap();

        let second = sample_record(
            "rec-2",
            "fuel-product-diesel",
            29500,
            "2026-06-26T10:00:00.000Z",
            "active",
        );
        let result = repo.save_new(&second).unwrap();

        assert!(result.superseded_record.is_some());
        assert_eq!(
            result.superseded_record.as_ref().unwrap().status,
            "superseded"
        );

        let superseded = repo.find_by_id("rec-1").unwrap();
        assert_eq!(superseded.status, "superseded");
        assert_eq!(superseded.superseded_by_id.as_deref(), Some("rec-2"));

        let active = repo
            .find_active_by_product("fuel-product-diesel")
            .unwrap()
            .unwrap();
        assert_eq!(active.id, "rec-2");
        assert_eq!(active.price_per_litre_minor, 29500);
    }

    #[test]
    fn list_history_returns_records_for_product() {
        let db = setup();
        let repo = FuelPriceRepository::new(&db);

        repo.save_new(&sample_record(
            "rec-1",
            "fuel-product-petrol",
            26500,
            "2026-01-01T00:00:00.000Z",
            "active",
        ))
        .unwrap();
        repo.save_new(&sample_record(
            "rec-2",
            "fuel-product-petrol",
            25800,
            "2026-06-01T00:00:00.000Z",
            "active",
        ))
        .unwrap();

        let history = repo
            .list_history(Some("fuel-product-petrol"), None, None, 50)
            .unwrap();
        assert_eq!(history.len(), 2);
    }
}
