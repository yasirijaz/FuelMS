import { useState } from 'react'
import { useWorkspaceStore } from '@shared/stores/useWorkspaceStore'
import {
  useActivateOrganization,
  useArchiveOrganization,
} from '../application/hooks/useOrganizationQueries'
import { OrganizationCreateForm } from './OrganizationCreateForm'
import { OrganizationEditForm } from './OrganizationEditForm'

export function OrganizationManagementPage() {
  const organizations = useWorkspaceStore((state) => state.organizations)
  const activeOrganization = useWorkspaceStore((state) => state.activeOrganization)
  const [editingId, setEditingId] = useState<string | null>(null)
  const activateMutation = useActivateOrganization()
  const archiveMutation = useArchiveOrganization()

  const activeId = activeOrganization?.id.toString()

  return (
    <section className="mx-auto max-w-5xl space-y-8 p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Organizations
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Manage the petrol pump businesses in this installation. Every future business
          record will belong to the active organization.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Registered organizations</h2>
          <p className="mt-1 text-sm text-slate-500">
            {organizations.length === 0
              ? 'No organizations yet. Create your first organization to begin.'
              : `${organizations.length} organization${organizations.length === 1 ? '' : 's'} in this workspace.`}
          </p>

          <ul className="mt-6 space-y-4">
            {organizations.map((org) => {
              const orgId = org.id.toString()
              const isActive = activeId === orgId
              const isEditing = editingId === orgId

              return (
                <li
                  key={orgId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-950">{org.name.value}</h3>
                        {isActive && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            Active
                          </span>
                        )}
                        {org.isArchived && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Archived
                          </span>
                        )}
                      </div>
                      {org.city && (
                        <p className="mt-1 text-sm text-slate-500">{org.city}</p>
                      )}
                      {org.legalName && (
                        <p className="mt-1 text-sm text-slate-500">{org.legalName}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {org.isActive && !isActive && (
                        <button
                          type="button"
                          disabled={activateMutation.isPending}
                          onClick={() => activateMutation.mutate(orgId)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          Switch to
                        </button>
                      )}
                      {org.isActive && (
                        <button
                          type="button"
                          onClick={() => setEditingId(isEditing ? null : orgId)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                        >
                          {isEditing ? 'Close' : 'Edit'}
                        </button>
                      )}
                      {org.isActive && (
                        <button
                          type="button"
                          disabled={archiveMutation.isPending}
                          onClick={() =>
                            archiveMutation.mutate({
                              organizationId: orgId,
                              version: org.version,
                            })
                          }
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4">
                      <OrganizationEditForm
                        organization={org}
                        onSuccess={() => setEditingId(null)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Create organization</h2>
          <p className="mt-1 text-sm text-slate-500">
            The first organization is selected automatically. Additional organizations enable
            the header switcher.
          </p>
          <div className="mt-6">
            <OrganizationCreateForm />
          </div>
        </div>
      </div>
    </section>
  )
}
