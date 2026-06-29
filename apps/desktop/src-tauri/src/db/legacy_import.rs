use rusqlite::params;

use super::connection::DbConnection;
use super::migrate::run_business_migrations;
use super::AppDatabase;
use crate::repositories::organization_repository::OrganizationRepository;
use crate::repositories::workspace_repository::WorkspaceRepository;

const BUSINESS_TABLES: &[&str] = &[
    "fuel_products",
    "fuel_price_change_batches",
    "fuel_price_records",
    "fuel_price_audit_log",
    "business_partners",
    "partner_roles",
    "ledger_accounts",
    "accounting_periods",
    "cash_accounts",
    "fuel_inventory_batches",
    "fuel_purchases",
    "fuel_tanks",
    "tank_dip_readings",
    "fuel_sales",
    "fuel_sale_batch_consumptions",
    "cash_transfers",
    "operating_expenses",
    "operating_income",
    "person_ledger_entries",
    "journal_entries",
    "journal_lines",
    "backup_audit_events",
];

pub fn organization_business_path(app_data_dir: &std::path::Path, organization_id: &str) -> std::path::PathBuf {
    app_data_dir
        .join("organizations")
        .join(organization_id)
        .join("business.sqlite3")
}

pub fn provision_organization_database(
    app_data_dir: &std::path::Path,
    organization_id: &str,
) -> Result<(), String> {
    let path = organization_business_path(app_data_dir, organization_id);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create organization data directory: {e}"))?;
    }

    if path.exists() {
        return Ok(());
    }

    let conn = DbConnection::open(&path)?;
    run_business_migrations(&conn)?;
    log::info!(
        "Provisioned empty business database for organization {} at {}",
        organization_id,
        path.display()
    );
    Ok(())
}

pub fn split_legacy_monolith_if_needed(db: &AppDatabase) -> Result<(), String> {
    let split_status = db.with_registry(|conn| read_split_status(conn))?;

    if split_status.as_deref() == Some("done") {
        return Ok(());
    }

    let has_legacy_business = db.with_registry(|conn| legacy_business_tables_exist(conn))?;
    if !has_legacy_business {
        db.with_registry(|conn| mark_split_done(conn))?;
        return Ok(());
    }

    let organization_id = db.with_registry(|conn| resolve_target_organization_id(conn))?;
    let organization_id = organization_id.ok_or_else(|| {
        "Legacy business data exists but no organization is configured.".to_string()
    })?;

    let business_path = organization_business_path(db.app_data_dir(), &organization_id);
    if let Some(parent) = business_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create organization data directory: {e}"))?;
    }

    let business_conn = DbConnection::open(&business_path)?;
    run_business_migrations(&business_conn)?;

    let business_is_empty = business_conn
        .conn()
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'fuel_sales'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|e| format!("Failed to inspect business database: {e}"))?
        == 1
        && business_conn
            .conn()
            .query_row("SELECT COUNT(*) FROM fuel_sales", [], |row| row.get(0))
            .unwrap_or(0)
            == 0;

    if business_is_empty {
        db.with_registry(|registry| {
            copy_legacy_business_tables(registry, &business_conn)?;
            drop_legacy_business_tables(registry)?;
            mark_split_done(registry)
        })?;
        log::info!(
            "Migrated legacy business data into organization {} database",
            organization_id
        );
    } else {
        db.with_registry(|conn| mark_split_done(conn))?;
    }

    Ok(())
}

fn read_split_status(conn: &DbConnection) -> Result<Option<String>, String> {
    let exists: i64 = conn
        .conn()
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'app_metadata'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to inspect app_metadata: {e}"))?;

    if exists == 0 {
        return Ok(None);
    }

    conn.conn()
        .query_row(
            "SELECT value FROM app_metadata WHERE key = 'business_data_split'",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to read business_data_split metadata: {e}"))
}

fn legacy_business_tables_exist(conn: &DbConnection) -> Result<bool, String> {
    let count: i64 = conn
        .conn()
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'fuel_sales'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to inspect legacy business tables: {e}"))?;
    Ok(count > 0)
}

fn resolve_target_organization_id(conn: &DbConnection) -> Result<Option<String>, String> {
    let workspace = WorkspaceRepository::new(conn)
        .ensure_default()
        .map_err(|e| e.message)?;

    if let Some(id) = workspace.active_organization_id {
        return Ok(Some(id));
    }

    let orgs = OrganizationRepository::new(conn)
        .list_active()
        .map_err(|e| e.message)?;

    Ok(orgs.first().map(|org| org.id.clone()))
}

fn copy_legacy_business_tables(
    registry: &DbConnection,
    business: &DbConnection,
) -> Result<(), String> {
    let registry_path = registry
        .conn()
        .path()
        .ok_or_else(|| "Registry database path unavailable.".to_string())?
        .to_string();

    business
        .conn()
        .execute_batch("PRAGMA foreign_keys = OFF;")
        .map_err(|e| format!("Failed to disable foreign keys during import: {e}"))?;

    business
        .conn()
        .execute(
            "ATTACH DATABASE ?1 AS legacy",
            params![registry_path],
        )
        .map_err(|e| format!("Failed to attach legacy database: {e}"))?;

    for table in BUSINESS_TABLES {
        let exists: i64 = business
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM legacy.sqlite_master WHERE type = 'table' AND name = ?1",
                params![table],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if exists == 0 {
            continue;
        }

        let sql = format!("INSERT OR REPLACE INTO main.{table} SELECT * FROM legacy.{table}");
        business
            .conn()
            .execute_batch(&sql)
            .map_err(|e| format!("Failed to copy legacy table {table}: {e}"))?;
    }

    business
        .conn()
        .execute_batch("DETACH DATABASE legacy; PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Failed to finalize legacy import: {e}"))?;

    Ok(())
}

fn drop_legacy_business_tables(registry: &DbConnection) -> Result<(), String> {
    registry
        .conn()
        .execute_batch("PRAGMA foreign_keys = OFF;")
        .map_err(|e| format!("Failed to disable foreign keys during cleanup: {e}"))?;

    for table in BUSINESS_TABLES.iter().rev() {
        let sql = format!("DROP TABLE IF EXISTS {table}");
        registry
            .conn()
            .execute_batch(&sql)
            .map_err(|e| format!("Failed to drop legacy table {table}: {e}"))?;
    }

    registry
        .conn()
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Failed to re-enable foreign keys: {e}"))?;

    Ok(())
}

fn mark_split_done(conn: &DbConnection) -> Result<(), String> {
    conn.conn()
        .execute(
            "INSERT OR REPLACE INTO app_metadata (key, value, updated_at)
             VALUES ('business_data_split', 'done', datetime('now'))",
            [],
        )
        .map_err(|e| format!("Failed to mark business_data_split done: {e}"))?;
    Ok(())
}

trait OptionalRow {
    fn optional(self) -> Result<Option<String>, rusqlite::Error>;
}

impl OptionalRow for Result<String, rusqlite::Error> {
    fn optional(self) -> Result<Option<String>, rusqlite::Error> {
        match self {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(err) => Err(err),
        }
    }
}
