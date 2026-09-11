import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

/**
 * Subcolección: `restaurantes/{restauranteId}/fichajes/{fichajeId}`.
 *
 * Registro real de entrada/salida de un empleado. El único requisito para
 * fichar es tener sesión iniciada en el sistema (`staffId === request.auth.uid`
 * al crear, ver `firestore.rules`) — no hay PIN, QR ni geolocalización: si el
 * empleado está logueado, ficha desde su propio dispositivo o uno compartido
 * donde inició sesión.
 */
export interface Fichaje {
  id: string
  restauranteId: string
  staffId: string
  /** `YYYY-MM-DD` del día de la entrada (huso horario del dispositivo que
   * fichó) — permite filtrar "los fichajes de hoy" sin rango de timestamps. */
  fecha: string
  /** Turno planificado más cercano al momento de fichar, o `null` si no hay
   * ninguno cerca (fichaje sin cuadrante detrás) — ver
   * `domain/fichajeRules.ts#turnoMasCercano`. Se calcula una sola vez, al
   * fichar la entrada, y no se recalcula después. */
  turnoAsignadoId: string | null
  entrada: Timestamp
  /** `null` mientras la jornada sigue abierta. */
  salida: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const fichajeConverter: FirestoreDataConverter<Fichaje> = {
  toFirestore(fichaje) {
    return {
      restauranteId: fichaje.restauranteId,
      staffId: fichaje.staffId,
      fecha: fichaje.fecha,
      turnoAsignadoId: fichaje.turnoAsignadoId,
      entrada: fichaje.entrada,
      salida: fichaje.salida,
      createdAt: fichaje.createdAt,
      updatedAt: fichaje.updatedAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Fichaje {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      staffId: data.staffId,
      fecha: data.fecha,
      turnoAsignadoId: data.turnoAsignadoId ?? null,
      entrada: data.entrada,
      salida: data.salida ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  },
}
