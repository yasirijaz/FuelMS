pub mod connection;
pub mod legacy_import;
pub mod migrate;

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use connection::DbConnection;
use legacy_import::{organization_business_path, provision_organization_database, split_legacy_monolith_if_needed};
use migrate::{run_business_migrations, run_registry_migrations};
use tauri::{AppHandle, Manager};

use crate::repositories::workspace_repository::WorkspaceRepository;

/// Registry DB (organizations/workspaces) plus one business DB per active organization.
pub struct AppDatabase {
    registry: Mutex<Option<DbConnection>>,
    registry_path: PathBuf,
    business: Mutex<Option<DbConnection>>,
    business_path: Mutex<PathBuf>,
    active_business_org_id: Mutex<Option<String>>,
    app_data_dir: PathBuf,
}

impl AppDatabase {
    pub fn connect_registry(registry_path: PathBuf, app_data_dir: PathBuf) -> Result<Self, String> {
        let registry = DbConnection::open(&registry_path)?;
        run_registry_migrations(&registry)?;

        Ok(Self {
            registry: Mutex::new(Some(registry)),
            registry_path,
            business: Mutex::new(None),
            business_path: Mutex::new(PathBuf::new()),
            active_business_org_id: Mutex::new(None),
            app_data_dir,
        })
    }

    pub fn app_data_dir(&self) -> &Path {
        &self.app_data_dir
    }

    pub fn path(&self) -> &Path {
        &self.registry_path
    }

    pub fn business_path(&self) -> PathBuf {
        self.business_path
            .lock()
            .expect("Database lock poisoned")
            .clone()
    }

    pub fn with_registry<F, T, E>(&self, f: F) -> Result<T, E>
    where
        F: FnOnce(&DbConnection) -> Result<T, E>,
    {
        let guard = self.registry.lock().expect("Database lock poisoned");
        f(guard
            .as_ref()
            .expect("Registry database connection must be open"))
    }

    pub fn with_business<F, T, E>(&self, f: F) -> Result<T, E>
    where
        F: FnOnce(&DbConnection) -> Result<T, E>,
        E: From<String>,
    {
        let org_id = self
            .with_registry(|conn| active_organization_id(conn))
            .map_err(E::from)?;
        self.ensure_business_connection(&org_id).map_err(E::from)?;

        let guard = self.business.lock().expect("Database lock poisoned");
        f(guard
            .as_ref()
            .expect("Business database connection must be open"))
    }

    pub fn switch_active_organization(&self, organization_id: &str) -> Result<(), String> {
        self.ensure_business_connection(organization_id)
    }

    pub fn provision_organization_database(&self, organization_id: &str) -> Result<(), String> {
        provision_organization_database(self.app_data_dir(), organization_id)
    }

    pub fn close_business_connection(&self) {
        let mut guard = self.business.lock().expect("Database lock poisoned");
        *guard = None;
        *self.active_business_org_id.lock().expect("Database lock poisoned") = None;
    }

    pub fn reopen_business_connection(&self) -> Result<(), String> {
        let org_id = self.with_registry(|conn| active_organization_id(conn))?;
        self.ensure_business_connection(&org_id)
    }

    fn ensure_business_connection(&self, organization_id: &str) -> Result<(), String> {
        let current = self
            .active_business_org_id
            .lock()
            .expect("Database lock poisoned")
            .clone();

        if current.as_deref() == Some(organization_id) {
            let guard = self.business.lock().expect("Database lock poisoned");
            if guard.is_some() {
                return Ok(());
            }
        }

        let path = organization_business_path(self.app_data_dir(), organization_id);
        if !path.exists() {
            provision_organization_database(self.app_data_dir(), organization_id)?;
        }

        let conn = DbConnection::open(&path)?;
        run_business_migrations(&conn)?;

        {
            let mut guard = self.business.lock().expect("Database lock poisoned");
            *guard = Some(conn);
        }
        *self.business_path.lock().expect("Database lock poisoned") = path;
        *self.active_business_org_id.lock().expect("Database lock poisoned") =
            Some(organization_id.to_string());

        log::info!("Opened business database for organization {organization_id}");
        Ok(())
    }
}

fn active_organization_id(conn: &DbConnection) -> Result<String, String> {
    let workspace = WorkspaceRepository::new(conn)
        .ensure_default()
        .map_err(|e| e.message)?;

    workspace
        .active_organization_id
        .ok_or_else(|| "No active organization is selected.".to_string())
}

pub fn app_data_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {e}"))?;

    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    Ok(dir)
}

/// Resolve the registry database file path under Tauri app data directory.
pub fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_directory(app)?.join("fuelms.sqlite3"))
}

pub fn backups_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app_data_directory(app)?.join("backups");

    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create backups directory: {e}"))?;

    Ok(dir)
}

/// Initialise database on app startup.
pub fn init_database(app: &AppHandle) -> Result<(), String> {
    let app_data_dir = app_data_directory(app)?;
    let path = app_data_dir.join("fuelms.sqlite3");
    log::info!("Opening registry database at {}", path.display());

    let db = AppDatabase::connect_registry(path, app_data_dir)?;
    split_legacy_monolith_if_needed(&db)?;

    if let Ok(Some(org_id)) = db.with_registry(|conn| -> Result<Option<String>, String> {
        let workspace = WorkspaceRepository::new(conn)
            .ensure_default()
            .map_err(|e| e.message)?;
        Ok(workspace.active_organization_id)
    }) {
        db.switch_active_organization(&org_id)?;
    }

    app.manage(db);
    Ok(())
}
