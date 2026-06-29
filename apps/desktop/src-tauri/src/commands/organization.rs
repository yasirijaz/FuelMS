use tauri::State;

use crate::db::AppDatabase;
use crate::dto::organization::{
    CommandResultDto, CreateOrganizationInputDto, InitializeWorkspaceInputDto, OrganizationDto,
    UpdateOrganizationInputDto, WorkspaceSnapshotDto,
};
use crate::repositories::organization_repository::OrganizationRepository;
use crate::repositories::workspace_repository::WorkspaceRepository;

fn load_workspace_snapshot(
    db: &AppDatabase,
) -> Result<WorkspaceSnapshotDto, crate::dto::organization::CommandErrorDto> {
    db.with_registry(|conn| {
        let workspace_repo = WorkspaceRepository::new(conn);
        let org_repo = OrganizationRepository::new(conn);

        let workspace = workspace_repo.ensure_default()?;
        let organizations = org_repo.list_all()?;
        let active_organization = workspace
            .active_organization_id
            .as_deref()
            .and_then(|id| org_repo.find_by_id(id).ok());

        Ok(WorkspaceSnapshotDto {
            workspace,
            organizations,
            active_organization,
        })
    })
}

#[tauri::command]
pub fn organization_list(db: State<'_, AppDatabase>) -> CommandResultDto<Vec<OrganizationDto>> {
    match db.with_registry(|conn| OrganizationRepository::new(conn).list_all()) {
        Ok(rows) => CommandResultDto::ok(rows),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn organization_get_by_id(
    db: State<'_, AppDatabase>,
    organization_id: String,
) -> CommandResultDto<OrganizationDto> {
    match db.with_registry(|conn| OrganizationRepository::new(conn).find_by_id(&organization_id))
    {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn workspace_get_snapshot(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<WorkspaceSnapshotDto> {
    match load_workspace_snapshot(&db) {
        Ok(snapshot) => CommandResultDto::ok(snapshot),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn organization_create(
    db: State<'_, AppDatabase>,
    input: CreateOrganizationInputDto,
) -> CommandResultDto<WorkspaceSnapshotDto> {
    match db.with_registry(|conn| {
        let org_repo = OrganizationRepository::new(conn);
        let workspace_repo = WorkspaceRepository::new(conn);

        if org_repo.exists_active_by_name_excluding(&input.name, None)? {
            return Err(crate::dto::organization::CommandErrorDto {
                code: "ORGANIZATION_NAME_DUPLICATE".to_string(),
                message: "An active organization with this name already exists.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        let created = org_repo.insert(&input)?;
        let created_id = created.id.clone();
        let workspace = workspace_repo.ensure_default()?;

        if workspace.active_organization_id.is_none() {
            workspace_repo.set_active_organization(Some(&created.id), workspace.version)?;
        }

        let workspace = workspace_repo.ensure_default()?;
        let organizations = org_repo.list_all()?;
        let active_organization = workspace
            .active_organization_id
            .as_deref()
            .and_then(|id| org_repo.find_by_id(id).ok());

        Ok((WorkspaceSnapshotDto {
            workspace,
            organizations,
            active_organization,
        }, created_id))
    }) {
        Ok((snapshot, created_id)) => {
            if let Err(message) = db.provision_organization_database(&created_id) {
                return CommandResultDto {
                    ok: false,
                    value: None,
                    error: Some(crate::dto::organization::CommandErrorDto {
                        code: "ORGANIZATION_DATABASE_FAILED".to_string(),
                        message,
                        kind: "infrastructure".to_string(),
                    }),
                };
            }

            if snapshot
                .active_organization
                .as_ref()
                .is_some_and(|org| org.id == created_id)
            {
                if let Err(message) = db.switch_active_organization(&created_id) {
                    return CommandResultDto {
                        ok: false,
                        value: None,
                        error: Some(crate::dto::organization::CommandErrorDto {
                            code: "ORGANIZATION_SWITCH_FAILED".to_string(),
                            message,
                            kind: "infrastructure".to_string(),
                        }),
                    };
                }
            }

            CommandResultDto::ok(snapshot)
        }
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn organization_update(
    db: State<'_, AppDatabase>,
    input: UpdateOrganizationInputDto,
) -> CommandResultDto<OrganizationDto> {
    match db.with_registry(|conn| {
        let org_repo = OrganizationRepository::new(conn);

        if org_repo.exists_active_by_name_excluding(&input.name, Some(&input.id))? {
            return Err(crate::dto::organization::CommandErrorDto {
                code: "ORGANIZATION_NAME_DUPLICATE".to_string(),
                message: "An active organization with this name already exists.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        org_repo.update(&input)
    }) {
        Ok(row) => CommandResultDto::ok(row),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn organization_activate(
    db: State<'_, AppDatabase>,
    organization_id: String,
) -> CommandResultDto<WorkspaceSnapshotDto> {
    let registry_result = db.with_registry(|conn| {
        let org_repo = OrganizationRepository::new(conn);
        let workspace_repo = WorkspaceRepository::new(conn);

        let org = org_repo.find_by_id(&organization_id)?;
        if org.status != "active" {
            return Err(crate::dto::organization::CommandErrorDto {
                code: "ORGANIZATION_ARCHIVED".to_string(),
                message: "Archived organizations cannot be activated.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        let workspace = workspace_repo.ensure_default()?;
        workspace_repo.set_active_organization(Some(&organization_id), workspace.version)?;

        let workspace = workspace_repo.ensure_default()?;
        let organizations = org_repo.list_all()?;
        let active_organization = Some(org);

        Ok(WorkspaceSnapshotDto {
            workspace,
            organizations,
            active_organization,
        })
    });

    match registry_result {
        Ok(snapshot) => {
            if let Err(message) = db.switch_active_organization(&organization_id) {
                return CommandResultDto {
                    ok: false,
                    value: None,
                    error: Some(crate::dto::organization::CommandErrorDto {
                        code: "ORGANIZATION_SWITCH_FAILED".to_string(),
                        message,
                        kind: "infrastructure".to_string(),
                    }),
                };
            }
            CommandResultDto::ok(snapshot)
        }
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn organization_archive(
    db: State<'_, AppDatabase>,
    organization_id: String,
    version: i64,
) -> CommandResultDto<WorkspaceSnapshotDto> {
    match db.with_registry(|conn| {
        let org_repo = OrganizationRepository::new(conn);
        let workspace_repo = WorkspaceRepository::new(conn);

        org_repo.archive(&organization_id, version)?;

        let workspace = workspace_repo.ensure_default()?;
        if workspace.active_organization_id.as_deref() == Some(organization_id.as_str()) {
            let active_orgs = org_repo.list_active()?;
            let next = active_orgs.first().map(|o| o.id.as_str());
            workspace_repo.set_active_organization(next, workspace.version)?;
        }

        let workspace = workspace_repo.ensure_default()?;
        let organizations = org_repo.list_all()?;
        let active_organization = workspace
            .active_organization_id
            .as_deref()
            .and_then(|id| org_repo.find_by_id(id).ok());

        Ok(WorkspaceSnapshotDto {
            workspace,
            organizations,
            active_organization,
        })
    }) {
        Ok(snapshot) => {
            if let Some(active) = snapshot.active_organization.as_ref() {
                if let Err(message) = db.switch_active_organization(&active.id) {
                    return CommandResultDto {
                        ok: false,
                        value: None,
                        error: Some(crate::dto::organization::CommandErrorDto {
                            code: "ORGANIZATION_SWITCH_FAILED".to_string(),
                            message,
                            kind: "infrastructure".to_string(),
                        }),
                    };
                }
            } else {
                db.close_business_connection();
            }

            CommandResultDto::ok(snapshot)
        }
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn workspace_initialize(
    db: State<'_, AppDatabase>,
    input: InitializeWorkspaceInputDto,
) -> CommandResultDto<WorkspaceSnapshotDto> {
    match db.with_registry(|conn| {
        let org_repo = OrganizationRepository::new(conn);
        let workspace_repo = WorkspaceRepository::new(conn);

        let active_orgs = org_repo.list_active()?;
        if !active_orgs.is_empty() {
            return Err(crate::dto::organization::CommandErrorDto {
                code: "WORKSPACE_ALREADY_INITIALIZED".to_string(),
                message: "This workspace already has an active organization.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        let workspace = workspace_repo.ensure_default()?;
        workspace_repo.update_name(&input.workspace_name, workspace.version)?;

        let org_input = CreateOrganizationInputDto {
            name: input.name,
            legal_name: input.legal_name,
            address: input.address,
            city: input.city,
            phone: input.phone,
            tax_id: input.tax_id,
        };

        if org_repo.exists_active_by_name_excluding(&org_input.name, None)? {
            return Err(crate::dto::organization::CommandErrorDto {
                code: "ORGANIZATION_NAME_DUPLICATE".to_string(),
                message: "An active organization with this name already exists.".to_string(),
                kind: "conflict".to_string(),
            });
        }

        let created = org_repo.insert(&org_input)?;
        let created_id = created.id.clone();
        let workspace = workspace_repo.ensure_default()?;
        workspace_repo.set_active_organization(Some(&created_id), workspace.version)?;

        let workspace = workspace_repo.ensure_default()?;
        let organizations = org_repo.list_all()?;

        Ok((WorkspaceSnapshotDto {
            workspace,
            organizations,
            active_organization: Some(created),
        }, created_id))
    }) {
        Ok((snapshot, created_id)) => {
            if let Err(message) = db.provision_organization_database(&created_id) {
                return CommandResultDto {
                    ok: false,
                    value: None,
                    error: Some(crate::dto::organization::CommandErrorDto {
                        code: "ORGANIZATION_DATABASE_FAILED".to_string(),
                        message,
                        kind: "infrastructure".to_string(),
                    }),
                };
            }

            if let Err(message) = db.switch_active_organization(&created_id) {
                return CommandResultDto {
                    ok: false,
                    value: None,
                    error: Some(crate::dto::organization::CommandErrorDto {
                        code: "ORGANIZATION_SWITCH_FAILED".to_string(),
                        message,
                        kind: "infrastructure".to_string(),
                    }),
                };
            }

            CommandResultDto::ok(snapshot)
        }
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}

#[tauri::command]
pub fn workspace_resolve_active(
    db: State<'_, AppDatabase>,
) -> CommandResultDto<WorkspaceSnapshotDto> {
    match db.with_registry(|conn| {
        let org_repo = OrganizationRepository::new(conn);
        let workspace_repo = WorkspaceRepository::new(conn);

        let mut workspace = workspace_repo.ensure_default()?;
        let active_orgs = org_repo.list_active()?;

        if workspace.active_organization_id.is_none() && active_orgs.len() == 1 {
            workspace = workspace_repo
                .set_active_organization(Some(&active_orgs[0].id), workspace.version)?;
        }

        let organizations = org_repo.list_all()?;
        let active_organization = workspace
            .active_organization_id
            .as_deref()
            .and_then(|id| org_repo.find_by_id(id).ok());

        Ok(WorkspaceSnapshotDto {
            workspace,
            organizations,
            active_organization,
        })
    }) {
        Ok(snapshot) => CommandResultDto::ok(snapshot),
        Err(e) => CommandResultDto {
            ok: false,
            value: None,
            error: Some(e),
        },
    }
}
