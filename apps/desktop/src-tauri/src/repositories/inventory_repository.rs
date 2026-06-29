use rusqlite::{params, Row};

use crate::db::connection::DbConnection;
use crate::dto::inventory::{
    CommandErrorDto, InventoryBatchDto, InventoryBatchListQueryDto, InventoryMovementDto,
    InventoryMovementListQueryDto, InventoryProductSummaryDto,
};

pub struct InventoryRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> InventoryRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn product_summary(&self) -> Result<Vec<InventoryProductSummaryDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT p.code AS product_code,
                        COALESCE(SUM(b.remaining_milli_litres), 0) AS quantity_milli,
                        COALESCE(SUM((b.remaining_milli_litres * b.unit_cost_minor_per_litre) / 1000), 0) AS valuation_minor,
                        COUNT(b.id) AS batch_count
                 FROM fuel_products p
                 LEFT JOIN fuel_inventory_batches b
                   ON b.product_id = p.id AND b.remaining_milli_litres > 0
                 WHERE p.is_active = 1
                 GROUP BY p.id, p.code, p.display_order
                 ORDER BY p.display_order ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(InventoryProductSummaryDto {
                    product_code: row.get(0)?,
                    quantity_milli_litres: row.get(1)?,
                    valuation_minor: row.get(2)?,
                    batch_count: row.get(3)?,
                })
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn list_batches(
        &self,
        query: &InventoryBatchListQueryDto,
    ) -> Result<Vec<InventoryBatchDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut sql = String::from(
            "SELECT b.id, p.code AS product_code, b.received_at, b.quantity_milli_litres,
                    b.remaining_milli_litres, b.unit_cost_minor_per_litre,
                    (b.remaining_milli_litres * b.unit_cost_minor_per_litre) / 1000 AS valuation_minor,
                    bp.display_name AS supplier_name, b.purchase_id
             FROM fuel_inventory_batches b
             INNER JOIN fuel_products p ON p.id = b.product_id
             LEFT JOIN fuel_purchases fp ON fp.id = b.purchase_id
             LEFT JOIN business_partners bp ON bp.id = fp.supplier_partner_id
             WHERE 1=1",
        );

        let mut bind_product = false;
        if query.product_code.is_some() {
            sql.push_str(" AND p.code = ?");
            bind_product = true;
        }
        if query.active_only.unwrap_or(true) {
            sql.push_str(" AND b.remaining_milli_litres > 0");
        }
        sql.push_str(" ORDER BY b.received_at ASC, b.created_at ASC");

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let map_row = |row: &Row<'_>| -> rusqlite::Result<InventoryBatchDto> {
            Ok(InventoryBatchDto {
                id: row.get("id")?,
                product_code: row.get("product_code")?,
                received_at_iso: row.get("received_at")?,
                quantity_milli_litres: row.get("quantity_milli_litres")?,
                remaining_milli_litres: row.get("remaining_milli_litres")?,
                unit_cost_minor_per_litre: row.get("unit_cost_minor_per_litre")?,
                valuation_minor: row.get("valuation_minor")?,
                supplier_name: row.get("supplier_name")?,
                purchase_id: row.get("purchase_id")?,
            })
        };

        let rows = if bind_product {
            stmt.query_map(params![query.product_code.as_ref().unwrap()], map_row)
        } else {
            stmt.query_map([], map_row)
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn list_movements(
        &self,
        query: &InventoryMovementListQueryDto,
    ) -> Result<Vec<InventoryMovementDto>, CommandErrorDto> {
        let limit = query.limit.unwrap_or(50).clamp(1, 500);
        let conn = self.db.conn();

        let mut receipts_sql = String::from(
            "SELECT b.id, 'receipt' AS kind, b.received_at AS occurred_at, p.code AS product_code,
                    b.quantity_milli_litres AS quantity_milli,
                    COALESCE('Purchase ' || fp.id, 'Batch ' || b.id) AS reference_label
             FROM fuel_inventory_batches b
             INNER JOIN fuel_products p ON p.id = b.product_id
             LEFT JOIN fuel_purchases fp ON fp.id = b.purchase_id
             WHERE 1=1",
        );
        let mut consumptions_sql = String::from(
            "SELECT sc.id, 'consumption' AS kind, sc.created_at AS occurred_at, p.code AS product_code,
                    -sc.quantity_milli_litres AS quantity_milli,
                    'Sale ' || fs.id AS reference_label
             FROM fuel_sale_batch_consumptions sc
             INNER JOIN fuel_inventory_batches b ON b.id = sc.batch_id
             INNER JOIN fuel_products p ON p.id = b.product_id
             INNER JOIN fuel_sales fs ON fs.id = sc.sale_id
             WHERE 1=1",
        );

        if query.product_code.is_some() {
            receipts_sql.push_str(" AND p.code = ?1");
            consumptions_sql.push_str(" AND p.code = ?1");
        }

        let sql = format!(
            "SELECT * FROM (
                {receipts_sql}
                UNION ALL
                {consumptions_sql}
             ) ORDER BY occurred_at DESC LIMIT ?{}",
            if query.product_code.is_some() { 2 } else { 1 }
        );

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        fn map_movement_row(row: &Row<'_>) -> rusqlite::Result<InventoryMovementDto> {
            Ok(InventoryMovementDto {
                id: row.get(0)?,
                kind: row.get(1)?,
                occurred_at_iso: row.get(2)?,
                product_code: row.get(3)?,
                quantity_milli_litres: row.get(4)?,
                reference_label: row.get(5)?,
            })
        }

        let rows = if let Some(ref code) = query.product_code {
            stmt.query_map(params![code, limit], map_movement_row)
        } else {
            stmt.query_map(params![limit], map_movement_row)
        }
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
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
mod tests {
    use super::*;
    use crate::db::connection::DbConnection;
    use crate::db::migrate::run_migrations;

    #[test]
    fn summary_lists_all_products() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        let repo = InventoryRepository::new(&conn);
        let summary = repo.product_summary().unwrap();
        assert_eq!(summary.len(), 3);
    }
}
