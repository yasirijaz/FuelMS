use rusqlite::{params, Row};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::fuel_purchase::{
    CommandErrorDto, FuelPurchaseDto, FuelPurchaseListQueryDto, PostFuelPurchaseInputDto,
    RecordFuelPurchaseInputDto, VoidFuelPurchaseInputDto,
};
use crate::repositories::person_ledger_repository::PersonLedgerRepository;

const VALID_PRODUCT_CODES: [&str; 3] = ["petrol", "diesel", "hobc"];

pub struct FuelPurchaseRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> FuelPurchaseRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn product_id_for_code(&self, code: &str) -> Result<String, CommandErrorDto> {
        if !VALID_PRODUCT_CODES.contains(&code) {
            return Err(conflict("INVALID_PRODUCT", "Invalid fuel product."));
        }
        let conn = self.db.conn();
        conn.query_row(
            "SELECT id FROM fuel_products WHERE code = ?1 AND is_active = 1",
            params![code],
            |row| row.get(0),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => not_found("FuelProduct", code),
            _ => db_error("DB_QUERY_FAILED", &e.to_string()),
        })
    }

    fn map_row(row: &Row<'_>) -> rusqlite::Result<FuelPurchaseDto> {
        Ok(FuelPurchaseDto {
            id: row.get("id")?,
            purchase_date_iso: row.get("purchase_date")?,
            product_id: row.get("product_id")?,
            product_code: row.get("product_code")?,
            supplier_partner_id: row.get("supplier_partner_id")?,
            supplier_name: row.get("supplier_name")?,
            quantity_milli_litres: row.get("quantity_milli_litres")?,
            unit_cost_minor_per_litre: row.get("unit_cost_minor_per_litre")?,
            total_cost_minor: row.get("total_cost_minor")?,
            invoice_reference: row.get("invoice_reference")?,
            payment_status: row.get("payment_status")?,
            notes: row.get("notes")?,
            status: row.get("status")?,
            batch_id: row.get("batch_id")?,
            recorded_by: row.get("recorded_by")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    const SELECT_SQL: &'static str =
        "SELECT fp.id, fp.purchase_date, fp.product_id, p.code AS product_code,
             fp.supplier_partner_id, bp.display_name AS supplier_name,
             fp.quantity_milli_litres, fp.unit_cost_minor_per_litre, fp.total_cost_minor,
             fp.invoice_reference, fp.payment_status, fp.notes, fp.status, fp.batch_id,
             fp.recorded_by, fp.created_at, fp.updated_at, fp.version
      FROM fuel_purchases fp
      INNER JOIN fuel_products p ON p.id = fp.product_id
      LEFT JOIN business_partners bp ON bp.id = fp.supplier_partner_id";

    pub fn list(
        &self,
        query: &FuelPurchaseListQueryDto,
    ) -> Result<Vec<FuelPurchaseDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = format!("{} WHERE 1=1", Self::SELECT_SQL);
        let mut bind_search = false;
        let mut bind_status = false;

        if query
            .status
            .as_ref()
            .is_some_and(|s| s != "all" && !s.is_empty())
        {
            sql.push_str(" AND fp.status = ?");
            bind_status = true;
        }

        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            sql.push_str(
                " AND (LOWER(COALESCE(bp.display_name, '')) LIKE ?
                    OR LOWER(COALESCE(fp.invoice_reference, '')) LIKE ?)",
            );
            bind_search = true;
        }

        sql.push_str(" ORDER BY fp.purchase_date DESC, fp.created_at DESC");

        let search_pattern = query
            .search
            .as_ref()
            .map(|s| format!("%{}%", s.trim().to_lowercase()))
            .unwrap_or_default();

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = if bind_status && bind_search {
            stmt.query_map(
                params![
                    query.status.as_ref().unwrap(),
                    search_pattern,
                    search_pattern
                ],
                Self::map_row,
            )
        } else if bind_status {
            stmt.query_map(params![query.status.as_ref().unwrap()], Self::map_row)
        } else if bind_search {
            stmt.query_map(params![search_pattern, search_pattern], Self::map_row)
        } else {
            stmt.query_map([], Self::map_row)
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_by_id(&self, id: &str) -> Result<FuelPurchaseDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE fp.id = ?1", Self::SELECT_SQL);
        conn.query_row(&sql, params![id], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("FuelPurchase", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    fn compute_total(quantity_milli: i64, unit_cost_minor: i64) -> i64 {
        (quantity_milli * unit_cost_minor) / 1000
    }

    fn validate_record_input(
        &self,
        input: &RecordFuelPurchaseInputDto,
    ) -> Result<String, CommandErrorDto> {
        if input.quantity_milli_litres <= 0 {
            return Err(conflict(
                "INVALID_QUANTITY",
                "Quantity must be greater than zero.",
            ));
        }
        if input.unit_cost_minor_per_litre <= 0 {
            return Err(conflict(
                "INVALID_RATE",
                "Purchase rate must be greater than zero.",
            ));
        }
        if input.payment_status != "paid" && input.payment_status != "credit" {
            return Err(conflict(
                "INVALID_PAYMENT_STATUS",
                "Invalid payment status.",
            ));
        }
        if input.payment_status == "credit" && input.supplier_partner_id.is_none() {
            return Err(conflict(
                "SUPPLIER_REQUIRED",
                "Supplier is required for credit purchases.",
            ));
        }

        let product_id = self.product_id_for_code(&input.product_code)?;

        if let Some(ref supplier_id) = input.supplier_partner_id {
            let conn = self.db.conn();
            let exists: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM business_partners
                     WHERE id = ?1 AND deleted_at IS NULL AND is_active = 1",
                    params![supplier_id],
                    |row| row.get(0),
                )
                .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;
            if exists == 0 {
                return Err(not_found("BusinessPartner", supplier_id));
            }
        }

        Ok(product_id)
    }

    pub fn record(
        &self,
        input: &RecordFuelPurchaseInputDto,
    ) -> Result<FuelPurchaseDto, CommandErrorDto> {
        let product_id = self.validate_record_input(input)?;
        let total_cost_minor =
            Self::compute_total(input.quantity_milli_litres, input.unit_cost_minor_per_litre);
        if total_cost_minor <= 0 {
            return Err(conflict(
                "INVALID_TOTAL",
                "Purchase total must be greater than zero.",
            ));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let id = format!("fp-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let status = if input.post_immediately {
            "posted"
        } else {
            "draft"
        };
        let mut batch_id: Option<String> = None;

        if input.post_immediately {
            batch_id = Some(self.insert_batch_tx(
                &tx,
                &product_id,
                &id,
                input.supplier_partner_id.as_deref(),
                &input.purchase_date_iso,
                input.quantity_milli_litres,
                input.unit_cost_minor_per_litre,
                &now,
            )?);
        }

        tx.execute(
            "INSERT INTO fuel_purchases
             (id, purchase_date, product_id, supplier_partner_id, quantity_milli_litres,
              unit_cost_minor_per_litre, total_cost_minor, invoice_reference, payment_status,
              notes, status, batch_id, recorded_by, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14, 1)",
            params![
                id,
                input.purchase_date_iso,
                product_id,
                input.supplier_partner_id,
                input.quantity_milli_litres,
                input.unit_cost_minor_per_litre,
                total_cost_minor,
                input.invoice_reference.as_deref().map(str::trim),
                input.payment_status,
                input.notes.as_deref().map(str::trim),
                status,
                batch_id,
                input.recorded_by,
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        if input.post_immediately && input.payment_status == "credit" {
            if let Some(ref supplier_id) = input.supplier_partner_id {
                PersonLedgerRepository::append_credit_purchase_tx(
                    &tx,
                    supplier_id,
                    &id,
                    total_cost_minor,
                    &input.purchase_date_iso,
                    &input.recorded_by,
                    input.invoice_reference.as_deref(),
                )
                .map_err(map_person_ledger_error)?;
            }
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&id)
    }

    fn insert_batch_tx(
        &self,
        tx: &rusqlite::Transaction<'_>,
        product_id: &str,
        purchase_id: &str,
        supplier_partner_id: Option<&str>,
        received_at: &str,
        quantity_milli: i64,
        unit_cost_minor: i64,
        now: &str,
    ) -> Result<String, CommandErrorDto> {
        let batch_id = format!("fb-{}", Uuid::new_v4());
        tx.execute(
            "INSERT INTO fuel_inventory_batches
             (id, product_id, purchase_id, supplier_partner_id, received_at,
              quantity_milli_litres, remaining_milli_litres, unit_cost_minor_per_litre,
              created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?8, ?8, 1)",
            params![
                batch_id,
                product_id,
                purchase_id,
                supplier_partner_id,
                received_at,
                quantity_milli,
                unit_cost_minor,
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;
        Ok(batch_id)
    }

    pub fn post(
        &self,
        input: &PostFuelPurchaseInputDto,
    ) -> Result<FuelPurchaseDto, CommandErrorDto> {
        let existing = self.find_by_id(&input.purchase_id)?;
        if existing.status != "draft" {
            return Err(conflict(
                "PURCHASE_NOT_DRAFT",
                "Only draft purchases can be posted.",
            ));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let batch_id = self.insert_batch_tx(
            &tx,
            &existing.product_id,
            &existing.id,
            existing.supplier_partner_id.as_deref(),
            &existing.purchase_date_iso,
            existing.quantity_milli_litres,
            existing.unit_cost_minor_per_litre,
            &now,
        )?;

        let updated = tx
            .execute(
                "UPDATE fuel_purchases
                 SET status = 'posted', batch_id = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4 AND status = 'draft'",
                params![input.purchase_id, batch_id, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "PURCHASE_VERSION_CONFLICT",
                "Purchase was modified by another process. Refresh and try again.",
            ));
        }

        if existing.payment_status == "credit" {
            if let Some(ref supplier_id) = existing.supplier_partner_id {
                PersonLedgerRepository::append_credit_purchase_tx(
                    &tx,
                    supplier_id,
                    &existing.id,
                    existing.total_cost_minor,
                    &existing.purchase_date_iso,
                    &existing.recorded_by,
                    existing.invoice_reference.as_deref(),
                )
                .map_err(map_person_ledger_error)?;
            }
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&input.purchase_id)
    }

    pub fn void_purchase(
        &self,
        input: &VoidFuelPurchaseInputDto,
    ) -> Result<FuelPurchaseDto, CommandErrorDto> {
        let existing = self.find_by_id(&input.purchase_id)?;
        if existing.status != "draft" {
            return Err(conflict(
                "PURCHASE_NOT_DRAFT",
                "Only draft purchases can be voided.",
            ));
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE fuel_purchases
                 SET status = 'void', updated_at = ?2, version = version + 1
                 WHERE id = ?1 AND version = ?3 AND status = 'draft'",
                params![input.purchase_id, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "PURCHASE_VERSION_CONFLICT",
                "Purchase was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.purchase_id)
    }
}

fn map_person_ledger_error(error: crate::dto::person_ledger::CommandErrorDto) -> CommandErrorDto {
    CommandErrorDto {
        code: error.code,
        message: error.message,
        kind: error.kind,
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
    use crate::dto::business_partner::CreateBusinessPartnerInputDto;
    use crate::repositories::business_partner_repository::BusinessPartnerRepository;

    fn setup() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn seed_supplier(db: &DbConnection) -> String {
        let repo = BusinessPartnerRepository::new(db);
        let partner = repo
            .create(&CreateBusinessPartnerInputDto {
                display_name: "National Oil Co.".to_string(),
                legal_name: None,
                phone: None,
                email: None,
                tax_id: None,
                address: None,
                notes: None,
                roles: vec!["supplier".to_string()],
            })
            .unwrap();
        partner.id
    }

    #[test]
    fn record_and_post_purchase_creates_batch() {
        let db = setup();
        let supplier_id = seed_supplier(&db);
        let repo = FuelPurchaseRepository::new(&db);

        let draft = repo
            .record(&RecordFuelPurchaseInputDto {
                purchase_date_iso: "2026-06-26T10:00:00.000Z".to_string(),
                product_code: "diesel".to_string(),
                supplier_partner_id: Some(supplier_id),
                quantity_milli_litres: 5000000,
                unit_cost_minor_per_litre: 28000,
                invoice_reference: Some("INV-1001".to_string()),
                payment_status: "credit".to_string(),
                notes: None,
                post_immediately: false,
                recorded_by: "owner".to_string(),
            })
            .unwrap();

        assert_eq!(draft.status, "draft");
        assert!(draft.batch_id.is_none());

        let posted = repo
            .post(&PostFuelPurchaseInputDto {
                purchase_id: draft.id.clone(),
                version: draft.version,
            })
            .unwrap();

        assert_eq!(posted.status, "posted");
        assert!(posted.batch_id.is_some());

        let batch_count: i64 = db
            .conn()
            .query_row("SELECT COUNT(*) FROM fuel_inventory_batches", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(batch_count, 1);
    }
}
