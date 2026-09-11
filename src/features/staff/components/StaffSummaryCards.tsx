import { Skeleton } from '@/components/ui/skeleton'
import type { StaffSummary } from '../domain/types'

interface SummaryCardProps {
  label: string
  value: number
  sub: string
  isLoading?: boolean
}

function SummaryCard({ label, value, sub, isLoading }: SummaryCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <span className="font-heading text-3xl text-primary">{value}</span>
      )}
      {!isLoading && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

interface StaffSummaryCardsProps {
  summary: StaffSummary
  isLoading?: boolean
}

/** Fila de tarjetas de resumen del staff: personal activo, mozos y cocina
 * (con su gente en turno) y colaboradores que todavía no cambiaron su
 * contraseña provisoria. */
export function StaffSummaryCards({ summary, isLoading }: StaffSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard
        label="Personal activo"
        value={summary.activos}
        sub={`de ${summary.total} totales`}
        isLoading={isLoading}
      />
      <SummaryCard
        label="Mozos"
        value={summary.mozos}
        sub={`En turno: ${summary.mozosEnTurno}`}
        isLoading={isLoading}
      />
      <SummaryCard
        label="Cocina"
        value={summary.cocina}
        sub={`En turno: ${summary.cocinaEnTurno}`}
        isLoading={isLoading}
      />
      <SummaryCard
        label="Pendientes de cambiar clave"
        value={summary.pendientesDeAlta}
        sub="Todavía con clave provisoria"
        isLoading={isLoading}
      />
    </div>
  )
}
