import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'

/**
 * Subcolección: `restaurantes/{restauranteId}/cartaSecciones/{seccionId}`
 */
export interface CartaSeccion {
  id: string
  restauranteId: string
  nombre: string
  orden: number
  activo: boolean
}

export const cartaSeccionConverter: FirestoreDataConverter<CartaSeccion> = {
  toFirestore(seccion) {
    return {
      restauranteId: seccion.restauranteId,
      nombre: seccion.nombre,
      orden: seccion.orden,
      activo: seccion.activo,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): CartaSeccion {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      nombre: data.nombre,
      orden: data.orden,
      activo: data.activo,
    }
  },
}
