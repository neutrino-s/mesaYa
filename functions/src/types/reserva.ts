import type { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore'

export type EstadoReserva = 'confirmada' | 'cumplida'

/**
 * Subcolección: `restaurantes/{restauranteId}/reservas/{reservaId}`.
 * Espejo del tipo de cliente en `src/types/reserva.ts` (ver nota en `mesa.ts`).
 */
export interface Reserva {
  id: string
  restauranteId: string
  salonId: string
  mesaId: string
  fechaHora: Timestamp
  duracionEstimadaMin: number
  estado: EstadoReserva
  pedidoInicialId: string
}

export const reservaConverter: FirestoreDataConverter<Reserva> = {
  toFirestore(reserva) {
    return {
      restauranteId: reserva.restauranteId,
      salonId: reserva.salonId,
      mesaId: reserva.mesaId,
      fechaHora: reserva.fechaHora,
      duracionEstimadaMin: reserva.duracionEstimadaMin,
      estado: reserva.estado,
      pedidoInicialId: reserva.pedidoInicialId,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Reserva {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      salonId: data.salonId,
      mesaId: data.mesaId,
      fechaHora: data.fechaHora,
      duracionEstimadaMin: data.duracionEstimadaMin,
      estado: data.estado,
      pedidoInicialId: data.pedidoInicialId,
    }
  },
}
