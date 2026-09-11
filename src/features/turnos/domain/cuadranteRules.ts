// Lógica pura del cuadrante de turnos: sin React, sin Firebase. Se prueba sola.

import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns'

import type { RolStaff, Staff } from '@/types/staff'
import type { AreaOperativa, EstadoTurnoAsignado, TurnoAsignado } from '@/types/turnoAsignado'

import type { CuadranteFiltros } from './types'

export const AREA_OPTIONS: { value: AreaOperativa; label: string }[] = [
  { value: 'cocina', label: 'Cocina' },
  { value: 'salon', label: 'Salón' },
  { value: 'barra', label: 'Barra' },
  { value: 'recepcion', label: 'Recepción' },
]

export const ESTADO_TURNO_OPTIONS: { value: EstadoTurnoAsignado; label: string }[] = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'confirmado', label: 'Confirmado' },
]

export function areaLabel(area: AreaOperativa): string {
  return AREA_OPTIONS.find((option) => option.value === area)?.label ?? area
}

/** Clases del badge de área: reutiliza los mismos tokens de marca que los
 * avatares de Staff (`staffRules.avatarClasses`), un color por área. */
export function areaBadgeClasses(area: AreaOperativa): string {
  switch (area) {
    case 'cocina':
      return 'bg-brand-pink/40 text-brand-plum'
    case 'salon':
      return 'bg-brand-lavender/30 text-brand-plum'
    case 'barra':
      return 'bg-brand-blush text-brand-plum'
    case 'recepcion':
      return 'bg-brand-crimson/10 text-brand-crimson'
  }
}

export function estadoTurnoBadgeClasses(estado: EstadoTurnoAsignado): string {
  return estado === 'confirmado'
    ? 'bg-primary/10 text-primary'
    : 'bg-muted text-muted-foreground'
}

/** Área operativa por default al elegir un empleado en el formulario —
 * siempre editable, es solo un punto de partida razonable por rol. */
export function areaSugeridaPorRol(rol: RolStaff): AreaOperativa {
  switch (rol) {
    case 'cocinero':
      return 'cocina'
    case 'bartender':
      return 'barra'
    case 'recepcionista':
      return 'recepcion'
    case 'mozo':
    case 'cajero':
    case 'encargado':
    case 'administrador':
      return 'salon'
  }
}

/** Mismo criterio que `canGestionarTurnos` en `firestore.rules`: quién puede
 * armar el cuadrante y ver la tabla de fichajes de todo el equipo. */
export function puedeGestionarTurnos(rol: RolStaff): boolean {
  return rol === 'administrador' || rol === 'encargado'
}

interface RangoHorario {
  fecha: string
  horaInicio: string
  horaFin: string
}

/** Duración en horas de un turno `HH:mm`–`HH:mm` del mismo día (no se
 * admiten turnos que cruzan medianoche, ver `types/turnoAsignado.ts`). */
export function horasDeTurno(turno: Pick<RangoHorario, 'horaInicio' | 'horaFin'>): number {
  const [hIni, mIni] = turno.horaInicio.split(':').map(Number)
  const [hFin, mFin] = turno.horaFin.split(':').map(Number)
  return (hFin * 60 + mFin - (hIni * 60 + mIni)) / 60
}

function seSolapan(a: RangoHorario, b: RangoHorario): boolean {
  return a.fecha === b.fecha && a.horaInicio < b.horaFin && b.horaInicio < a.horaFin
}

/** Turno del mismo empleado, mismo día, cuyo rango horario se cruza con el
 * candidato — conflicto bloqueante (es físicamente imposible cubrir los
 * dos). `turnosDelEmpleado` ya viene filtrado por `staffId` desde afuera. */
export function detectarSolapamiento(
  turnosDelEmpleado: TurnoAsignado[],
  candidato: RangoHorario & { id?: string },
): TurnoAsignado | null {
  return (
    turnosDelEmpleado.find((turno) => turno.id !== candidato.id && seSolapan(turno, candidato)) ??
    null
  )
}

/** Mínimo legal habitual entre el fin de una jornada y el inicio de la
 * siguiente. Fijo por ahora (no configurable por restaurante) — ver
 * pregunta abierta en el análisis de Jornadas. */
export const DESCANSO_MINIMO_HORAS = 12

/** Más allá de esta duración en un mismo turno, se avisa como posible
 * exceso de horas diarias (no bloquea: puede ser una cobertura puntual
 * válida, ej. reemplazo de urgencia). */
export const EXCESO_HORAS_DIARIO_MAX = 9

function toDateTime(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`)
}

/** Turno del mismo empleado en el día inmediatamente anterior o posterior
 * cuyo descanso respecto del candidato queda por debajo del mínimo. Es un
 * aviso, no bloquea el guardado. */
export function detectarDescansoInsuficiente(
  turnosDelEmpleado: TurnoAsignado[],
  candidato: RangoHorario & { id?: string },
): { turno: TurnoAsignado; horasDescanso: number } | null {
  const candidatoInicio = toDateTime(candidato.fecha, candidato.horaInicio)
  const candidatoFin = toDateTime(candidato.fecha, candidato.horaFin)

  for (const turno of turnosDelEmpleado) {
    if (turno.id === candidato.id || turno.fecha === candidato.fecha) continue

    const turnoInicio = toDateTime(turno.fecha, turno.horaInicio)
    const turnoFin = toDateTime(turno.fecha, turno.horaFin)

    const horasDescanso =
      turnoInicio >= candidatoFin
        ? (turnoInicio.getTime() - candidatoFin.getTime()) / 3_600_000
        : (candidatoInicio.getTime() - turnoFin.getTime()) / 3_600_000

    if (horasDescanso >= 0 && horasDescanso < DESCANSO_MINIMO_HORAS) {
      return { turno, horasDescanso }
    }
  }
  return null
}

/** Suma de horas planificadas de un empleado dentro de un rango de fechas
 * (`YYYY-MM-DD` inclusive en ambos extremos) — base de la proyección contra
 * el límite contractual. */
export function horasPlanificadasEnRango(
  turnos: TurnoAsignado[],
  staffId: string,
  fechaDesde: string,
  fechaHasta: string,
): number {
  return turnos
    .filter((turno) => turno.staffId === staffId && turno.fecha >= fechaDesde && turno.fecha <= fechaHasta)
    .reduce((total, turno) => total + horasDeTurno(turno), 0)
}

export type EstadoLimiteContractual = 'sin_limite' | 'ok' | 'cerca' | 'excedido'

/** Compara horas planificadas contra el tope contractual del empleado
 * (`Staff.horasSemanalesContrato`, `null` si no se cargó). */
export function estadoLimiteContractual(
  horasPlanificadas: number,
  horasContrato: number | null,
): EstadoLimiteContractual {
  if (horasContrato === null || horasContrato <= 0) return 'sin_limite'
  const ratio = horasPlanificadas / horasContrato
  if (ratio > 1) return 'excedido'
  if (ratio >= 0.9) return 'cerca'
  return 'ok'
}

// --- Navegación de fechas del cuadrante (semana/mes, lunes como inicio) ---

export function fechaId(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd')
}

export function parseFechaId(fechaId: string): Date {
  return parseISO(fechaId)
}

export function inicioDeSemana(fecha: Date): Date {
  return startOfWeek(fecha, { weekStartsOn: 1 })
}

export function diasDeSemana(fecha: Date): Date[] {
  const inicio = inicioDeSemana(fecha)
  return Array.from({ length: 7 }, (_, index) => addDays(inicio, index))
}

export function semanaSiguiente(fecha: Date): Date {
  return addWeeks(fecha, 1)
}

export function semanaAnterior(fecha: Date): Date {
  return addWeeks(fecha, -1)
}

export function inicioDeMes(fecha: Date): Date {
  return startOfMonth(fecha)
}

export function finDeMes(fecha: Date): Date {
  return endOfMonth(fecha)
}

/** Grilla de mes completa con semanas enteras (incluye días del mes
 * anterior/siguiente que completan la primera/última fila), lunes como
 * inicio de semana — igual criterio que `diasDeSemana`. */
export function diasDeGrillaMensual(fecha: Date): Date[] {
  const inicio = startOfWeek(startOfMonth(fecha), { weekStartsOn: 1 })
  const fin = endOfWeek(endOfMonth(fecha), { weekStartsOn: 1 })
  const dias: Date[] = []
  for (let dia = inicio; dia <= fin; dia = addDays(dia, 1)) {
    dias.push(dia)
  }
  return dias
}

export function mesSiguiente(fecha: Date): Date {
  return addMonths(fecha, 1)
}

export function mesAnterior(fecha: Date): Date {
  return addMonths(fecha, -1)
}

// --- Filtros de la pantalla (rol / área / empleado puntual) ---

export function filtrarTurnos(turnos: TurnoAsignado[], filtros: CuadranteFiltros): TurnoAsignado[] {
  return turnos.filter((turno) => {
    if (filtros.rol !== 'todos' && turno.rol !== filtros.rol) return false
    if (filtros.area !== 'todas' && turno.area !== filtros.area) return false
    if (filtros.staffId !== 'todos' && turno.staffId !== filtros.staffId) return false
    return true
  })
}

/** Filas del cuadrante: personal activo que coincide con el filtro de rol y
 * empleado. El filtro de área no recorta filas (el rol de un empleado no
 * determina un área única de forma estricta) — sí recorta qué turnos se ven
 * dentro de cada fila, vía `filtrarTurnos`. */
export function filtrarStaffParaCuadrante(staff: Staff[], filtros: CuadranteFiltros): Staff[] {
  return staff.filter((member) => {
    if (member.estado !== 'activo') return false
    if (filtros.rol !== 'todos' && member.rol !== filtros.rol) return false
    if (filtros.staffId !== 'todos' && member.id !== filtros.staffId) return false
    return true
  })
}
