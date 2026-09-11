import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

/**
 * Subcolección: `restaurantes/{restauranteId}/asignaciones/{asignacionId}`
 */
export interface Asignacion {
  id: string
  restauranteId: string
  mozoId: string
  mesaId: string
  salonId: string
  inicio: Timestamp
  fin: Timestamp | null
  activa: boolean
}

export const asignacionConverter: FirestoreDataConverter<Asignacion> = {
  toFirestore(asignacion) {
    return {
      restauranteId: asignacion.restauranteId,
      mozoId: asignacion.mozoId,
      mesaId: asignacion.mesaId,
      salonId: asignacion.salonId,
      inicio: asignacion.inicio,
      fin: asignacion.fin,
      activa: asignacion.activa,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Asignacion {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      mozoId: data.mozoId,
      mesaId: data.mesaId,
      salonId: data.salonId,
      inicio: data.inicio,
      fin: data.fin,
      activa: data.activa,
    }
  },
}
