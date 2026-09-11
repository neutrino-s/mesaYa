import { CircleCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { areaBadgeClasses } from '../domain/cuadranteRules'

interface TurnoAsignadoChipProps {
  turno: TurnoAsignado
  /** Sin handler, el chip queda de solo lectura (`div` en vez de `button`) —
   * caso del personal sin permiso para editar el cuadrante. */
  onClick?: () => void
}

/** Turno individual dentro de una celda del cuadrante: horario + color de
 * área. El tilde indica `estado === 'confirmado'`. */
export function TurnoAsignadoChip({ turno, onClick }: TurnoAsignadoChipProps) {
  const classes = cn(
    'flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-medium',
    onClick && 'transition-opacity hover:opacity-80',
    areaBadgeClasses(turno.area),
  )
  const content = (
    <>
      {turno.estado === 'confirmado' ? <CircleCheck size={12} className="shrink-0" /> : null}
      <span className="truncate">
        {turno.horaInicio}–{turno.horaFin}
      </span>
    </>
  )

  if (!onClick) return <div className={classes}>{content}</div>

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  )
}
