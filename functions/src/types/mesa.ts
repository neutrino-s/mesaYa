import type { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore'

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada'
export type FormaMesa = 'cuadrada' | 'rectangular' | 'redonda' | 'banos' | 'barra'

/**
 * Subcolección: `restaurantes/{restauranteId}/salones/{salonId}/mesas/{mesaId}`.
 * Espejo del tipo de cliente en `src/types/mesa.ts` — se duplica porque el
 * SDK admin usa sus propias clases (Timestamp, converter) y este paquete de
 * functions no comparte build con el frontend.
 */
export interface Mesa {
  id: string
  restauranteId: string
  salonId: string
  numero: string
  capacidad: number
  estado: EstadoMesa
  qrToken: string
  /** Mozos que atienden esta mesa ahora mismo — puede haber más de uno.
   * Se escribe únicamente vía `asignarMozoAMesa`/`liberarMesa` (Admin SDK);
   * el cliente nunca lo escribe directo (ver `firestore.rules`). */
  mozoIds: string[]
  forma: FormaMesa
  posicion: { x: number; y: number }
  rotacion: 0 | 90
  grupoId: string | null
  seccion: number | null
  updatedAt: Timestamp
}

export const mesaConverter: FirestoreDataConverter<Mesa> = {
  toFirestore(mesa) {
    return {
      restauranteId: mesa.restauranteId,
      salonId: mesa.salonId,
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      estado: mesa.estado,
      qrToken: mesa.qrToken,
      mozoIds: mesa.mozoIds,
      forma: mesa.forma,
      posicion: mesa.posicion,
      rotacion: mesa.rotacion,
      grupoId: mesa.grupoId,
      seccion: mesa.seccion,
      updatedAt: mesa.updatedAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Mesa {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      salonId: data.salonId,
      numero: data.numero,
      capacidad: data.capacidad,
      estado: data.estado,
      qrToken: data.qrToken,
      mozoIds: data.mozoIds ?? [],
      forma: data.forma,
      posicion: data.posicion,
      rotacion: data.rotacion ?? 0,
      grupoId: data.grupoId ?? null,
      seccion: data.seccion ?? null,
      updatedAt: data.updatedAt,
    }
  },
}
