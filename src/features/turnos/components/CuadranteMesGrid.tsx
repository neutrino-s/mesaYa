import { format, isSameMonth, isToday } from 'date-fns'

import { cn } from '@/lib/utils'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { diasDeGrillaMensual, fechaId } from '../domain/cuadranteRules'

interface CuadranteMesGridProps {
  fechaAncla: Date
  turnos: TurnoAsignado[]
  onSeleccionarDia: (fecha: Date) => void
}

const DIAS_SEMANA_LABEL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Vista mensual: grilla con la cantidad de turnos por día, sin detalle —
 * clickear un día cambia a la vista diaria (`onSeleccionarDia`). */
export function CuadranteMesGrid({ fechaAncla, turnos, onSeleccionarDia }: CuadranteMesGridProps) {
  const dias = diasDeGrillaMensual(fechaAncla)
  const turnosPorFecha = new Map<string, number>()
  for (const turno of turnos) {
    turnosPorFecha.set(turno.fecha, (turnosPorFecha.get(turno.fecha) ?? 0) + 1)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b border-border">
        {DIAS_SEMANA_LABEL.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia, index) => {
          const fecha = fechaId(dia)
          const enMes = isSameMonth(dia, fechaAncla)
          const cantidad = turnosPorFecha.get(fecha) ?? 0
          const esUltimaColumna = (index + 1) % 7 === 0
          const esUltimaFila = index >= dias.length - 7

          return (
            <button
              type="button"
              key={fecha}
              onClick={() => onSeleccionarDia(dia)}
              className={cn(
                'flex min-h-20 flex-col items-start gap-1.5 border-border p-2 text-left transition-colors hover:bg-muted/40',
                !esUltimaColumna && 'border-r',
                !esUltimaFila && 'border-b',
                !enMes && 'bg-muted/20 text-muted-foreground/60',
              )}
            >
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday(dia) && 'bg-primary text-primary-foreground',
                )}
              >
                {format(dia, 'd')}
              </span>
              {cantidad > 0 ? (
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {cantidad} turno{cantidad === 1 ? '' : 's'}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
