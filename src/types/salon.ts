import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'

/**
 * Subcolección: `restaurantes/{restauranteId}/salones/{salonId}`
 */
export interface Salon {
  id: string
  restauranteId: string
  nombre: string
  descripcion: string
  orden: number
  activo: boolean
}

export const salonConverter: FirestoreDataConverter<Salon> = {
  toFirestore(salon) {
    return {
      restauranteId: salon.restauranteId,
      nombre: salon.nombre,
      descripcion: salon.descripcion,
      orden: salon.orden,
      activo: salon.activo,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Salon {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      nombre: data.nombre,
      descripcion: data.descripcion ?? '',
      orden: data.orden,
      activo: data.activo,
    }
  },
}
