// Lógica pura del feature de staff: sin React, sin Firebase. Se prueba sola.

import type { EstadoStaff, RolStaff, Staff, TurnoStaff } from '@/types/staff'

import type { StaffQuickFilter, StaffSummary } from './types'

// Orden alfabético por label (así aparecen en el <Select> del formulario).
export const ROL_OPTIONS: { value: RolStaff; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'cocinero', label: 'Cocinero' },
  { value: 'encargado', label: 'Encargado' },
  { value: 'mozo', label: 'Mozo' },
  { value: 'recepcionista', label: 'Recepcionista' },
]

export const TURNO_OPTIONS: { value: TurnoStaff; label: string }[] = [
  { value: 'mañana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
  { value: 'rotativo', label: 'Rotativo' },
]

export const ESTADO_OPTIONS: { value: EstadoStaff; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
]

/** Clases del círculo de avatar: un color crudo de la paleta de marca (ver
 * `--brand-*` en index.css) por rol, para reconocerlo de un vistazo tanto
 * en la tabla como en el header del diálogo. Los cinco colores de marca ya
 * están repartidos entre los primeros cinco roles; los que se suman después
 * reutilizan esos mismos tokens en su variante suave (`/10`) en vez de
 * inventar un color nuevo fuera de la paleta. */
export function avatarClasses(rol: RolStaff): string {
  switch (rol) {
    case 'administrador':
      return 'bg-brand-plum text-white'
    case 'mozo':
      return 'bg-brand-lavender text-white'
    case 'cocinero':
      return 'bg-brand-pink text-brand-plum'
    case 'bartender':
      return 'bg-brand-blush text-brand-plum'
    case 'recepcionista':
      return 'bg-brand-crimson text-white'
    case 'cajero':
      return 'bg-brand-plum/10 text-brand-plum'
    case 'encargado':
      return 'bg-brand-crimson/10 text-brand-crimson'
  }
}

export function rolLabel(rol: RolStaff): string {
  return ROL_OPTIONS.find((option) => option.value === rol)?.label ?? rol
}

export function turnoLabel(turno: TurnoStaff): string {
  return TURNO_OPTIONS.find((option) => option.value === turno)?.label ?? turno
}

/** Clases del tag de estado: reutiliza los tokens de marca en vez de sumar
 * verde/rojo nuevos — `primary` ya es el color de "activo/seleccionado" en
 * el resto de la app (ver nav inferior). */
export function estadoBadgeClasses(estado: EstadoStaff): string {
  return estado === 'activo'
    ? 'bg-primary/10 text-primary'
    : 'bg-muted text-muted-foreground'
}

export function estadoLabel(estado: EstadoStaff): string {
  return estado === 'activo' ? 'Activo' : 'Inactivo'
}

/** Iniciales para el avatar, dos letras como máximo. */
export function initialsFromNombre(nombre: string): string {
  const words = nombre.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

/** Aplica el filtro rápido (pills) de la pantalla de Staff sobre una lista
 * ya cargada. */
export function filterStaffByQuick(staff: Staff[], filter: StaffQuickFilter): Staff[] {
  switch (filter) {
    case 'mozos':
      return staff.filter((member) => member.rol === 'mozo')
    case 'cocina':
      return staff.filter((member) => member.rol === 'cocinero')
    case 'inactivos':
      return staff.filter((member) => member.estado === 'inactivo')
    case 'todos':
      return staff
  }
}

/** Métricas de las tarjetas de resumen: activos sobre el total, cuántos
 * mozos/cocina hay y cuántos de ellos están en turno (activos), y cuántos
 * colaboradores todavía no cambiaron la contraseña provisoria que se les
 * asignó al darlos de alta. */
export function staffSummary(staff: Staff[]): StaffSummary {
  const mozos = staff.filter((member) => member.rol === 'mozo')
  const cocina = staff.filter((member) => member.rol === 'cocinero')

  return {
    activos: staff.filter((member) => member.estado === 'activo').length,
    total: staff.length,
    mozos: mozos.length,
    mozosEnTurno: mozos.filter((member) => member.estado === 'activo').length,
    cocina: cocina.length,
    cocinaEnTurno: cocina.filter((member) => member.estado === 'activo').length,
    pendientesDeAlta: staff.filter((member) => member.debeCambiarPassword).length,
  }
}
