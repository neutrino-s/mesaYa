import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  label: string
  value: string
  sub: string
  valueClassName?: string
  isLoading?: boolean
}

function SummaryCard({ label, value, sub, valueClassName, isLoading }: SummaryCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <span className={cn('font-heading text-3xl tabular-nums text-primary', valueClassName)}>{value}</span>
      )}
      {!isLoading && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

interface MetricasResumenCardsProps {
  horasPlanificadas: number
  horasTrabajadas: number
  cumplimiento: number | null
  ausentismo: number | null
  isLoading?: boolean
}

/** Fila de tarjetas de resumen del período elegido en Métricas: horas
 * planificadas vs. trabajadas, cumplimiento del cuadrante y ausentismo. */
export function MetricasResumenCards({
  horasPlanificadas,
  horasTrabajadas,
  cumplimiento,
  ausentismo,
  isLoading,
}: MetricasResumenCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard label="Horas planificadas" value={`${horasPlanificadas.toFixed(1)}h`} sub="Suma del cuadrante" isLoading={isLoading} />
      <SummaryCard label="Horas trabajadas" value={`${horasTrabajadas.toFixed(1)}h`} sub="Según fichajes" isLoading={isLoading} />
      <SummaryCard
        label="Cumplimiento"
        value={cumplimiento === null ? '—' : `${cumplimiento.toFixed(0)}%`}
        sub="Trabajadas / planificadas"
        valueClassName={cumplimiento !== null && cumplimiento < 85 ? 'text-destructive' : undefined}
        isLoading={isLoading}
      />
      <SummaryCard
        label="Ausentismo"
        value={ausentismo === null ? '—' : `${ausentismo.toFixed(0)}%`}
        sub="Turnos sin ningún fichaje"
        valueClassName={ausentismo !== null && ausentismo > 10 ? 'text-destructive' : undefined}
        isLoading={isLoading}
      />
    </div>
  )
}
