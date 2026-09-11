import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus } from 'lucide-react'

import { StaffAvatar } from '@/features/staff/components/StaffAvatar'
import { cn } from '@/lib/utils'
import type { Staff } from '@/types/staff'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { diasDeSemana, estadoLimiteContractual, fechaId, horasPlanificadasEnRango } from '../domain/cuadranteRules'
import { TurnoAsignadoChip } from './TurnoAsignadoChip'

interface CuadranteSemanaGridProps {
  fechaAncla: Date
  staff: Staff[]
  turnos: TurnoAsignado[]
  onNuevoTurno: (valoresIniciales: { staffId: string; fecha: string }) => void
  onEditarTurno: (turno: TurnoAsignado) => void
  puedeGestionar: boolean
}

const ESTADO_LIMITE_CLASSES: Record<string, string> = {
  ok: 'text-muted-foreground',
  cerca: 'text-amber-700 dark:text-amber-400',
  excedido: 'text-destructive font-semibold',
  sin_limite: 'text-muted-foreground',
}

/** Vista semanal: filas por empleado, columnas por día, con el total de
 * horas planificadas de la semana proyectado contra su tope contractual
 * (`estadoLimiteContractual`) en la última columna. */
export function CuadranteSemanaGrid({
  fechaAncla,
  staff,
  turnos,
  onNuevoTurno,
  onEditarTurno,
  puedeGestionar,
}: CuadranteSemanaGridProps) {
  const dias = diasDeSemana(fechaAncla)
  const fechaDesde = fechaId(dias[0])
  const fechaHasta = fechaId(dias[6])

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 min-w-44 bg-card px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Empleado
            </th>
            {dias.map((dia) => (
              <th
                key={dia.toISOString()}
                className="min-w-28 px-2 py-3 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {format(dia, 'EEE d', { locale: es })}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Horas
            </th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => {
            const horas = horasPlanificadasEnRango(turnos, member.id, fechaDesde, fechaHasta)
            const estadoLimite = estadoLimiteContractual(horas, member.horasSemanalesContrato)

            return (
              <tr key={member.id} className="border-b border-border last:border-b-0">
                <td className="sticky left-0 z-10 bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StaffAvatar nombre={member.nombre} rol={member.rol} className="size-7" />
                    <span className="truncate font-medium text-foreground">{member.nombre}</span>
                  </div>
                </td>
                {dias.map((dia) => {
                  const fecha = fechaId(dia)
                  const turnosDelDia = turnos.filter((t) => t.staffId === member.id && t.fecha === fecha)
                  return (
                    <td key={fecha} className="px-1.5 py-2 align-top">
                      <div className="flex min-h-10 flex-col gap-1">
                        {turnosDelDia.map((turno) => (
                          <TurnoAsignadoChip
                            key={turno.id}
                            turno={turno}
                            onClick={puedeGestionar ? () => onEditarTurno(turno) : undefined}
                          />
                        ))}
                        {puedeGestionar ? (
                          <button
                            type="button"
                            onClick={() => onNuevoTurno({ staffId: member.id, fecha })}
                            aria-label={`Agregar turno a ${member.nombre} el ${fecha}`}
                            className="flex items-center justify-center rounded-md border border-dashed border-border py-1 text-muted-foreground/70 transition-colors hover:border-primary hover:text-primary"
                          >
                            <Plus size={14} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-right">
                  <span className={cn('text-xs font-medium tabular-nums', ESTADO_LIMITE_CLASSES[estadoLimite])}>
                    {horas.toFixed(1)}h{member.horasSemanalesContrato ? ` / ${member.horasSemanalesContrato}h` : ''}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
