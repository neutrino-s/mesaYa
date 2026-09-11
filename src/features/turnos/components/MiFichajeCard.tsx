import { format } from 'date-fns'
import { Clock, LogIn, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Fichaje } from '@/types/fichaje'
import type { Staff } from '@/types/staff'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { fechaId } from '../domain/cuadranteRules'
import { estadoEntrada, estadoSalida, horasTrabajadas, turnoMasCercano } from '../domain/fichajeRules'
import { useFicharEntrada } from '../hooks/useFicharEntrada'
import { useFicharSalida } from '../hooks/useFicharSalida'

interface MiFichajeCardProps {
  restauranteId: string | null
  miStaff: Staff
  turnosDeHoy: TurnoAsignado[]
  fichajesDeHoy: Fichaje[]
}

const ESTADO_SALIDA_LABEL: Record<string, string> = {
  anticipada: 'Salida anticipada',
  excedida: 'Hizo horas extra',
}

/** Fichaje propio: el único requisito es tener sesión iniciada (no hay PIN,
 * QR ni geolocalización — ver `types/fichaje.ts`). Cualquier rol la ve, cada
 * uno ficha sobre sí mismo. */
export function MiFichajeCard({ restauranteId, miStaff, turnosDeHoy, fichajesDeHoy }: MiFichajeCardProps) {
  const hoy = fechaId(new Date())
  const ficharEntrada = useFicharEntrada(restauranteId, hoy)
  const ficharSalida = useFicharSalida(restauranteId, hoy)

  const misTurnos = turnosDeHoy.filter((turno) => turno.staffId === miStaff.id)
  const misFichajes = fichajesDeHoy
    .filter((fichaje) => fichaje.staffId === miStaff.id)
    .sort((a, b) => a.entrada.toMillis() - b.entrada.toMillis())
  const abierto = misFichajes.find((fichaje) => !fichaje.salida) ?? null

  function turnoDe(fichaje: Fichaje): TurnoAsignado | null {
    return misTurnos.find((turno) => turno.id === fichaje.turnoAsignadoId) ?? null
  }

  function handleFicharEntrada() {
    const turno = turnoMasCercano(misTurnos, new Date())
    ficharEntrada.mutate({ staffId: miStaff.id, turnoAsignadoId: turno?.id ?? null })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-primary" />
        <h2 className="font-heading text-lg text-foreground">Mi fichaje de hoy</h2>
      </div>

      {abierto ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            Entrada fichada a las{' '}
            <span className="font-semibold tabular-nums">{format(abierto.entrada.toDate(), 'HH:mm')}</span>
            {estadoEntrada(abierto.entrada.toDate(), turnoDe(abierto)) === 'tarde' ? (
              <span className="ml-2 text-xs font-medium text-destructive">Llegaste tarde</span>
            ) : null}
          </p>
          <Button onClick={() => ficharSalida.mutate(abierto.id)} disabled={ficharSalida.isPending}>
            <LogOut size={18} />
            Fichar salida
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {misFichajes.length > 0 ? 'Cerraste tu última jornada de hoy.' : 'Todavía no fichaste entrada hoy.'}
          </p>
          <Button onClick={handleFicharEntrada} disabled={ficharEntrada.isPending}>
            <LogIn size={18} />
            Fichar entrada
          </Button>
        </div>
      )}

      {misFichajes.length > 0 ? (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
          {misFichajes.map((fichaje) => {
            const turno = turnoDe(fichaje)
            const eEntrada = estadoEntrada(fichaje.entrada.toDate(), turno)
            const eSalida = fichaje.salida ? estadoSalida(fichaje.salida.toDate(), turno) : null
            const horas = horasTrabajadas(fichaje)

            return (
              <li key={fichaje.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {format(fichaje.entrada.toDate(), 'HH:mm')}
                  {fichaje.salida ? `–${format(fichaje.salida.toDate(), 'HH:mm')}` : ' – en curso'}
                  {horas !== null ? ` · ${horas.toFixed(1)}h` : ''}
                </span>
                <span className="flex gap-2">
                  {eEntrada === 'tarde' ? <span className="text-destructive">Tarde</span> : null}
                  {eSalida && eSalida !== 'a_tiempo' ? (
                    <span className={eSalida === 'anticipada' ? 'text-destructive' : 'text-primary'}>
                      {ESTADO_SALIDA_LABEL[eSalida]}
                    </span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
