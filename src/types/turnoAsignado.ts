import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

import type { RolStaff } from './staff'

/** Agrupador operativo del turno — no es una entidad propia (no tiene
 * ciclo de vida ni CRUD): un enum fijo, mismo criterio que `RolStaff`. */
export type AreaOperativa = 'cocina' | 'salon' | 'barra' | 'recepcion'

/** `planificado`: recién cargado. `confirmado`: el encargado ya publicó el
 * cuadrante de esa semana — no cambia ningún otro comportamiento todavía,
 * es una marca visual para distinguir borrador de cuadrante definitivo. */
export type EstadoTurnoAsignado = 'planificado' | 'confirmado'

/**
 * Subcolección: `restaurantes/{restauranteId}/turnosAsignados/{turnoId}`.
 *
 * Instancia real de un turno para un empleado en una fecha puntual — no
 * confundir con `Staff.turno` (mañana/tarde/noche/rotativo), que es la
 * etiqueta preferente del empleado sin fecha asociada, usada como default al
 * cargar un turno nuevo. Ver `docs/database-schema.md#turnoasignado`.
 */
export interface TurnoAsignado {
  id: string
  restauranteId: string
  staffId: string
  /** `YYYY-MM-DD` — string, no timestamp: evita corrimientos de timezone al
   * filtrar por día y permite comparación lexicográfica en rangos (mismo
   * criterio que `Pedido.mesaNumero`/`HorariosRestaurante`). */
  fecha: string
  /** `HH:mm`, 24hs. `horaInicio` siempre antes que `horaFin` — no se admiten
   * turnos que cruzan medianoche (misma limitación que `HorariosRestaurante`). */
  horaInicio: string
  horaFin: string
  area: AreaOperativa
  /** Denormalizado de `staff.rol` al momento de crear el turno, para
   * filtrar/mostrar sin join. */
  rol: RolStaff
  estado: EstadoTurnoAsignado
  notas: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const turnoAsignadoConverter: FirestoreDataConverter<TurnoAsignado> = {
  toFirestore(turno) {
    return {
      restauranteId: turno.restauranteId,
      staffId: turno.staffId,
      fecha: turno.fecha,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      area: turno.area,
      rol: turno.rol,
      estado: turno.estado,
      notas: turno.notas,
      createdAt: turno.createdAt,
      updatedAt: turno.updatedAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): TurnoAsignado {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      staffId: data.staffId,
      fecha: data.fecha,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      area: data.area,
      rol: data.rol,
      estado: data.estado ?? 'planificado',
      notas: data.notas ?? '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  },
}
