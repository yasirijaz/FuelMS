use rusqlite::{Connection, OpenFlags};

/// Thin wrapper around rusqlite::Connection with FuelERP PRAGMA defaults (ADR-002).
pub struct DbConnection {
    conn: Connection,
}

impl DbConnection {
    pub fn open(path: &std::path::Path) -> Result<Self, String> {
        let conn = Connection::open_with_flags(
            path,
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE,
        )
        .map_err(|e| format!("Failed to open SQLite database: {e}"))?;

        Self::apply_pragmas(&conn)?;
        Ok(Self { conn })
    }

    fn apply_pragmas(conn: &Connection) -> Result<(), String> {
        conn.execute_batch(
            "
            PRAGMA foreign_keys = ON;
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA busy_timeout = 5000;
            ",
        )
        .map_err(|e| format!("Failed to apply SQLite PRAGMA settings: {e}"))
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }
}
