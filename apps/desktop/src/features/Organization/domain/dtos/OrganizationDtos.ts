export interface OrganizationDto {
  id: string
  name: string
  legalName: string | null
  address: string | null
  city: string | null
  phone: string | null
  taxId: string | null
  status: string
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export interface WorkspaceDto {
  id: string
  name: string
  activeOrganizationId: string | null
  updatedAtIso: string
  version: number
}

export interface WorkspaceSnapshotDto {
  workspace: WorkspaceDto
  organizations: OrganizationDto[]
  activeOrganization: OrganizationDto | null
}

export interface CreateOrganizationInputDto {
  name: string
  legalName?: string
  address?: string
  city?: string
  phone?: string
  taxId?: string
}

export interface UpdateOrganizationInputDto {
  id: string
  name: string
  legalName?: string
  address?: string
  city?: string
  phone?: string
  taxId?: string
  version: number
}

export interface InitializeWorkspaceInputDto {
  workspaceName: string
  name: string
  legalName?: string
  address?: string
  city?: string
  phone?: string
  taxId?: string
}

export interface OrganizationCommandError {
  code: string
  message: string
  kind: string
}

export interface OrganizationCommandResult<T> {
  ok: boolean
  value?: T
  error?: OrganizationCommandError
}
