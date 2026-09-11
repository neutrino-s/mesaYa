import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

export type TipoNegocio = 'bar' | 'food_truck' | 'restaurante_cafe'

/** Opciones del desplegable "Tipo de negocio" del registro, en orden
 * alfabético por `label` (así se deben mostrar en el `<Select>`). */
export const TIPO_NEGOCIO_OPTIONS: { value: TipoNegocio; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'food_truck', label: 'Food trucks' },
  { value: 'restaurante_cafe', label: 'Restaurante y Café' },
]

export type TurnoNombre = 'manana' | 'tarde' | 'noche'

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

/** Horario de un turno de servicio (Mañana/Tarde/Noche). `horaInicio`/
 * `horaFin` en formato `HH:mm` (24hs, mismo formato que devuelve un
 * `<input type="time">`); solo tienen sentido si `habilitado` es `true`. */
export interface TurnoHorario {
  habilitado: boolean
  horaInicio: string
  horaFin: string
}

/** Horarios del restaurante: apertura/cierre general del comercio, días
 * laborales, y el detalle de cada turno de servicio habilitado. */
export interface HorariosRestaurante {
  aperturaGeneral: string
  cierreGeneral: string
  diasLaborales: DiaSemana[]
  turnos: Record<TurnoNombre, TurnoHorario>
}

const TURNO_VACIO: TurnoHorario = { habilitado: false, horaInicio: '', horaFin: '' }

/** Default para restaurantes que todavía no cargaron sus horarios. */
export const HORARIOS_VACIO: HorariosRestaurante = {
  aperturaGeneral: '',
  cierreGeneral: '',
  diasLaborales: [],
  turnos: { manana: { ...TURNO_VACIO }, tarde: { ...TURNO_VACIO }, noche: { ...TURNO_VACIO } },
}

/**
 * Colección raíz: `restaurantes/{restauranteId}`
 */
export interface Restaurante {
  id: string
  nombre: string
  tipoNegocio: TipoNegocio
  sucursales: number
  direccion: string
  telefono: string
  activo: boolean
  horarios: HorariosRestaurante
  createdAt: Timestamp
}

export const restauranteConverter: FirestoreDataConverter<Restaurante> = {
  toFirestore(restaurante) {
    return {
      nombre: restaurante.nombre,
      tipoNegocio: restaurante.tipoNegocio,
      sucursales: restaurante.sucursales,
      direccion: restaurante.direccion,
      telefono: restaurante.telefono,
      activo: restaurante.activo,
      horarios: restaurante.horarios,
      createdAt: restaurante.createdAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Restaurante {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      nombre: data.nombre,
      tipoNegocio: data.tipoNegocio,
      sucursales: data.sucursales,
      direccion: data.direccion,
      telefono: data.telefono,
      activo: data.activo,
      horarios: data.horarios ?? HORARIOS_VACIO,
      createdAt: data.createdAt,
    }
  },
}
