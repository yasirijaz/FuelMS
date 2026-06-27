pub mod connection;
pub mod migrate;

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use connection::DbConnection;
use migrate::run_migrations;
use tauri::{AppHandle, Manager};

/// Shared database handle — one connection per app instance (WAL mode allows concurrent readers).
pub struct AppDatabase {
    inner: Mutex<Option<DbConnection>>,
    path: PathBuf,
}

impl AppDatabase {
    pub fn connect(path: PathBuf) -> Result<Self, String> {
        let conn = DbConnection::open(&path)?;
        run_migrations(&conn)?;
        Ok(Self {
            inner: Mutex::new(Some(conn)),
            path,
        })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn with_connection<F, T, E>(&self, f: F) -> Result<T, E>
    where
        F: FnOnce(&DbConnection) -> Result<T, E>,
    {
        let guard = self.inner.lock().expect("Database lock poisoned");
        f(guard
            .as_ref()
            .expect("Database connection must be open for this operation"))
    }

    pub fn close_connection(&self) {
        let mut guard = self.inner.lock().expect("Database lock poisoned");
        *guard = None;
    }

    pub fn reopen_connection(&self) -> Result<(), String> {
        let mut guard = self.inner.lock().expect("Database lock poisoned");
        let conn = DbConnection::open(&self.path)?;
        run_migrations(&conn)?;
        *guard = Some(conn);
        Ok(())
    }
}

/// Resolve the database file path under Tauri app data directory.
pub fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {e}"))?;

    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    Ok(dir.join("fuelms.sqlite3"))
}

pub fn backups_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {e}"))?
        .join("backups");

    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create backups directory: {e}"))?;

    Ok(dir)
}

/// Initialise database on app startup.
pub fn init_database(app: &AppHandle) -> Result<(), String> {
    let path = database_path(app)?;
    log::info!("Opening database at {}", path.display());

    let db = AppDatabase::connect(path)?;
    app.manage(db);

    Ok(())
}
