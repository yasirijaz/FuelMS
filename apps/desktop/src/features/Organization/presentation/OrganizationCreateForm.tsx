import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateOrganizationInput } from '../domain'
import { createOrganizationInputSchema } from '../domain'
import { useCreateOrganization } from '../application/hooks/useOrganizationQueries'

type OrganizationFormProps = {
  onSuccess?: () => void
}

export function OrganizationCreateForm({ onSuccess }: OrganizationFormProps) {
  const createMutation = useCreateOrganization()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationInputSchema),
    defaultValues: {
      name: '',
      legalName: '',
      address: '',
      city: '',
      phone: '',
      taxId: '',
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        await createMutation.mutateAsync(values)
        reset()
        onSuccess?.()
      })}
    >
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="org-name">
          Display name *
        </label>
        <input
          id="org-name"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          {...register('name')}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="org-legal">
            Legal name
          </label>
          <input
            id="org-legal"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...register('legalName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="org-city">
            City
          </label>
          <input
            id="org-city"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...register('city')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="org-address">
          Address
        </label>
        <input
          id="org-address"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          {...register('address')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="org-phone">
            Phone
          </label>
          <input
            id="org-phone"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...register('phone')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="org-tax">
            Tax ID
          </label>
          <input
            id="org-tax"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...register('taxId')}
          />
        </div>
      </div>

      {createMutation.isError && (
        <p className="text-sm text-red-600">
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : 'Failed to create organization.'}
        </p>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {createMutation.isPending ? 'Creating…' : 'Create organization'}
      </button>
    </form>
  )
}
