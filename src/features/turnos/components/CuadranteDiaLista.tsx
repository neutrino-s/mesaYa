import { CalendarX, CheckCircle2, Circle } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { StaffAvatar } from '@/features/staff/components/StaffAvatar'
import { cn } from '@/lib/utils'
import type { Staff } from '@/types/staff'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { AREA_OPTIONS, estadoTurnoBadgeClasses, horasDeTurno } from '../domain/cuadranteRules'
import { useSetEstadoTurnoAsignado } from '../hooks/useSetEstadoTurnoAsignado'

interface CuadranteDiaListaProps {
  restauranteId: string | null
  staff: Staff[]
  turnos: TurnoAsignado[]
  onEditarTurno: (turno: TurnoAsignado) => void
  puedeGestionar: boolean
}

/** Vista diaria: turnos agrupados por área, ordenados por hora de inicio.
 * El badge de estado duplica de acción rápida: un click alterna
 * planificado/confirmado sin abrir el diálogo completo. */
export function CuadranteDiaLista({
  restauranteId,
  staff,
  turnos,
  onEditarTurno,
  puedeGestionar,
}: CuadranteDiaListaProps) {
  const setEstado = useSetEstadoTurnoAsignado(restauranteId)
  const staffPorId = new Map(staff.map((member) => [member.id, member]))

  if (turnos.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="Sin turnos este día"
        description="Agregá uno con el botón «Nuevo turno»."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {AREA_OPTIONS.map((areaOption) => {
        const turnosDelArea = turnos
          .filter((turno) => turno.area === areaOption.value)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        if (turnosDelArea.length === 0) return null

        return (
          <div key={areaOption.value} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-heading text-base text-foreground">{areaOption.label}</h3>
              <span className="text-xs text-muted-foreground">
                {turnosDelArea.length} turno{turnosDelArea.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {turnosDelArea.map((turno) => {
                const empleado = staffPorId.get(turno.staffId)
                return (
                  <li key={turno.id} className="flex items-center gap-3 px-4 py-3">
                    {empleado ? (
                      <StaffAvatar nombre={empleado.nombre} rol={empleado.rol} className="size-8 shrink-0" />
                    ) : null}
                    {puedeGestionar ? (
                      <button
                        type="button"
                        onClick={() => onEditarTurno(turno)}
                        className="flex flex-1 flex-col items-start text-left"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {empleado?.nombre ?? 'Empleado'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {turno.horaInicio}–{turno.horaFin} · {horasDeTurno(turno).toFixed(1)}h
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-1 flex-col items-start">
                        <span className="text-sm font-medium text-foreground">
                          {empleado?.nombre ?? 'Empleado'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {turno.horaInicio}–{turno.horaFin} · {horasDeTurno(turno).toFixed(1)}h
                        </span>
                      </div>
                    )}
                    {puedeGestionar ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEstado.mutate({
                            turnoId: turno.id,
                            estado: turno.estado === 'confirmado' ? 'planificado' : 'confirmado',
                          })
                        }
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80',
                          estadoTurnoBadgeClasses(turno.estado),
                        )}
                      >
                        {turno.estado === 'confirmado' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {turno.estado === 'confirmado' ? 'Confirmado' : 'Planificado'}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
                          estadoTurnoBadgeClasses(turno.estado),
                        )}
                      >
                        {turno.estado === 'confirmado' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {turno.estado === 'confirmado' ? 'Confirmado' : 'Planificado'}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
