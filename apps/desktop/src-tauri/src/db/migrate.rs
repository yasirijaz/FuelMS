use rusqlite::params;

use super::connection::DbConnection;

struct Migration {
    version: i64,
    name: &'static str,
    sql: &'static str,
}

const REGISTRY_MIGRATION_VERSIONS: &[i64] = &[1, 4, 13, 14];
const BUSINESS_MIGRATION_VERSIONS: &[i64] = &[1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];

const ALL_MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "schema_migrations",
        sql: include_str!("migrations/001_schema_migrations.sql"),
    },
    Migration {
        version: 2,
        name: "fuel_price_management",
        sql: include_str!("migrations/002_fuel_price_management.sql"),
    },
    Migration {
        version: 3,
        name: "business_partners",
        sql: include_str!("migrations/003_business_partners.sql"),
    },
    Migration {
        version: 4,
        name: "organization_workspace",
        sql: include_str!("migrations/004_organization_workspace.sql"),
    },
    Migration {
        version: 5,
        name: "fuel_purchases",
        sql: include_str!("migrations/005_fuel_purchases.sql"),
    },
    Migration {
        version: 6,
        name: "fuel_sales",
        sql: include_str!("migrations/006_fuel_sales.sql"),
    },
    Migration {
        version: 7,
        name: "tanks_inventory_views",
        sql: include_str!("migrations/007_tanks_inventory_views.sql"),
    },
    Migration {
        version: 8,
        name: "cash_accounts",
        sql: include_str!("migrations/008_cash_accounts.sql"),
    },
    Migration {
        version: 9,
        name: "operating_expenses_income",
        sql: include_str!("migrations/009_operating_expenses_income.sql"),
    },
    Migration {
        version: 10,
        name: "accounting_kernel",
        sql: include_str!("migrations/010_accounting_kernel.sql"),
    },
    Migration {
        version: 11,
        name: "person_ledger",
        sql: include_str!("migrations/011_person_ledger.sql"),
    },
    Migration {
        version: 12,
        name: "backup_audit",
        sql: include_str!("migrations/012_backup_audit.sql"),
    },
    Migration {
        version: 13,
        name: "organization_workspace_repair",
        sql: include_str!("migrations/013_organization_workspace_repair.sql"),
    },
    Migration {
        version: 14,
        name: "organization_data_split",
        sql: include_str!("migrations/014_organization_data_split.sql"),
    },
];

fn apply_migrations(db: &DbConnection, versions: &[i64]) -> Result<(), String> {
    let conn = db.conn();

    conn.execute_batch(ALL_MIGRATIONS[0].sql)
        .map_err(|e| format!("Failed to bootstrap schema_migrations: {e}"))?;

    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to read schema version: {e}"))?;

    for migration in ALL_MIGRATIONS
        .iter()
        .filter(|m| versions.contains(&m.version) && m.version > current_version)
    {
        log::info!(
            "Applying migration {} — {}",
            migration.version,
            migration.name
        );

        conn.execute_batch("BEGIN IMMEDIATE;")
            .map_err(|e| format!("Failed to begin migration transaction: {e}"))?;

        let result = (|| {
            if migration.version > 1 {
                conn.execute_batch(migration.sql)
                    .map_err(|e| format!("Migration {} failed: {e}", migration.version))?;
            }

            conn.execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
                params![migration.version, migration.name],
            )
            .map_err(|e| format!("Failed to record migration {}: {e}", migration.version))?;

            Ok::<(), String>(())
        })();

        match result {
            Ok(()) => {
                conn.execute_batch("COMMIT;").map_err(|e| {
                    format!("Failed to commit migration {}: {e}", migration.version)
                })?;
            }
            Err(err) => {
                let _ = conn.execute_batch("ROLLBACK;");
                return Err(err);
            }
        }
    }

    Ok(())
}

/// Workspace registry database: organizations, workspaces, app metadata.
pub fn run_registry_migrations(db: &DbConnection) -> Result<(), String> {
    apply_migrations(db, REGISTRY_MIGRATION_VERSIONS)
}

/// Per-organization business database: sales, purchases, inventory, cash, etc.
pub fn run_business_migrations(db: &DbConnection) -> Result<(), String> {
    apply_migrations(db, BUSINESS_MIGRATION_VERSIONS)
}

/// Legacy single-database bootstrap (tests only).
pub fn run_migrations(db: &DbConnection) -> Result<(), String> {
    let all_versions: Vec<i64> = ALL_MIGRATIONS.iter().map(|m| m.version).collect();
    apply_migrations(db, &all_versions)
}

pub fn current_schema_version(db: &DbConnection) -> Result<i64, String> {
    let conn = db.conn();
    conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )
    .map_err(|e| format!("Failed to read schema version: {e}"))
}

pub fn max_supported_schema_version() -> i64 {
    REGISTRY_MIGRATION_VERSIONS
        .iter()
        .chain(BUSINESS_MIGRATION_VERSIONS.iter())
        .copied()
        .max()
        .unwrap_or(0)
}

pub fn max_supported_business_schema_version() -> i64 {
    *BUSINESS_MIGRATION_VERSIONS
        .iter()
        .max()
        .unwrap_or(&0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::connection::DbConnection;

    #[test]
    fn migrations_apply_idempotently() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        run_migrations(&conn).unwrap();

        let version: i64 = conn
            .conn()
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(version, 14);

        let product_count: i64 = conn
            .conn()
            .query_row("SELECT COUNT(*) FROM fuel_products", [], |row| row.get(0))
            .unwrap();
        assert_eq!(product_count, 3);

        let partner_table: i64 = conn
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'business_partners'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(partner_table, 1);

        let workspace_count: i64 = conn
            .conn()
            .query_row("SELECT COUNT(*) FROM workspaces", [], |row| row.get(0))
            .unwrap();
        assert_eq!(workspace_count, 1);
    }

    #[test]
    fn registry_and_business_migrations_split_cleanly() {
        let registry = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_registry_migrations(&registry).unwrap();

        let registry_version: i64 = registry
            .conn()
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |row| row.get(0))
            .unwrap();
        assert_eq!(registry_version, 14);

        let business = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_business_migrations(&business).unwrap();

        let business_version: i64 = business
            .conn()
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |row| row.get(0))
            .unwrap();
        assert_eq!(business_version, 12);

        let fuel_sales_in_registry: i64 = registry
            .conn()
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'fuel_sales'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(fuel_sales_in_registry, 0);
    }

    #[test]
    fn only_one_active_price_per_product_enforced() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();

        let now = "2026-06-26T10:00:00.000Z";
        conn.conn()
            .execute(
                "INSERT INTO fuel_price_records
                 (id, product_id, price_per_litre_minor, effective_from, status, recorded_by, created_at, updated_at)
                 VALUES ('p1', 'fuel-product-diesel', 28000, ?1, 'active', 'owner', ?1, ?1)",
                [now],
            )
            .unwrap();

        let err = conn
            .conn()
            .execute(
                "INSERT INTO fuel_price_records
                 (id, product_id, price_per_litre_minor, effective_from, status, recorded_by, created_at, updated_at)
                 VALUES ('p2', 'fuel-product-diesel', 29500, ?1, 'active', 'owner', ?1, ?1)",
                [now],
            )
            .unwrap_err();

        assert!(err.to_string().contains("UNIQUE"));
    }

    #[test]
    fn business_partner_requires_non_blank_display_name() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();

        let now = "2026-06-26T10:00:00.000Z";
        let err = conn
            .conn()
            .execute(
                "INSERT INTO business_partners
                 (id, display_name, created_at, updated_at)
                 VALUES ('bp-1', '   ', ?1, ?1)",
                [now],
            )
            .unwrap_err();

        assert!(err.to_string().contains("CHECK"));
    }

    #[test]
    fn partner_cannot_have_duplicate_role() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();

        let now = "2026-06-26T10:00:00.000Z";
        conn.conn()
            .execute(
                "INSERT INTO business_partners
                 (id, display_name, created_at, updated_at)
                 VALUES ('bp-1', 'Ali Petroleum', ?1, ?1)",
                [now],
            )
            .unwrap();

        conn.conn()
            .execute(
                "INSERT INTO partner_roles
                 (id, partner_id, role_code, assigned_at, created_at, updated_at)
                 VALUES ('pr-1', 'bp-1', 'supplier', ?1, ?1, ?1)",
                [now],
            )
            .unwrap();

        let err = conn
            .conn()
            .execute(
                "INSERT INTO partner_roles
                 (id, partner_id, role_code, assigned_at, created_at, updated_at)
                 VALUES ('pr-2', 'bp-1', 'supplier', ?1, ?1, ?1)",
                [now],
            )
            .unwrap_err();

        assert!(err.to_string().contains("UNIQUE"));
    }

    #[test]
    fn partner_role_code_must_be_valid() {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();

        let now = "2026-06-26T10:00:00.000Z";
        conn.conn()
            .execute(
                "INSERT INTO business_partners
                 (id, display_name, created_at, updated_at)
                 VALUES ('bp-1', 'Test Partner', ?1, ?1)",
                [now],
            )
            .unwrap();

        let err = conn
            .conn()
            .execute(
                "INSERT INTO partner_roles
                 (id, partner_id, role_code, assigned_at, created_at, updated_at)
                 VALUES ('pr-1', 'bp-1', 'lender', ?1, ?1, ?1)",
                [now],
            )
            .unwrap_err();

        assert!(err.to_string().contains("CHECK"));
    }
}
