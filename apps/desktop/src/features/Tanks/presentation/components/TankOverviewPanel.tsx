import { Card, CardBody, CardHeader, TankVisual } from '@fuelms/ui'
import type { TankProductSummary } from '../../application/utils/aggregateTankListByProduct'

type TankOverviewPanelProps = {
  summaries: TankProductSummary[]
}

export function TankOverviewPanel({ summaries }: TankOverviewPanelProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-[var(--ui-text)]">Tank levels</h2>
        <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">
          Book stock vs total capacity across active tanks.
        </p>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <TankVisual
              key={summary.productCode}
              productCode={summary.productCode}
              fillPercent={summary.fillPercent}
              capacityLitres={summary.capacityLitres > 0 ? summary.capacityLitres : undefined}
              currentLitres={summary.currentLitres > 0 ? summary.currentLitres : undefined}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
