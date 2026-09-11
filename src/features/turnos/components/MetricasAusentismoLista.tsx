import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertCircle } from 'lucide-react'

import { StaffAvatar } from '@/features/staff/components/StaffAvatar'
import type { Staff } from '@/types/staff'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { parseFechaId } from '../domain/cuadranteRules'

interface MetricasAusentismoListaProps {
  ausencias: TurnoAsignado[]
  staff: Staff[]
}

/** Detalle de `turnosAusentesEnRango`: qué turno, de quién, y cuándo —
 * para poder seguir la métrica de ausentismo con algo accionable. */
export function MetricasAusentismoLista({ ausencias, staff }: MetricasAusentismoListaProps) {
  const staffPorId = new Map(staff.map((member) => [member.id, member]))

  if (ausencias.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin ausencias detectadas en este período.</p>
  }

  const ordenadas = [...ausencias].sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <ul className="flex flex-col gap-2">
      {ordenadas.map((turno) => {
        const empleado = staffPorId.get(turno.staffId)
        return (
          <li key={turno.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
            {empleado ? (
              <StaffAvatar nombre={empleado.nombre} rol={empleado.rol} className="size-8 shrink-0" />
            ) : null}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{empleado?.nombre ?? 'Empleado'}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseFechaId(turno.fecha), "EEEE d 'de' MMMM", { locale: es })} · turno {turno.horaInicio}–
                {turno.horaFin}
              </p>
            </div>
            <AlertCircle size={16} className="shrink-0 text-destructive" />
          </li>
        )
      })}
    </ul>
  )
}
