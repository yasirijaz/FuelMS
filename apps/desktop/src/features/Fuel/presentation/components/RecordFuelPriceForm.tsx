import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FuelProductCode } from '@fuelms/shared'
import { minorToRupees } from '@fuelms/shared'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FormField,
  FuelProductSelector,
  Input,
  MoneyInput,
  Textarea,
} from '@fuelms/ui'
import {
  recordFuelPriceInputSchema,
  type RecordFuelPriceInput,
} from '../../domain/priceManagement'
import { useRecordFuelPrice } from '../../application/hooks/useFuelPriceQueries'

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type RecordFuelPriceFormProps = {
  onSuccess?: () => void
}

export function RecordFuelPriceForm({ onSuccess }: RecordFuelPriceFormProps) {
  const recordMutation = useRecordFuelPrice()
  const [priceMinor, setPriceMinor] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecordFuelPriceInput>({
    resolver: zodResolver(recordFuelPriceInputSchema),
    defaultValues: {
      productCode: 'diesel',
      priceRupees: 0,
      effectiveFromIso: new Date().toISOString(),
      reason: '',
      reference: '',
    },
  })

  const productCode = watch('productCode') as FuelProductCode

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Record selling price</h2>
        <p className="text-sm text-[var(--ui-text-muted)]">
          New prices apply to future sales only. Historical sales keep their original price.
        </p>
      </CardHeader>
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            const priceRupees =
              priceMinor != null ? minorToRupees(priceMinor) : values.priceRupees
            await recordMutation.mutateAsync({
              ...values,
              priceRupees,
              reason: values.reason?.trim() || undefined,
              reference: values.reference?.trim() || undefined,
            })
            reset({
              productCode: values.productCode,
              priceRupees: 0,
              effectiveFromIso: new Date().toISOString(),
              reason: '',
              reference: '',
            })
            setPriceMinor(null)
            onSuccess?.()
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

          <MoneyInput
            id="fuel-price-amount"
            label="Selling price per litre"
            valueMinor={priceMinor}
            onChangeMinor={(minor) => {
              setPriceMinor(minor)
              if (minor != null) {
                setValue('priceRupees', minorToRupees(minor), { shouldValidate: true })
              }
            }}
            required
            error={errors.priceRupees?.message}
          />

          <FormField
            id="fuel-price-effective"
            label="Effective from"
            hint="Use a future date/time to schedule a price change."
          >
            <Input
              id="fuel-price-effective"
              type="datetime-local"
              defaultValue={toLocalDateTimeValue(new Date())}
              {...register('effectiveFromIso', {
                setValueAs: (value: string) => {
                  if (!value) return new Date().toISOString()
                  return new Date(value).toISOString()
                },
              })}
            />
            {errors.effectiveFromIso && (
              <p className="mt-1 text-xs text-[var(--ui-danger)]">{errors.effectiveFromIso.message}</p>
            )}
          </FormField>

          <FormField id="fuel-price-reason" label="Reason (optional)">
            <Textarea id="fuel-price-reason" rows={2} {...register('reason')} />
          </FormField>

          <FormField id="fuel-price-reference" label="Reference (optional)">
            <Input id="fuel-price-reference" {...register('reference')} />
          </FormField>

          {recordMutation.isError && (
            <p className="text-sm text-[var(--ui-danger)]">
              {recordMutation.error instanceof Error
                ? recordMutation.error.message
                : 'Could not save price.'}
            </p>
          )}

          <Button type="submit" disabled={recordMutation.isPending || priceMinor == null}>
            {recordMutation.isPending ? 'Saving…' : 'Save price'}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
