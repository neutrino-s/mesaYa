// Lógica pura de métricas de Jornadas: sin React, sin Firebase. Se prueba sola.

import type { Fichaje } from '@/types/fichaje'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import { horasDeTurno } from './cuadranteRules'
import { horasTrabajadas as horasTrabajadasDeFichaje } from './fichajeRules'

export function horasPlanificadasTotales(turnos: TurnoAsignado[]): number {
  return turnos.reduce((total, turno) => total + horasDeTurno(turno), 0)
}

export function horasTrabajadasTotales(fichajes: Fichaje[]): number {
  return fichajes.reduce((total, fichaje) => total + (horasTrabajadasDeFichaje(fichaje) ?? 0), 0)
}

/** `null` si no hubo nada planificado en el rango (no hay contra qué medir
 * cumplimiento). */
export function cumplimientoPorcentaje(turnos: TurnoAsignado[], fichajes: Fichaje[]): number | null {
  const planificadas = horasPlanificadasTotales(turnos)
  if (planificadas === 0) return null
  return (horasTrabajadasTotales(fichajes) / planificadas) * 100
}

export interface HorasPorEmpleado {
  staffId: string
  horasPlanificadas: number
  horasTrabajadas: number
}

/** Desglose por empleado, para el gráfico de barras planificadas vs.
 * trabajadas del período. */
export function horasPorEmpleado(turnos: TurnoAsignado[], fichajes: Fichaje[]): HorasPorEmpleado[] {
  const staffIds = new Set([...turnos.map((t) => t.staffId), ...fichajes.map((f) => f.staffId)])

  return Array.from(staffIds).map((staffId) => ({
    staffId,
    horasPlanificadas: horasPlanificadasTotales(turnos.filter((t) => t.staffId === staffId)),
    horasTrabajadas: horasTrabajadasTotales(fichajes.filter((f) => f.staffId === staffId)),
  }))
}

/** Turnos del período que ya terminaron (fecha + `horaFin` ya pasó respecto
 * de `ahora`) y no tienen ningún fichaje ese mismo día del mismo empleado —
 * mismo criterio de asociación día-a-día que `filasFichajeDelDia`, pero
 * sobre un rango completo en vez de un solo día. Los turnos que todavía no
 * terminaron no cuentan (no se sabe todavía si van a fichar o no). */
export function turnosAusentesEnRango(turnos: TurnoAsignado[], fichajes: Fichaje[], ahora: Date): TurnoAsignado[] {
  const conFichaje = new Set(fichajes.map((fichaje) => `${fichaje.staffId}__${fichaje.fecha}`))

  return turnos.filter((turno) => {
    if (conFichaje.has(`${turno.staffId}__${turno.fecha}`)) return false
    const fin = new Date(`${turno.fecha}T${turno.horaFin}:00`)
    return fin < ahora
  })
}

/** `null` si no hubo ningún turno ya finalizado en el rango (nada contra qué
 * medir ausentismo todavía). */
export function ausentismoPorcentaje(turnos: TurnoAsignado[], fichajes: Fichaje[], ahora: Date): number | null {
  const finalizados = turnos.filter((turno) => new Date(`${turno.fecha}T${turno.horaFin}:00`) < ahora)
  if (finalizados.length === 0) return null
  return (turnosAusentesEnRango(turnos, fichajes, ahora).length / finalizados.length) * 100
}
