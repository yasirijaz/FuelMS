import { useEffect, useMemo, useState } from 'react'
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
import { useFuelPriceOverview } from '@features/Fuel/application/hooks/useFuelPriceQueries'
import {
  SALE_PAYMENT_METHODS,
  milliLitresToLitres,
  recordFuelSaleInputSchema,
  type RecordFuelSaleInput,
} from '../../domain'
import { SALE_PAYMENT_METHOD_LABELS } from '../../application/types/SaleListItem'
import {
  useAvailableStock,
  useRecordSale,
} from '../../application/hooks/useSaleQueries'
import { toIsoFromDateInput, toLocalDateInputValue } from '@shared/utils/dateInput'

type RecordSaleModalProps = {
  open: boolean
  onClose: () => void
  onRecorded?: () => void
}

export function RecordSaleModal({ open, onClose, onRecorded }: RecordSaleModalProps) {
  const { toast } = useToast()
  const recordMutation = useRecordSale()
  const { data: priceOverview, isLoading: pricesLoading } = useFuelPriceOverview()
  const { data: customers, isLoading: customersLoading } = useBusinessPartnerList({
    roleCode: 'customer',
    activeOnly: true,
  })

  const partnerOptions: BusinessPartnerOption[] = useMemo(
    () =>
      (customers ?? []).map((partner) => ({
        id: partner.id.toString(),
        displayName: partner.displayName.value,
        roles: [...partner.roles],
      })),
    [customers],
  )

  const [quantityLitres, setQuantityLitres] = useState<number | null>(null)
  const [unitPriceMinor, setUnitPriceMinor] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecordFuelSaleInput>({
    resolver: zodResolver(recordFuelSaleInputSchema),
    defaultValues: {
      productCode: 'diesel',
      quantityLitres: 0,
      unitPriceRupees: 0,
      fuelPriceRecordId: '',
      saleDateIso: toLocalDateInputValue(new Date()),
      paymentMethod: 'cash',
      reference: '',
      notes: '',
      postImmediately: false,
    },
  })

  const productCode = watch('productCode') as FuelProductCode
  const paymentMethod = watch('paymentMethod')
  const fuelPriceRecordId = watch('fuelPriceRecordId')

  const { data: stock, isLoading: stockLoading } = useAvailableStock(productCode)

  const activePriceForProduct = useMemo(() => {
    return priceOverview?.activePrices.find((entry) => entry.productCode === productCode) ?? null
  }, [priceOverview, productCode])

  useEffect(() => {
    if (!open) return

    const active = activePriceForProduct
    if (active?.priceMinorPerLitre != null && active.recordId) {
      setUnitPriceMinor(active.priceMinorPerLitre)
      setValue('unitPriceRupees', minorToRupees(active.priceMinorPerLitre), {
        shouldValidate: true,
      })
      setValue('fuelPriceRecordId', active.recordId, { shouldValidate: true })
    } else {
      setUnitPriceMinor(null)
      setValue('unitPriceRupees', 0)
      setValue('fuelPriceRecordId', '')
    }
  }, [open, activePriceForProduct, setValue])

  const stockHint =
    stockLoading || !stock
      ? null
      : `${milliLitresToLitres(stock.availableMilliLitres).toLocaleString(undefined, { maximumFractionDigits: 3 })} L available`

  const priceMissing = !pricesLoading && !activePriceForProduct?.recordId

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record fuel sale"
      description="Enter sale details. Save as draft or post immediately to consume inventory."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-sale-form"
            disabled={
              recordMutation.isPending ||
              quantityLitres == null ||
              unitPriceMinor == null ||
              !fuelPriceRecordId ||
              priceMissing
            }
          >
            {recordMutation.isPending ? 'Saving…' : 'Save sale'}
          </Button>
        </>
      }
    >
      <form
        id="record-sale-form"
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          if (values.paymentMethod === 'credit' && !customerId) {
            toast({
              title: 'Customer required',
              description: 'Select a customer for credit sales.',
              variant: 'error',
            })
            return
          }

          if (!values.fuelPriceRecordId) {
            toast({
              title: 'Active price required',
              description: 'Record an active fuel price for this product before selling.',
              variant: 'error',
            })
            return
          }

          const unitPriceRupees =
            unitPriceMinor != null ? minorToRupees(unitPriceMinor) : values.unitPriceRupees
          const quantity = quantityLitres ?? values.quantityLitres

          try {
            await recordMutation.mutateAsync({
              ...values,
              quantityLitres: quantity,
              unitPriceRupees,
              saleDateIso: toIsoFromDateInput(values.saleDateIso),
              customerPartnerId: customerId ?? undefined,
              reference: values.reference?.trim() || undefined,
              notes: values.notes?.trim() || undefined,
            })
            toast({ title: 'Sale recorded', variant: 'success' })
            reset()
            setQuantityLitres(null)
            setUnitPriceMinor(null)
            setCustomerId(null)
            onRecorded?.()
            onClose()
          } catch (error) {
            toast({
              title: 'Could not record sale',
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

        {stockHint && (
          <p className="text-sm text-[var(--ui-text-muted)]">Stock: {stockHint}</p>
        )}

        {priceMissing && (
          <p className="rounded-[var(--ui-radius)] border border-[var(--ui-danger)]/30 bg-[var(--ui-danger)]/10 px-3 py-2 text-sm text-[var(--ui-danger)]">
            No active price for {productCode}. Record a fuel price first.
          </p>
        )}

        <FuelQuantityInput
          label="Quantity sold"
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
          id="sale-unit-price"
          label="Selling price per litre"
          valueMinor={unitPriceMinor}
          onChangeMinor={(minor) => {
            setUnitPriceMinor(minor)
            if (minor != null) {
              setValue('unitPriceRupees', minorToRupees(minor), { shouldValidate: true })
            }
          }}
          required
          error={errors.unitPriceRupees?.message}
        />

        <input type="hidden" {...register('fuelPriceRecordId')} />

        <FormField id="sale-date" label="Sale date" required>
          <Input id="sale-date" type="date" {...register('saleDateIso')} />
          {errors.saleDateIso && (
            <p className="mt-1 text-xs text-[var(--ui-danger)]">{errors.saleDateIso.message}</p>
          )}
        </FormField>

        <FormField id="sale-payment-method" label="Payment method" required>
          <Select
            id="sale-payment-method"
            invalid={Boolean(errors.paymentMethod)}
            {...register('paymentMethod')}
          >
            {SALE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {SALE_PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </Select>
          {errors.paymentMethod && (
            <p className="mt-1 text-xs text-[var(--ui-danger)]">{errors.paymentMethod.message}</p>
          )}
        </FormField>

        {paymentMethod === 'credit' && (
          <BusinessPartnerSelector
            label="Customer"
            value={customerId}
            onChange={setCustomerId}
            partners={partnerOptions}
            isLoading={customersLoading}
            error={
              paymentMethod === 'credit' && !customerId
                ? 'Customer is required for credit sales.'
                : undefined
            }
          />
        )}

        <FormField id="sale-reference" label="Reference (optional)">
          <Input id="sale-reference" {...register('reference')} />
        </FormField>

        <FormField id="sale-notes" label="Notes (optional)">
          <Textarea id="sale-notes" rows={2} {...register('notes')} />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-[var(--ui-text)]">
          <input type="checkbox" {...register('postImmediately')} className="rounded" />
          Post immediately (consumes inventory via FIFO)
        </label>

        {recordMutation.isError && (
          <p className="text-sm text-[var(--ui-danger)]">
            {recordMutation.error instanceof Error
              ? recordMutation.error.message
              : 'Could not save sale.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
