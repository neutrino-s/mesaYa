import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

export type EstadoReserva = 'confirmada' | 'cumplida'

/**
 * Subcolección: `restaurantes/{restauranteId}/reservas/{reservaId}`.
 *
 * `pedidoInicialId` referencia el pedido que confirma la reserva — se tipa
 * como `string` suelto hasta modelar la entidad `Pedido`; la reserva no es
 * válida sin ese pedido inicial (se crean juntos, ver `crearReservaConCompra`).
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
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Reserva {
    const data = snapshot.data(options)
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
