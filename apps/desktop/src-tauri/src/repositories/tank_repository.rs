use rusqlite::{params, Row};
use uuid::Uuid;

use crate::db::connection::DbConnection;
use crate::dto::tank::{
    CommandErrorDto, CreateFuelTankInputDto, FuelTankDto, RecordTankDipInputDto,
    TankDipReadingDto, TankVersionInputDto, UpdateFuelTankInputDto,
};
const VALID_PRODUCT_CODES: [&str; 3] = ["petrol", "diesel", "hobc"];

pub struct TankRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> TankRepository<'a> {
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

    fn book_milli_for_product(&self, product_id: &str) -> Result<i64, CommandErrorDto> {
        let conn = self.db.conn();
        conn.query_row(
            "SELECT COALESCE(SUM(remaining_milli_litres), 0)
             FROM fuel_inventory_batches WHERE product_id = ?1",
            params![product_id],
            |row| row.get(0),
        )
        .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))
    }

    fn last_dip_for_tank(&self, tank_id: &str) -> Result<(Option<i64>, Option<String>), CommandErrorDto> {
        let conn = self.db.conn();
        match conn.query_row(
            "SELECT quantity_milli_litres, reading_at FROM tank_dip_readings
             WHERE tank_id = ?1 ORDER BY reading_at DESC LIMIT 1",
            params![tank_id],
            |row| Ok((Some(row.get(0)?), Some(row.get(1)?))),
        ) {
            Ok(v) => Ok(v),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok((None, None)),
            Err(e) => Err(db_error("DB_QUERY_FAILED", &e.to_string())),
        }
    }

    fn map_base_row(row: &Row<'_>) -> rusqlite::Result<TankBaseRow> {
        Ok(TankBaseRow {
            id: row.get("id")?,
            name: row.get("name")?,
            product_id: row.get("product_id")?,
            product_code: row.get("product_code")?,
            capacity_milli_litres: row.get("capacity_milli_litres")?,
            is_active: row.get::<_, i64>("is_active")? != 0,
            display_order: row.get("display_order")?,
            notes: row.get("notes")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }

    fn enrich_base(&self, base: TankBaseRow) -> Result<FuelTankDto, CommandErrorDto> {
        let book = self.book_milli_for_product(&base.product_id)?;
        let fill_percent = if base.capacity_milli_litres > 0 {
            ((book * 100) / base.capacity_milli_litres).clamp(0, 100)
        } else {
            0
        };
        let (last_dip_milli, last_dip_at) = self.last_dip_for_tank(&base.id)?;
        let variance = last_dip_milli.map(|dip| dip - book);

        Ok(FuelTankDto {
            id: base.id,
            name: base.name,
            product_id: base.product_id,
            product_code: base.product_code,
            capacity_milli_litres: base.capacity_milli_litres,
            is_active: base.is_active,
            display_order: base.display_order,
            notes: base.notes,
            book_milli_litres: book,
            fill_percent,
            last_dip_milli_litres: last_dip_milli,
            last_dip_at_iso: last_dip_at,
            variance_milli_litres: variance,
            created_at_iso: base.created_at_iso,
            updated_at_iso: base.updated_at_iso,
            version: base.version,
        })
    }

    const SELECT_SQL: &'static str =
        "SELECT t.id, t.name, t.product_id, p.code AS product_code, t.capacity_milli_litres,
                t.is_active, t.display_order, t.notes, t.created_at, t.updated_at, t.version
         FROM fuel_tanks t
         INNER JOIN fuel_products p ON p.id = t.product_id";

    pub fn list_all(&self, active_only: bool) -> Result<Vec<FuelTankDto>, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = if active_only {
            format!("{} WHERE t.is_active = 1 ORDER BY t.display_order ASC, t.name ASC", Self::SELECT_SQL)
        } else {
            format!("{} ORDER BY t.display_order ASC, t.name ASC", Self::SELECT_SQL)
        };

        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let bases = stmt
            .query_map([], Self::map_base_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        bases.into_iter().map(|base| self.enrich_base(base)).collect()
    }

    pub fn find_by_id(&self, id: &str) -> Result<FuelTankDto, CommandErrorDto> {
        let conn = self.db.conn();
        let sql = format!("{} WHERE t.id = ?1", Self::SELECT_SQL);
        let base = conn
            .query_row(&sql, params![id], Self::map_base_row)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => not_found("FuelTank", id),
                _ => db_error("DB_QUERY_FAILED", &e.to_string()),
            })?;
        self.enrich_base(base)
    }

    pub fn create(&self, input: &CreateFuelTankInputDto) -> Result<FuelTankDto, CommandErrorDto> {
        let name = input.name.trim();
        if name.is_empty() {
            return Err(conflict("TANK_NAME_REQUIRED", "Tank name is required."));
        }
        if input.capacity_milli_litres <= 0 {
            return Err(conflict("INVALID_CAPACITY", "Capacity must be greater than zero."));
        }

        let product_id = self.product_id_for_code(&input.product_code)?;
        let conn = self.db.conn();
        let id = format!("tank-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let display_order = input.display_order.unwrap_or(0);

        conn.execute(
            "INSERT INTO fuel_tanks
             (id, name, product_id, capacity_milli_litres, is_active, display_order, notes, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7, ?7, 1)",
            params![
                id,
                name,
                product_id,
                input.capacity_milli_litres,
                display_order,
                input.notes.as_deref().map(str::trim),
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        self.find_by_id(&id)
    }

    pub fn update(&self, input: &UpdateFuelTankInputDto) -> Result<FuelTankDto, CommandErrorDto> {
        let name = input.name.trim();
        if name.is_empty() {
            return Err(conflict("TANK_NAME_REQUIRED", "Tank name is required."));
        }
        if input.capacity_milli_litres <= 0 {
            return Err(conflict("INVALID_CAPACITY", "Capacity must be greater than zero."));
        }

        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        let updated = conn
            .execute(
                "UPDATE fuel_tanks
                 SET name = ?2, capacity_milli_litres = ?3, display_order = ?4,
                     notes = ?5, updated_at = ?6, version = version + 1
                 WHERE id = ?1 AND version = ?7",
                params![
                    input.id,
                    name,
                    input.capacity_milli_litres,
                    input.display_order,
                    input.notes.as_deref().map(str::trim),
                    now,
                    input.version,
                ],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "TANK_VERSION_CONFLICT",
                "Tank was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.id)
    }

    pub fn set_active(&self, input: &TankVersionInputDto, active: bool) -> Result<FuelTankDto, CommandErrorDto> {
        let conn = self.db.conn();
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let flag: i64 = if active { 1 } else { 0 };

        let updated = conn
            .execute(
                "UPDATE fuel_tanks
                 SET is_active = ?2, updated_at = ?3, version = version + 1
                 WHERE id = ?1 AND version = ?4",
                params![input.tank_id, flag, now, input.version],
            )
            .map_err(|e| db_error("DB_UPDATE_FAILED", &e.to_string()))?;

        if updated == 0 {
            return Err(conflict(
                "TANK_VERSION_CONFLICT",
                "Tank was modified by another process. Refresh and try again.",
            ));
        }

        self.find_by_id(&input.tank_id)
    }

    pub fn record_dip(&self, input: &RecordTankDipInputDto) -> Result<TankDipReadingDto, CommandErrorDto> {
        if input.quantity_milli_litres < 0 {
            return Err(conflict("INVALID_DIP", "Dip quantity cannot be negative."));
        }

        let tank = self.find_by_id(&input.tank_id)?;
        if input.quantity_milli_litres > tank.capacity_milli_litres {
            return Err(conflict(
                "DIP_EXCEEDS_CAPACITY",
                "Dip reading cannot exceed tank capacity.",
            ));
        }

        let conn = self.db.conn();
        let id = format!("dip-{}", Uuid::new_v4());
        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        conn.execute(
            "INSERT INTO tank_dip_readings
             (id, tank_id, reading_at, quantity_milli_litres, recorded_by, notes, created_at, updated_at, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, 1)",
            params![
                id,
                input.tank_id,
                input.reading_at_iso,
                input.quantity_milli_litres,
                input.recorded_by,
                input.notes.as_deref().map(str::trim),
                now,
            ],
        )
        .map_err(|e| db_error("DB_INSERT_FAILED", &e.to_string()))?;

        self.find_dip_by_id(&id)
    }

    pub fn list_dips(&self, tank_id: &str, limit: i64) -> Result<Vec<TankDipReadingDto>, CommandErrorDto> {
        let _ = self.find_by_id(tank_id)?;
        let conn = self.db.conn();
        let limit = limit.clamp(1, 200);

        let mut stmt = conn
            .prepare(
                "SELECT id, tank_id, reading_at, quantity_milli_litres, recorded_by, notes,
                        created_at, updated_at, version
                 FROM tank_dip_readings
                 WHERE tank_id = ?1
                 ORDER BY reading_at DESC
                 LIMIT ?2",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let rows = stmt
            .query_map(params![tank_id, limit], Self::map_dip_row)
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(rows)
    }

    fn find_dip_by_id(&self, id: &str) -> Result<TankDipReadingDto, CommandErrorDto> {
        let conn = self.db.conn();
        conn.query_row(
            "SELECT id, tank_id, reading_at, quantity_milli_litres, recorded_by, notes,
                    created_at, updated_at, version
             FROM tank_dip_readings WHERE id = ?1",
            params![id],
            Self::map_dip_row,
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => not_found("TankDipReading", id),
            _ => db_error("DB_QUERY_FAILED", &e.to_string()),
        })
    }

    fn map_dip_row(row: &Row<'_>) -> rusqlite::Result<TankDipReadingDto> {
        Ok(TankDipReadingDto {
            id: row.get("id")?,
            tank_id: row.get("tank_id")?,
            reading_at_iso: row.get("reading_at")?,
            quantity_milli_litres: row.get("quantity_milli_litres")?,
            recorded_by: row.get("recorded_by")?,
            notes: row.get("notes")?,
            created_at_iso: row.get("created_at")?,
            updated_at_iso: row.get("updated_at")?,
            version: row.get("version")?,
        })
    }
}

struct TankBaseRow {
    id: String,
    name: String,
    product_id: String,
    product_code: String,
    capacity_milli_litres: i64,
    is_active: bool,
    display_order: i64,
    notes: Option<String>,
    created_at_iso: String,
    updated_at_iso: String,
    version: i64,
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
    fn seeded_tanks_exist() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        let repo = TankRepository::new(&conn);
        let tanks = repo.list_all(true).unwrap();
        assert_eq!(tanks.len(), 3);
    }
}
