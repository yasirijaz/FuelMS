use rusqlite::{params, Row, Transaction};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::fuel_sale::{
    CommandErrorDto, FuelSaleDto, FuelSaleListQueryDto, PostFuelSaleInputDto, ProductStockDto,
    RecordFuelSaleInputDto, VoidFuelSaleInputDto,
};
use crate::repositories::person_ledger_repository::PersonLedgerRepository;
use crate::services::fifo::{allocate_fifo, FifoBatch, FifoError};

const VALID_PRODUCT_CODES: [&str; 3] = ["petrol", "diesel", "hobc"];
const VALID_PAYMENT_METHODS: [&str; 3] = ["cash", "credit", "card"];

pub struct FuelSaleRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> FuelSaleRepository<'a> {
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

    fn map_row(row: &Row<'_>) -> rusqlite::Result<FuelSaleDto> {
        Ok(FuelSaleDto {
            id: row.get("id")?,
            sale_date_iso: row.get("sale_date")?,
            product_id: row.get("product_id")?,
            product_code: row.get("product_code")?,
            customer_partner_id: row.get("customer_partner_id")?,
            customer_name: row.get("customer_name")?,
            quantity_milli_litres: row.get("quantity_milli_litres")?,
            unit_price_minor_per_litre: row.get("unit_price_minor_per_litre")?,
            fuel_price_record_id: row.get("fuel_price_record_id")?,
            total_revenue_minor: row.get("total_revenue_minor")?,
            total_cogs_minor: row.get("total_cogs_minor")?,
            payment_method: row.get("payment_method")?,
            reference: row.get("reference")?,
            notes: row.get("notes")?,
            status: row.get("status")?,
            recorded_by: row.get("recorded_by")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    const SELECT_SQL: &'static str =
        "SELECT fs.id, fs.sale_date, fs.product_id, p.code AS product_code,
             fs.customer_partner_id, bp.display_name AS customer_name,
             fs.quantity_milli_litres, fs.unit_price_minor_per_litre, fs.fuel_price_record_id,
             fs.total_revenue_minor, fs.total_cogs_minor, fs.payment_method, fs.reference, fs.notes,
             fs.status, fs.recorded_by, fs.created_at, fs.updated_at, fs.version
      FROM fuel_sales fs
      INNER JOIN fuel_products p ON p.id = fs.product_id
      LEFT JOIN business_partners bp ON bp.id = fs.customer_partner_id";

    pub fn list(&self, query: &FuelSaleListQueryDto) -> Result<Vec<FuelSaleDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = format!("{} WHERE 1=1", Self::SELECT_SQL);

        if query
            .status
            .as_ref()
            .is_some_and(|s| s != "all" && !s.is_empty())
        {
            sql.push_str(" AND fs.status = ?");
        }

        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            sql.push_str(
                " AND (LOWER(COALESCE(bp.display_name, '')) LIKE ?
                    OR LOWER(COALESCE(fs.reference, '')) LIKE ?)",
            );
        }

        if query
            .from_date_iso
            .as_ref()
            .is_some_and(|s| !s.trim().is_empty())
        {
            sql.push_str(" AND date(fs.sale_date) >= date(?)");
        }

        if query
            .to_date_iso
            .as_ref()
            .is_some_and(|s| !s.trim().is_empty())
        {
            sql.push_str(" AND date(fs.sale_date) <= date(?)");
        }

        sql.push_str(" ORDER BY fs.sale_date DESC, fs.created_at DESC");

        let search_pattern = query
            .search
            .as_ref()
            .map(|s| format!("%{}%", s.trim().to_lowercase()))
            .unwrap_or_default();

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if query
            .status
            .as_ref()
            .is_some_and(|s| s != "all" && !s.is_empty())
        {
            params.push(Box::new(query.status.clone()));
        }

        if query.search.as_ref().is_some_and(|s| !s.trim().is_empty()) {
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
        }

        if query
            .from_date_iso
            .as_ref()
            .is_some_and(|s| !s.trim().is_empty())
        {
            params.push(Box::new(query.from_date_iso.clone()));
        }

        if query
            .to_date_iso
            .as_ref()
            .is_some_and(|s| !s.trim().is_empty())
        {
            params.push(Box::new(query.to_date_iso.clone()));
        }

        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

        let rows = stmt
            .query_map(param_refs.as_slice(), Self::map_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_by_id(&self, id: &str) -> Result<FuelSaleDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE fs.id = ?1", Self::SELECT_SQL);
        conn.query_row(&sql, params![id], Self::map_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("FuelSale", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })
    }

    pub fn available_stock_by_product(
        &self,
        product_code: &str,
    ) -> Result<ProductStockDto, CommandErrorDto> {
        let product_id = self.product_id_for_code(product_code)?;
        let conn = self.db.conn();
        let available: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(remaining_milli_litres), 0)
                 FROM fuel_inventory_batches WHERE product_id = ?1 AND remaining_milli_litres > 0",
                params![product_id],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        Ok(ProductStockDto {
            product_code: product_code.to_string(),
            available_milli_litres: available,
        })
    }

    fn compute_revenue(quantity_milli: i64, unit_price_minor: i64) -> i64 {
        (quantity_milli * unit_price_minor) / 1000
    }

    fn validate_record_input(
        &self,
        input: &RecordFuelSaleInputDto,
    ) -> Result<(String, i64), CommandErrorDto> {
        if input.quantity_milli_litres <= 0 {
            return Err(conflict(
                "INVALID_QUANTITY",
                "Quantity must be greater than zero.",
            ));
        }
        if input.unit_price_minor_per_litre <= 0 {
            return Err(conflict(
                "INVALID_PRICE",
                "Selling price must be greater than zero.",
            ));
        }
        if !VALID_PAYMENT_METHODS.contains(&input.payment_method.as_str()) {
            return Err(conflict(
                "INVALID_PAYMENT_METHOD",
                "Invalid payment method.",
            ));
        }
        if input.payment_method == "credit" && input.customer_partner_id.is_none() {
            return Err(conflict(
                "CUSTOMER_REQUIRED",
                "Customer is required for credit sales.",
            ));
        }

        let product_id = self.product_id_for_code(&input.product_code)?;
        let conn = self.db.conn();

        let price_valid: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM fuel_price_records
                 WHERE id = ?1 AND product_id = ?2 AND status = 'active'",
                params![input.fuel_price_record_id, product_id],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;
        if price_valid == 0 {
            return Err(conflict(
                "INVALID_PRICE_RECORD",
                "Active fuel price record is required for this product.",
            ));
        }

        if let Some(ref customer_id) = input.customer_partner_id {
            let exists: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM business_partners
                     WHERE id = ?1 AND deleted_at IS NULL AND is_active = 1",
                    params![customer_id],
                    |row| row.get(0),
                )
                .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;
            if exists == 0 {
                return Err(not_found("BusinessPartner", customer_id));
            }
        }

        let total_revenue = Self::compute_revenue(
            input.quantity_milli_litres,
            input.unit_price_minor_per_litre,
        );
        if total_revenue <= 0 {
            return Err(conflict(
                "INVALID_TOTAL",
                "Sale total must be greater than zero.",
            ));
        }

        Ok((product_id, total_revenue))
    }

    fn load_fifo_batches_tx(
        tx: &Transaction<'_>,
        product_id: &str,
    ) -> Result<Vec<FifoBatch>, CommandErrorDto> {
        let mut stmt = tx
            .prepare(
                "SELECT id, remaining_milli_litres, unit_cost_minor_per_litre
                 FROM fuel_inventory_batches
                 WHERE product_id = ?1 AND remaining_milli_litres > 0
                 ORDER BY received_at ASC, created_at ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map(params![product_id], |row| {
                Ok(FifoBatch {
                    id: row.get(0)?,
                    remaining_milli_litres: row.get(1)?,
                    unit_cost_minor_per_litre: row.get(2)?,
                })
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    fn apply_fifo_consumption_tx(
        tx: &Transaction<'_>,
        sale_id: &str,
        product_id: &str,
        quantity_milli: i64,
        now: &str,
    ) -> Result<i64, CommandErrorDto> {
        let batches = Self::load_fifo_batches_tx(tx, product_id)?;
        let consumptions = allocate_fifo(&batches, quantity_milli).map_err(map_fifo_error)?;

        let mut total_cogs = 0i64;
        for line in consumptions {
            total_cogs += line.cost_minor;
            let consumption_id = format!("sc-{}", Uuid::new_v4());
            tx.execute(
                "INSERT INTO fuel_sale_batch_consumptions
                 (id, sale_id, batch_id, quantity_milli_litres, unit_cost_minor_per_litre, cost_minor, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    consumption_id,
                    sale_id,
                    line.batch_id,
                    line.quantity_milli_litres,
                    line.unit_cost_minor_per_litre,
                    line.cost_minor,
                    now,
                ],
            )
            .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

            tx.execute(
                "UPDATE fuel_inventory_batches
                 SET remaining_milli_litres = remaining_milli_litres - ?2,
                     updated_at = ?3,
                     version = version + 1
                 WHERE id = ?1",
                params![line.batch_id, line.quantity_milli_litres, now],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;
        }

        Ok(total_cogs)
    }

    fn lock_price_record_tx(
        tx: &Transaction<'_>,
        price_record_id: &str,
        now: &str,
    ) -> Result<(), CommandErrorDto> {
        tx.execute(
            "UPDATE fuel_price_records
             SET is_locked = 1, updated_at = ?2, version = version + 1
             WHERE id = ?1 AND is_locked = 0",
            params![price_record_id, now],
        )
        .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;
        Ok(())
    }

    pub fn record(&self, input: &RecordFuelSaleInputDto) -> Result<FuelSaleDto, CommandErrorDto> {
        let (product_id, total_revenue) = self.validate_record_input(input)?;

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let id = format!("fs-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        tx.execute(
            "INSERT INTO fuel_sales
             (id, sale_date, product_id, customer_partner_id, quantity_milli_litres,
              unit_price_minor_per_litre, fuel_price_record_id, total_revenue_minor, total_cogs_minor,
              payment_method, reference, notes, status, recorded_by, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, ?9, ?10, ?11, 'draft', ?12, ?13, ?13, 1)",
            params![
                id,
                input.sale_date_iso,
                product_id,
                input.customer_partner_id,
                input.quantity_milli_litres,
                input.unit_price_minor_per_litre,
                input.fuel_price_record_id,
                total_revenue,
                input.payment_method,
                input.reference.as_deref().map(str::trim),
                input.notes.as_deref().map(str::trim),
                input.recorded_by,
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        if input.post_immediately {
            let total_cogs = Self::apply_fifo_consumption_tx(
                &tx,
                &id,
                &product_id,
                input.quantity_milli_litres,
                &now,
            )?;
            Self::lock_price_record_tx(&tx, &input.fuel_price_record_id, &now)?;

            tx.execute(
                "UPDATE fuel_sales
                 SET status = 'posted', total_cogs_minor = ?2, updated_at = ?3
                 WHERE id = ?1",
                params![id, total_cogs, now],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

            if input.payment_method == "credit" {
                if let Some(ref customer_id) = input.customer_partner_id {
                    PersonLedgerRepository::append_credit_sale_tx(
                        &tx,
                        customer_id,
                        &id,
                        total_revenue,
                        &input.sale_date_iso,
                        &input.recorded_by,
                        input.reference.as_deref(),
                    )
                    .map_err(map_person_ledger_error)?;
                }
            }
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&id)
    }

    pub fn post(&self, input: &PostFuelSaleInputDto) -> Result<FuelSaleDto, CommandErrorDto> {
        let existing = self.find_by_id(&input.sale_id)?;
        if existing.status != "draft" {
            return Err(conflict(
                "SALE_NOT_DRAFT",
                "Only draft sales can be posted.",
            ));
        }

        let conn = self.db.conn();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| db_error("TX_BEGIN_FAILED", &e.to_string()))?;

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let total_cogs = Self::apply_fifo_consumption_tx(
            &tx,
            &existing.id,
            &existing.product_id,
            existing.quantity_milli_litres,
            &now,
        )?;
        Self::lock_price_record_tx(&tx, &existing.fuel_price_record_id, &now)?;

        let updated = tx
            .execute(
                "UPDATE fuel_sales
                 SET status = 'posted', total_cogs_minor = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4 AND status = 'draft'",
                params![input.sale_id, total_cogs, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "SALE_VERSION_CONFLICT",
                "Sale was modified by another process. Refresh and try again.",
            ));
        }

        if existing.payment_method == "credit" {
            if let Some(ref customer_id) = existing.customer_partner_id {
                PersonLedgerRepository::append_credit_sale_tx(
                    &tx,
                    customer_id,
                    &existing.id,
                    existing.total_revenue_minor,
                    &existing.sale_date_iso,
                    &existing.recorded_by,
                    existing.reference.as_deref(),
                )
                .map_err(map_person_ledger_error)?;
            }
        }

        tx.commit()
            .map_err(|e| db_error("TX_COMMIT_FAILED", &e.to_string()))?;

        self.find_by_id(&input.sale_id)
    }

    pub fn void_sale(&self, input: &VoidFuelSaleInputDto) -> Result<FuelSaleDto, CommandErrorDto> {
        let existing = self.find_by_id(&input.sale_id)?;
        if existing.status != "draft" {
            return Err(conflict(
                "SALE_NOT_DRAFT",
                "Only draft sales can be voided.",
            ));
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE fuel_sales
                 SET status = 'void', updated_at = ?2, version = version + 1
                 WHERE id = ?1 AND version = ?3 AND status = 'draft'",
                params![input.sale_id, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "SALE_VERSION_CONFLICT",
                "Sale was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.sale_id)
    }
}

fn map_fifo_error(error: FifoError) -> CommandErrorDto {
    match error {
        FifoError::InsufficientStock { .. } => conflict("INSUFFICIENT_STOCK", error.message()),
        FifoError::InvalidQuantity => conflict("INVALID_QUANTITY", error.message()),
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
    use crate::dto::fuel_purchase::RecordFuelPurchaseInputDto;
    use crate::repositories::business_partner_repository::BusinessPartnerRepository;
    use crate::repositories::fuel_purchase_repository::FuelPurchaseRepository;

    fn setup() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn seed_price(db: &DbConnection, product_code: &str) -> String {
        let conn = db.conn();
        let product_id: String = conn
            .query_row(
                "SELECT id FROM fuel_products WHERE code = ?1",
                params![product_code],
                |row| row.get(0),
            )
            .unwrap();
        let price_id = "price-diesel-active";
        let now = "2026-06-26T10:00:00.000Z";
        conn.execute(
            "INSERT INTO fuel_price_records
             (id, product_id, price_per_litre_minor, effective_from, status, recorded_by, created_at, updated_at)
             VALUES (?1, ?2, 29500, ?3, 'active', 'owner', ?3, ?3)",
            params![price_id, product_id, now],
        )
        .unwrap();
        price_id.to_string()
    }

    fn seed_stock(db: &DbConnection, supplier_id: &str) -> String {
        let repo = FuelPurchaseRepository::new(db);
        let posted = repo
            .record(&RecordFuelPurchaseInputDto {
                purchase_date_iso: "2026-06-26T09:00:00.000Z".to_string(),
                product_code: "diesel".to_string(),
                supplier_partner_id: Some(supplier_id.to_string()),
                quantity_milli_litres: 10_000_000,
                unit_cost_minor_per_litre: 28000,
                invoice_reference: None,
                payment_status: "paid".to_string(),
                notes: None,
                post_immediately: true,
                recorded_by: "owner".to_string(),
            })
            .unwrap();
        posted.batch_id.unwrap()
    }

    #[test]
    fn record_sale_consumes_fifo_and_locks_price() {
        let db = setup();
        let supplier = BusinessPartnerRepository::new(&db)
            .create(&CreateBusinessPartnerInputDto {
                display_name: "Supplier".to_string(),
                legal_name: None,
                phone: None,
                email: None,
                tax_id: None,
                address: None,
                notes: None,
                roles: vec!["supplier".to_string()],
            })
            .unwrap();
        seed_stock(&db, &supplier.id);
        let price_id = seed_price(&db, "diesel");

        let repo = FuelSaleRepository::new(&db);
        let sale = repo
            .record(&RecordFuelSaleInputDto {
                sale_date_iso: "2026-06-26T11:00:00.000Z".to_string(),
                product_code: "diesel".to_string(),
                customer_partner_id: None,
                quantity_milli_litres: 2_000_000,
                unit_price_minor_per_litre: 29500,
                fuel_price_record_id: price_id,
                payment_method: "cash".to_string(),
                reference: None,
                notes: None,
                post_immediately: true,
                recorded_by: "owner".to_string(),
            })
            .unwrap();

        assert_eq!(sale.status, "posted");
        assert!(sale.total_cogs_minor > 0);

        let remaining: i64 = db
            .conn()
            .query_row(
                "SELECT remaining_milli_litres FROM fuel_inventory_batches LIMIT 1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(remaining, 8_000_000);

        let locked: i64 = db
            .conn()
            .query_row(
                "SELECT is_locked FROM fuel_price_records WHERE id = ?1",
                params![sale.fuel_price_record_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(locked, 1);
    }
}
