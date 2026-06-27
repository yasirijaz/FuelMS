import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { BusinessPartnerOption, FuelProductCode } from '@fuelms/shared'
import { minorToRupees } from '@fuelms/shared'
import {
  Button,
  BusinessPartnerSelector,
  FormField,
  FuelProductSelector,
  FuelQuantityInput,
  Input,
  Modal,
  MoneyInput,
  Select,
  Textarea,
  useToast,
} from '@fuelms/ui'
import { useBusinessPartnerList } from '@features/BusinessPartners/application/hooks/useBusinessPartnerQueries'
import {
  PURCHASE_PAYMENT_STATUSES,
  recordFuelPurchaseInputSchema,
  type RecordFuelPurchaseInput,
} from '../../domain'
import { PURCHASE_PAYMENT_STATUS_LABELS } from '../../application/types/PurchaseListItem'
import { useRecordPurchase } from '../../application/hooks/usePurchaseQueries'
import { toIsoFromDateInput, toLocalDateInputValue } from '@shared/utils/dateInput'

type RecordPurchaseModalProps = {
  open: boolean
  onClose: () => void
  onRecorded?: () => void
}

export function RecordPurchaseModal({ open, onClose, onRecorded }: RecordPurchaseModalProps) {
  const { toast } = useToast()
  const recordMutation = useRecordPurchase()
  const { data: suppliers, isLoading: suppliersLoading } = useBusinessPartnerList({
    roleCode: 'supplier',
    activeOnly: true,
  })

  const partnerOptions: BusinessPartnerOption[] = useMemo(
    () =>
      (suppliers ?? []).map((partner) => ({
        id: partner.id.toString(),
        displayName: partner.displayName.value,
        roles: [...partner.roles],
      })),
    [suppliers],
  )

  const [quantityLitres, setQuantityLitres] = useState<number | null>(null)
  const [unitCostMinor, setUnitCostMinor] = useState<number | null>(null)
  const [supplierId, setSupplierId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecordFuelPurchaseInput>({
    resolver: zodResolver(recordFuelPurchaseInputSchema),
    defaultValues: {
      productCode: 'diesel',
      quantityLitres: 0,
      unitCostRupees: 0,
      purchaseDateIso: toLocalDateInputValue(new Date()),
      paymentStatus: 'paid',
      invoiceReference: '',
      notes: '',
      postImmediately: false,
    },
  })

  const productCode = watch('productCode') as FuelProductCode
  const paymentStatus = watch('paymentStatus')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record fuel purchase"
      description="Enter delivery details. Save as draft or post immediately to create inventory."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-purchase-form"
            disabled={
              recordMutation.isPending ||
              quantityLitres == null ||
              unitCostMinor == null
            }
          >
            {recordMutation.isPending ? 'Saving…' : 'Save purchase'}
          </Button>
        </>
      }
    >
      <form
        id="record-purchase-form"
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          if (values.paymentStatus === 'credit' && !supplierId) {
            toast({
              title: 'Supplier required',
              description: 'Select a supplier for credit purchases.',
              variant: 'error',
            })
            return
          }

          const unitCostRupees =
            unitCostMinor != null ? minorToRupees(unitCostMinor) : values.unitCostRupees
          const quantity = quantityLitres ?? values.quantityLitres

          try {
            await recordMutation.mutateAsync({
              ...values,
              quantityLitres: quantity,
              unitCostRupees,
              purchaseDateIso: toIsoFromDateInput(values.purchaseDateIso),
              supplierPartnerId: supplierId ?? undefined,
              invoiceReference: values.invoiceReference?.trim() || undefined,
              notes: values.notes?.trim() || undefined,
            })
            toast({ title: 'Purchase recorded', variant: 'success' })
            reset()
            setQuantityLitres(null)
            setUnitCostMinor(null)
            setSupplierId(null)
            onRecorded?.()
            onClose()
          } catch (error) {
            toast({
              title: 'Could not record purchase',
              description: error instanceof Error ? error.message : undefined,
              variant: 'error',
            })
          }
        })}
      >
        <FuelProductSelector
          mode="segmented"
          value={productCode}
          onChange={(code) => {
            if (code) setValue('productCode', code, { shouldValidate: true })
          }}
          error={errors.productCode?.message}
        />

        <FuelQuantityInput
          label="Quantity received"
          valueLitres={quantityLitres}
          onChangeLitres={(litres) => {
            setQuantityLitres(litres)
            if (litres != null) {
              setValue('quantityLitres', litres, { shouldValidate: true })
            }
          }}
          required
          error={errors.quantityLitres?.message}
        />

        <MoneyInput
          id="purchase-unit-cost"
          label="Purchase rate per litre"
          valueMinor={unitCostMinor}
          onChangeMinor={(minor) => {
            setUnitCostMinor(minor)
            if (minor != null) {
              setValue('unitCostRupees', minorToRupees(minor), { shouldValidate: true })
            }
          }}
          required
          error={errors.unitCostRupees?.message}
        />

        <FormField id="purchase-date" label="Purchase date" required>
          <Input
            id="purchase-date"
            type="date"
            {...register('purchaseDateIso')}
          />
          {errors.purchaseDateIso && (
            <p className="mt-1 text-xs text-[var(--ui-danger)]">{errors.purchaseDateIso.message}</p>
          )}
        </FormField>

        <FormField id="purchase-payment-status" label="Payment status" required>
          <Select
            id="purchase-payment-status"
            invalid={Boolean(errors.paymentStatus)}
            {...register('paymentStatus')}
          >
            {PURCHASE_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PURCHASE_PAYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          {errors.paymentStatus && (
            <p className="mt-1 text-xs text-[var(--ui-danger)]">{errors.paymentStatus.message}</p>
          )}
        </FormField>

        {paymentStatus === 'credit' && (
          <BusinessPartnerSelector
            label="Supplier"
            value={supplierId}
            onChange={setSupplierId}
            partners={partnerOptions}
            isLoading={suppliersLoading}
            error={
              paymentStatus === 'credit' && !supplierId
                ? 'Supplier is required for credit purchases.'
                : undefined
            }
          />
        )}

        <FormField id="purchase-invoice-ref" label="Invoice reference (optional)">
          <Input id="purchase-invoice-ref" {...register('invoiceReference')} />
        </FormField>

        <FormField id="purchase-notes" label="Notes (optional)">
          <Textarea id="purchase-notes" rows={2} {...register('notes')} />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-[var(--ui-text)]">
          <input type="checkbox" {...register('postImmediately')} className="rounded" />
          Post immediately (creates inventory batch)
        </label>

        {recordMutation.isError && (
          <p className="text-sm text-[var(--ui-danger)]">
            {recordMutation.error instanceof Error
              ? recordMutation.error.message
              : 'Could not save purchase.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
