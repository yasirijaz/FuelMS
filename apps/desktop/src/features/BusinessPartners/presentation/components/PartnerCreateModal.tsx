import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  FormField,
  Input,
  Modal,
  Textarea,
} from '@fuelms/ui'
import {
  PARTNER_ROLE_CODES,
  PARTNER_ROLE_LABELS,
  createBusinessPartnerInputSchema,
  type CreateBusinessPartnerInput,
  type PartnerRoleCode,
} from '../../domain'
import { useCreateBusinessPartner } from '../../application/hooks/useBusinessPartnerQueries'

type PartnerCreateModalProps = {
  open: boolean
  onClose: () => void
  onCreated?: (partnerId: string) => void
}

export function PartnerCreateModal({ open, onClose, onCreated }: PartnerCreateModalProps) {
  const createMutation = useCreateBusinessPartner()
  const [selectedRoles, setSelectedRoles] = useState<PartnerRoleCode[]>(['customer'])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBusinessPartnerInput>({
    resolver: zodResolver(createBusinessPartnerInputSchema),
    defaultValues: {
      displayName: '',
      legalName: '',
      phone: '',
      email: '',
      taxId: '',
      address: '',
      notes: '',
      roles: ['customer'],
    },
  })

  function toggleRole(role: PartnerRoleCode): void {
    setSelectedRoles((current) => {
      if (current.includes(role)) {
        return current.filter((item) => item !== role)
      }
      return [...current, role].sort()
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New business partner"
      description="Add a supplier, customer, employee, or other party. At least one role is required."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="partner-create-form"
            disabled={createMutation.isPending || selectedRoles.length === 0}
          >
            {createMutation.isPending ? 'Creating…' : 'Create partner'}
          </Button>
        </>
      }
    >
      <form
        id="partner-create-form"
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const result = await createMutation.mutateAsync({
            ...values,
            roles: selectedRoles,
          })
          reset()
          setSelectedRoles(['customer'])
          onCreated?.(result.id.toString())
          onClose()
        })}
      >
        <FormField id="partner-display-name" label="Display name" required error={errors.displayName?.message}>
          <Input id="partner-display-name" invalid={Boolean(errors.displayName)} {...register('displayName')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="partner-legal-name" label="Legal name">
            <Input id="partner-legal-name" {...register('legalName')} />
          </FormField>
          <FormField id="partner-phone" label="Phone">
            <Input id="partner-phone" {...register('phone')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="partner-email" label="Email">
            <Input id="partner-email" type="email" {...register('email')} />
          </FormField>
          <FormField id="partner-tax-id" label="Tax ID">
            <Input id="partner-tax-id" {...register('taxId')} />
          </FormField>
        </div>

        <FormField id="partner-address" label="Address">
          <Input id="partner-address" {...register('address')} />
        </FormField>

        <FormField id="partner-notes" label="Notes">
          <Textarea id="partner-notes" rows={3} {...register('notes')} />
        </FormField>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--ui-text)]">Roles *</legend>
          <div className="flex flex-wrap gap-2">
            {PARTNER_ROLE_CODES.map((role) => {
              const active = selectedRoles.includes(role)
              return (
                <Button
                  key={role}
                  type="button"
                  size="sm"
                  variant={active ? 'primary' : 'secondary'}
                  onClick={() => toggleRole(role)}
                >
                  {PARTNER_ROLE_LABELS[role]}
                </Button>
              )
            })}
          </div>
          {selectedRoles.length === 0 && (
            <p className="text-xs text-[var(--ui-danger)]">Select at least one role.</p>
          )}
        </fieldset>

        {createMutation.isError && (
          <p className="text-sm text-[var(--ui-danger)]">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Failed to create partner.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
