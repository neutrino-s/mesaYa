import type { RolStaff } from '@/types/staff'
import type { AreaOperativa } from '@/types/turnoAsignado'

import type { HorariosFormSchema } from './horariosSchema'

/** Datos del formulario de horarios/turnos del restaurante. */
export type HorariosFormValues = HorariosFormSchema

/** Vista activa del calendario de cuadrantes. */
export type CuadranteVista = 'dia' | 'semana' | 'mes'

/** Filtros de la pantalla de Cuadrantes — `'todos'`/`'todas'` significa sin
 * filtrar por ese eje. */
export interface CuadranteFiltros {
  rol: RolStaff | 'todos'
  area: AreaOperativa | 'todas'
  staffId: string | 'todos'
}

export const CUADRANTE_FILTROS_VACIO: CuadranteFiltros = {
  rol: 'todos',
  area: 'todas',
  staffId: 'todos',
}

/** Período de la pestaña Métricas — sin vista diaria: un solo día de
 * horas/ausentismo no aporta nada que la comparativa de Fichaje no muestre ya. */
export type MetricasVista = 'semana' | 'mes'
