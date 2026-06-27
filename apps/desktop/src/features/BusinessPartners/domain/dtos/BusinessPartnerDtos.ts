export interface BusinessPartnerDto {
  id: string
  displayName: string
  legalName: string | null
  phone: string | null
  email: string | null
  taxId: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  roles: string[]
  createdAtIso: string
  updatedAtIso: string
  version: number
}

export interface CreateBusinessPartnerInputDto {
  displayName: string
  legalName?: string
  phone?: string
  email?: string
  taxId?: string
  address?: string
  notes?: string
  roles: string[]
}

export interface UpdateBusinessPartnerInputDto {
  id: string
  displayName: string
  legalName?: string
  phone?: string
  email?: string
  taxId?: string
  address?: string
  notes?: string
  version: number
}

export interface BusinessPartnerListQueryDto {
  search?: string
  roleCode?: string
  activeOnly?: boolean
}

export interface AssignPartnerRoleInputDto {
  partnerId: string
  roleCode: string
  version: number
}

export interface RemovePartnerRoleInputDto {
  partnerId: string
  roleCode: string
  version: number
}

export interface PartnerVersionInputDto {
  partnerId: string
  version: number
}

export interface BusinessPartnerCommandError {
  code: string
  message: string
  kind: string
}

export interface BusinessPartnerCommandResult<T> {
  ok: boolean
  value?: T
  error?: BusinessPartnerCommandError
}
