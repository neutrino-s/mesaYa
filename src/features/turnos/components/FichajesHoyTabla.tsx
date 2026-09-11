import { format } from 'date-fns'
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react'

import { StaffAvatar } from '@/features/staff/components/StaffAvatar'
import { cn } from '@/lib/utils'
import type { Fichaje } from '@/types/fichaje'
import type { Staff } from '@/types/staff'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import {
  clasificarSinFichaje,
  estadoEntrada,
  estadoSalida,
  filasFichajeDelDia,
  horasTrabajadas,
} from '../domain/fichajeRules'

interface FichajesHoyTablaProps {
  staff: Staff[]
  turnosDeHoy: TurnoAsignado[]
  fichajesDeHoy: Fichaje[]
}

/** Comparativa del equipo completo: turno planificado vs. fichaje real, con
 * el estado (tarde, ausente, salida anticipada, etc.) de un vistazo — solo
 * para quien gestiona el cuadrante (`puedeGestionarTurnos`). */
export function FichajesHoyTabla({ staff, turnosDeHoy, fichajesDeHoy }: FichajesHoyTablaProps) {
  const ahora = new Date()
  const filas = filasFichajeDelDia(turnosDeHoy, fichajesDeHoy)
  const staffPorId = new Map(staff.map((member) => [member.id, member]))

  if (filas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nadie tiene turno planificado ni fichó hoy.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Empleado
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Turno
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Fichaje
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ staffId, turno, fichaje }) => {
            const empleado = staffPorId.get(staffId)
            if (!empleado) return null

            return (
              <tr key={staffId} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StaffAvatar nombre={empleado.nombre} rol={empleado.rol} className="size-7" />
                    <span className="truncate font-medium text-foreground">{empleado.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {turno ? `${turno.horaInicio}–${turno.horaFin}` : 'Sin turno planificado'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                  {fichaje ? (
                    <>
                      {format(fichaje.entrada.toDate(), 'HH:mm')}
                      {fichaje.salida ? `–${format(fichaje.salida.toDate(), 'HH:mm')}` : ' – en curso'}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <EstadoFichajeBadge turno={turno} fichaje={fichaje} ahora={ahora} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EstadoFichajeBadge({
  turno,
  fichaje,
  ahora,
}: {
  turno: TurnoAsignado | null
  fichaje: Fichaje | null
  ahora: Date
}) {
  if (!fichaje) {
    if (!turno) return null
    const estado = clasificarSinFichaje(turno, ahora)
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
          estado === 'ausente'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        )}
      >
        <AlertCircle size={14} />
        {estado === 'ausente' ? 'Ausente' : 'Demorado'}
      </span>
    )
  }

  if (!fichaje.salida) {
    const entrada = estadoEntrada(fichaje.entrada.toDate(), turno)
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
          entrada === 'tarde' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Clock3 size={14} />
        {entrada === 'tarde' ? 'Trabajando (llegó tarde)' : 'Trabajando'}
      </span>
    )
  }

  const salida = estadoSalida(fichaje.salida.toDate(), turno)
  const horas = horasTrabajadas(fichaje)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
        salida === 'anticipada' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
      )}
    >
      <CheckCircle2 size={14} />
      Completo{horas !== null ? ` · ${horas.toFixed(1)}h` : ''}
      {salida === 'anticipada' ? ' (salida anticipada)' : salida === 'excedida' ? ' (horas extra)' : ''}
    </span>
  )
}
