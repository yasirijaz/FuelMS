use rusqlite::{params, Row};

use crate::db::connection::DbConnection;
use crate::dto::fuel_price::{CommandErrorDto, FuelProductDto};

pub struct FuelProductRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> FuelProductRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    fn map_row(row: &Row<'_>) -> rusqlite::Result<FuelProductDto> {
        Ok(FuelProductDto {
            id: row.get("id")?,
            code: row.get("code")?,
            name: row.get("name")?,
            unit: row.get("unit")?,
            display_order: row.get("display_order")?,
        })
    }

    pub fn list_active(&self) -> Result<Vec<FuelProductDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT id, code, name, unit, display_order
                 FROM fuel_products
                 WHERE is_active = 1
                 ORDER BY display_order ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map([], Self::map_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    pub fn find_by_code(&self, code: &str) -> Result<FuelProductDto, CommandErrorDto> {
        let conn = self.db.conn();
        conn.query_row(
            "SELECT id, code, name, unit, display_order
             FROM fuel_products WHERE code = ?1 AND is_active = 1",
            params![code],
            Self::map_row,
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => not_found("FuelProduct", code),
            _ => db_error("DB_QUERY_FAILED", &e.to_string()),
        })
    }

    pub fn find_by_id(&self, id: &str) -> Result<FuelProductDto, CommandErrorDto> {
        let conn = self.db.conn();
        conn.query_row(
            "SELECT id, code, name, unit, display_order
             FROM fuel_products WHERE id = ?1 AND is_active = 1",
            params![id],
            Self::map_row,
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => not_found("FuelProduct", id),
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
        message: format!("{entity} with id \"{id}\" was not found."),
        kind: "not-found".to_string(),
    }
}
