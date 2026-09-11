// Lógica pura de fichaje: sin React, sin Firebase. Se prueba sola.

import type { Fichaje } from '@/types/fichaje'
import type { TurnoAsignado } from '@/types/turnoAsignado'

/** Tolerancia antes de marcar tarde/salida anticipada/excedida — evita que
 * un par de minutos de diferencia (reloj del dispositivo, fila para fichar)
 * disparen una alerta. */
export const TOLERANCIA_MIN = 5

/** Ventana alrededor de `horaInicio` dentro de la cual un fichaje se asocia
 * a un turno planificado — más allá de esto, se ficha "sin turno detrás". */
const VENTANA_MATCH_HORAS = 4

function minutosDesdeMedianoche(horaHHmm: string): number {
  const [horas, minutos] = horaHHmm.split(':').map(Number)
  return horas * 60 + minutos
}

function horaHHmm(fecha: Date): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

/** Turno planificado del mismo empleado más cercano al momento de fichar —
 * dentro de `VENTANA_MATCH_HORAS`; `null` si no hay ninguno cerca. Se llama
 * una sola vez, al fichar la entrada (ver `types/fichaje.ts`). */
export function turnoMasCercano(turnosDelDia: TurnoAsignado[], ahora: Date): TurnoAsignado | null {
  const minutosAhora = minutosDesdeMedianoche(horaHHmm(ahora))
  let mejor: { turno: TurnoAsignado; distancia: number } | null = null

  for (const turno of turnosDelDia) {
    const distancia = Math.abs(minutosDesdeMedianoche(turno.horaInicio) - minutosAhora)
    if (distancia <= VENTANA_MATCH_HORAS * 60 && (!mejor || distancia < mejor.distancia)) {
      mejor = { turno, distancia }
    }
  }
  return mejor?.turno ?? null
}

export type EstadoEntrada = 'a_tiempo' | 'tarde'
export type EstadoSalida = 'a_tiempo' | 'anticipada' | 'excedida'

/** `null` si el fichaje no tiene turno planificado asociado — sin punto de
 * comparación, no hay "a tiempo/tarde" posible. */
export function estadoEntrada(entrada: Date, turno: TurnoAsignado | null): EstadoEntrada | null {
  if (!turno) return null
  const minutosEntrada = minutosDesdeMedianoche(horaHHmm(entrada))
  return minutosEntrada > minutosDesdeMedianoche(turno.horaInicio) + TOLERANCIA_MIN ? 'tarde' : 'a_tiempo'
}

export function estadoSalida(salida: Date, turno: TurnoAsignado | null): EstadoSalida | null {
  if (!turno) return null
  const minutosSalida = minutosDesdeMedianoche(horaHHmm(salida))
  const finTurno = minutosDesdeMedianoche(turno.horaFin)
  if (minutosSalida < finTurno - TOLERANCIA_MIN) return 'anticipada'
  if (minutosSalida > finTurno + TOLERANCIA_MIN) return 'excedida'
  return 'a_tiempo'
}

/** `null` mientras la jornada sigue abierta (sin `salida`). */
export function horasTrabajadas(fichaje: Fichaje): number | null {
  if (!fichaje.salida) return null
  return (fichaje.salida.toMillis() - fichaje.entrada.toMillis()) / 3_600_000
}

export type EstadoTurnoSinFichaje = 'demorado' | 'ausente'

/** Para un turno planificado de hoy sin ningún fichaje todavía: `'ausente'`
 * si el turno ya terminó, `'demorado'` si todavía está en curso (puede
 * llegar a fichar). */
export function clasificarSinFichaje(turno: TurnoAsignado, ahora: Date): EstadoTurnoSinFichaje {
  const minutosAhora = minutosDesdeMedianoche(horaHHmm(ahora))
  return minutosDesdeMedianoche(turno.horaFin) < minutosAhora ? 'ausente' : 'demorado'
}

/** Turnos planificados de hoy que ya empezaron y no tienen ningún fichaje
 * asociado — base de la columna "sin fichar"/"ausente" de la tabla del
 * encargado. */
export function turnosSinFichar(
  turnosDelDia: TurnoAsignado[],
  fichajesDelDia: Fichaje[],
  ahora: Date,
): TurnoAsignado[] {
  const staffIdsConFichaje = new Set(fichajesDelDia.map((fichaje) => fichaje.staffId))
  const minutosAhora = minutosDesdeMedianoche(horaHHmm(ahora))
  return turnosDelDia.filter(
    (turno) => !staffIdsConFichaje.has(turno.staffId) && minutosDesdeMedianoche(turno.horaInicio) <= minutosAhora,
  )
}

export interface FilaFichajeDia {
  staffId: string
  /** Primer turno de hoy de este empleado — alcanza para la tabla del
   * encargado; el caso de más de un turno por día queda para una vuelta
   * futura si hace falta. */
  turno: TurnoAsignado | null
  /** El fichaje asociado al turno de arriba si lo hay, o el primer fichaje
   * del empleado sin turno asociado — mismo criterio de simplificación. */
  fichaje: Fichaje | null
}

/** Una fila por cada empleado que tiene turno y/o fichaje hoy — para la
 * tabla "Equipo hoy" del encargado (ver `FichajesHoyTabla`). */
export function filasFichajeDelDia(turnosDelDia: TurnoAsignado[], fichajesDelDia: Fichaje[]): FilaFichajeDia[] {
  const staffIds = new Set([...turnosDelDia.map((t) => t.staffId), ...fichajesDelDia.map((f) => f.staffId)])

  return Array.from(staffIds).map((staffId) => {
    const turno = turnosDelDia.find((t) => t.staffId === staffId) ?? null
    const fichaje =
      fichajesDelDia.find((f) => f.staffId === staffId && f.turnoAsignadoId === turno?.id) ??
      fichajesDelDia.find((f) => f.staffId === staffId) ??
      null
    return { staffId, turno, fichaje }
  })
}
