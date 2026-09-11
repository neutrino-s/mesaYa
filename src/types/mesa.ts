import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada'
export type FormaMesa = 'cuadrada' | 'rectangular' | 'redonda' | 'banos' | 'barra'

/**
 * Subcolección: `restaurantes/{restauranteId}/salones/{salonId}/mesas/{mesaId}`
 */
export interface Mesa {
  id: string
  restauranteId: string
  salonId: string
  numero: string
  capacidad: number
  estado: EstadoMesa
  qrToken: string
  /** Mozos que atienden esta mesa ahora mismo — una mesa puede tener más de
   * uno asignado a la vez (ej. turnos superpuestos, cobertura compartida). */
  mozoIds: string[]
  forma: FormaMesa
  /** Posición libre en píxeles dentro del lienzo del salón (sin grilla/snap). */
  posicion: { x: number; y: number }
  /** Solo relevante si `forma === 'barra'` (0 = horizontal, 90 = vertical);
   * el resto de las formas siempre `0`. */
  rotacion: 0 | 90
  /** Agrupa las secciones de una misma Barra (cada sección es un doc `Mesa`
   * completo, con su propio `qrToken`); `null` para elementos sueltos. */
  grupoId: string | null
  /** Índice 1-based dentro de `grupoId`; `null` si `grupoId` es `null`. */
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
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Mesa {
    const data = snapshot.data(options)
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
