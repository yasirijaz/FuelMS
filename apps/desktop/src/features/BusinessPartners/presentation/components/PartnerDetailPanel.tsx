import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormField,
  Input,
  Select,
  Textarea,
  useConfirm,
} from '@fuelms/ui'
import type { BusinessPartner } from '../../domain/entities/BusinessPartner'
import {
  PARTNER_ROLE_CODES,
  PARTNER_ROLE_LABELS,
  updateBusinessPartnerInputSchema,
  type PartnerRoleCode,
  type UpdateBusinessPartnerInput,
} from '../../domain'
import {
  useActivateBusinessPartner,
  useAssignPartnerRole,
  useDeactivateBusinessPartner,
  useRemovePartnerRole,
  useUpdateBusinessPartner,
} from '../../application/hooks/useBusinessPartnerQueries'

type PartnerDetailPanelProps = {
  partner: BusinessPartner
  onClose: () => void
}

export function PartnerDetailPanel({ partner, onClose }: PartnerDetailPanelProps) {
  const updateMutation = useUpdateBusinessPartner()
  const activateMutation = useActivateBusinessPartner()
  const deactivateMutation = useDeactivateBusinessPartner()
  const assignRoleMutation = useAssignPartnerRole()
  const removeRoleMutation = useRemovePartnerRole()
  const confirm = useConfirm()

  const partnerId = partner.id.toString()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBusinessPartnerInput>({
    resolver: zodResolver(updateBusinessPartnerInputSchema),
    defaultValues: {
      id: partnerId,
      displayName: partner.displayName.value,
      legalName: partner.legalName ?? '',
      phone: partner.phone ?? '',
      email: partner.email ?? '',
      taxId: partner.taxId ?? '',
      address: partner.address ?? '',
      notes: partner.notes ?? '',
      version: partner.version,
    },
  })

  useEffect(() => {
    reset({
      id: partnerId,
      displayName: partner.displayName.value,
      legalName: partner.legalName ?? '',
      phone: partner.phone ?? '',
      email: partner.email ?? '',
      taxId: partner.taxId ?? '',
      address: partner.address ?? '',
      notes: partner.notes ?? '',
      version: partner.version,
    })
  }, [partner, partnerId, reset])

  const availableRoles = PARTNER_ROLE_CODES.filter((role) => !partner.hasRole(role))
  const isBusy =
    updateMutation.isPending ||
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    assignRoleMutation.isPending ||
    removeRoleMutation.isPending

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ui-text)]">{partner.displayName.value}</h2>
          <p className="text-sm text-[var(--ui-text-muted)]">
            {partner.isActive ? 'Active partner' : 'Inactive partner'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>

      <CardBody className="space-y-6">
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            await updateMutation.mutateAsync(values)
          })}
        >
          <FormField
            id="edit-display-name"
            label="Display name"
            required
            error={errors.displayName?.message}
          >
            <Input
              id="edit-display-name"
              invalid={Boolean(errors.displayName)}
              {...register('displayName')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="edit-legal-name" label="Legal name">
              <Input id="edit-legal-name" {...register('legalName')} />
            </FormField>
            <FormField id="edit-phone" label="Phone">
              <Input id="edit-phone" {...register('phone')} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="edit-email" label="Email">
              <Input id="edit-email" type="email" {...register('email')} />
            </FormField>
            <FormField id="edit-tax-id" label="Tax ID">
              <Input id="edit-tax-id" {...register('taxId')} />
            </FormField>
          </div>

          <FormField id="edit-address" label="Address">
            <Input id="edit-address" {...register('address')} />
          </FormField>

          <FormField id="edit-notes" label="Notes">
            <Textarea id="edit-notes" rows={3} {...register('notes')} />
          </FormField>

          <input type="hidden" {...register('id')} />
          <input type="hidden" {...register('version', { valueAsNumber: true })} />

          {updateMutation.isError && (
            <p className="text-sm text-[var(--ui-danger)]">
              {updateMutation.error instanceof Error
                ? updateMutation.error.message
                : 'Failed to update partner.'}
            </p>
          )}

          <Button type="submit" disabled={isBusy}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>

        <section className="space-y-3 border-t border-[var(--ui-border)] pt-6">
          <h3 className="text-sm font-semibold text-[var(--ui-text)]">Roles</h3>
          <div className="flex flex-wrap gap-2">
            {partner.roles.length === 0 ? (
              <p className="text-sm text-[var(--ui-text-muted)]">No roles assigned.</p>
            ) : (
              partner.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-surface-hover)] px-3 py-1 text-sm"
                >
                  {PARTNER_ROLE_LABELS[role]}
                  <button
                    type="button"
                    className="text-[var(--ui-text-muted)] hover:text-[var(--ui-danger)] disabled:opacity-40"
                    disabled={isBusy || !partner.canRemoveRole(role)}
                    title={
                      partner.canRemoveRole(role)
                        ? 'Remove role'
                        : 'Cannot remove the last role from an active partner'
                    }
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: `Remove ${PARTNER_ROLE_LABELS[role]} role?`,
                        description: 'This partner will no longer have this role.',
                        confirmLabel: 'Remove role',
                        variant: 'danger',
                      })
                      if (!confirmed) return
                      await removeRoleMutation.mutateAsync({
                        partnerId,
                        roleCode: role,
                        version: partner.version,
                      })
                    }}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          {availableRoles.length > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <FormField id="assign-role" label="Assign role" className="min-w-[10rem] flex-1">
                <Select
                  id="assign-role"
                  defaultValue=""
                  onChange={async (event) => {
                    const roleCode = event.target.value as PartnerRoleCode
                    if (!roleCode) return
                    await assignRoleMutation.mutateAsync({
                      partnerId,
                      roleCode,
                      version: partner.version,
                    })
                    event.target.value = ''
                  }}
                  disabled={isBusy}
                >
                  <option value="">Select role…</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {PARTNER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          )}

          {(assignRoleMutation.isError || removeRoleMutation.isError) && (
            <p className="text-sm text-[var(--ui-danger)]">
              {(assignRoleMutation.error ?? removeRoleMutation.error) instanceof Error
                ? (assignRoleMutation.error ?? removeRoleMutation.error)?.message
                : 'Role change failed.'}
            </p>
          )}
        </section>

        <section className="flex flex-wrap gap-2 border-t border-[var(--ui-border)] pt-6">
          {partner.isActive ? (
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Deactivate partner?',
                  description: 'Inactive partners are hidden from default lists but remain in the system.',
                  confirmLabel: 'Deactivate',
                  variant: 'danger',
                })
                if (!confirmed) return
                await deactivateMutation.mutateAsync({
                  partnerId,
                  version: partner.version,
                })
              }}
            >
              {deactivateMutation.isPending ? 'Deactivating…' : 'Deactivate'}
            </Button>
          ) : (
            <Button
              disabled={isBusy || !partner.canBeActivated()}
              onClick={async () => {
                await activateMutation.mutateAsync({
                  partnerId,
                  version: partner.version,
                })
              }}
            >
              {activateMutation.isPending ? 'Activating…' : 'Activate'}
            </Button>
          )}

          {(activateMutation.isError || deactivateMutation.isError) && (
            <p className="w-full text-sm text-[var(--ui-danger)]">
              {(activateMutation.error ?? deactivateMutation.error) instanceof Error
                ? (activateMutation.error ?? deactivateMutation.error)?.message
                : 'Status change failed.'}
            </p>
          )}
        </section>
      </CardBody>
    </Card>
  )
}
