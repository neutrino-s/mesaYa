import type { RolStaff, TurnoStaff } from '@/types/staff'

/** Datos del formulario de alta/edición de un colaborador. `password` solo
 * se completa (y se usa) en el alta: la contraseña provisoria con la que el
 * colaborador va a iniciar sesión por primera vez. */
export interface StaffFormValues {
  nombre: string
  email: string
  telefono: string
  direccion: string
  rol: RolStaff
  turno: TurnoStaff
  password?: string
  /** String en el form (mismo criterio que `capacidad` en `MesaEditDialog`,
   * para no pelear con el tipado de RHF+zod al coercionar números) — vacío
   * significa "sin tope cargado". Se usa para proyectar horas planificadas
   * del cuadrante contra el límite contractual (ver `features/turnos`). */
  horasSemanalesContrato: string
}

/** Filtro rápido de la pantalla de Staff: los dos roles operativos del día
 * a día (mozo, cocina) más el corte por inactivos. */
export type StaffQuickFilter = 'todos' | 'mozos' | 'cocina' | 'inactivos'

/** Métricas del resumen de la pantalla de Staff (tarjetas superiores). */
export interface StaffSummary {
  activos: number
  total: number
  mozos: number
  mozosEnTurno: number
  cocina: number
  cocinaEnTurno: number
  pendientesDeAlta: number
}
