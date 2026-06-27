import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Organization } from '../domain/entities/Organization'
import { updateOrganizationInputSchema, type UpdateOrganizationInput } from '../domain'
import { useUpdateOrganization } from '../application/hooks/useOrganizationQueries'

type OrganizationEditFormProps = {
  organization: Organization
  onSuccess?: () => void
  onCancel?: () => void
}

export function OrganizationEditForm({
  organization,
  onSuccess,
  onCancel,
}: OrganizationEditFormProps) {
  const updateMutation = useUpdateOrganization()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationInputSchema),
    defaultValues: {
      id: organization.id.toString(),
      version: organization.version,
      name: organization.name.value,
      legalName: organization.legalName ?? '',
      address: organization.address ?? '',
      city: organization.city ?? '',
      phone: organization.phone ?? '',
      taxId: organization.taxId ?? '',
    },
  })

  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={handleSubmit(async (values) => {
        await updateMutation.mutateAsync(values)
        onSuccess?.()
      })}
    >
      <input type="hidden" {...register('id')} />
      <input type="hidden" {...register('version', { valueAsNumber: true })} />

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor={`edit-name-${organization.id}`}>
          Display name *
        </label>
        <input
          id={`edit-name-${organization.id}`}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          {...register('name')}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`edit-legal-${organization.id}`}>
            Legal name
          </label>
          <input
            id={`edit-legal-${organization.id}`}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            {...register('legalName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`edit-city-${organization.id}`}>
            City
          </label>
          <input
            id={`edit-city-${organization.id}`}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            {...register('city')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor={`edit-address-${organization.id}`}>
          Address
        </label>
        <input
          id={`edit-address-${organization.id}`}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          {...register('address')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`edit-phone-${organization.id}`}>
            Phone
          </label>
          <input
            id={`edit-phone-${organization.id}`}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            {...register('phone')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`edit-tax-${organization.id}`}>
            Tax ID
          </label>
          <input
            id={`edit-tax-${organization.id}`}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            {...register('taxId')}
          />
        </div>
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-red-600">
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : 'Failed to update organization.'}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-white"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
