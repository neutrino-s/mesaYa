import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

/** No incluye "cambio de turno": pedido explícito — el cuadrante solo lo
 * modifica quien lo gestiona, cualquier cambio de turno se conversa en vivo,
 * no queda modelado como solicitud del empleado. */
export type TipoSolicitud = 'dia_libre' | 'vacaciones' | 'licencia'

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

/**
 * Subcolección: `restaurantes/{restauranteId}/solicitudes/{solicitudId}`.
 *
 * Al aprobarse, cancela (borra) los `TurnoAsignado` del empleado dentro de
 * `[fechaDesde, fechaHasta]` — la propia `Solicitud`, con `estado: 'aprobada'`,
 * queda como el registro de que ese día se aplicó una licencia (ver
 * `docs/database-schema.md#solicitud`).
 */
export interface Solicitud {
  id: string
  restauranteId: string
  staffId: string
  tipo: TipoSolicitud
  /** `YYYY-MM-DD`. Igual a `fechaHasta` para `'dia_libre'` (un solo día). */
  fechaDesde: string
  fechaHasta: string
  motivo: string
  estado: EstadoSolicitud
  /** Nota de quien resuelve — típicamente el motivo de un rechazo. `''` si
   * no se cargó. */
  respuestaAdmin: string
  /** `staffId` de quien aprobó/rechazó; `null` mientras está `pendiente`. */
  resueltoPor: string | null
  resueltoEn: Timestamp | null
  /** Ids de los `TurnoAsignado` que la aprobación canceló — trazabilidad de
   * qué tocó exactamente esta solicitud. `[]` si no había ninguno o si
   * todavía no se resolvió. */
  turnosAsignadosIdsCancelados: string[]
  createdAt: Timestamp
}

export const solicitudConverter: FirestoreDataConverter<Solicitud> = {
  toFirestore(solicitud) {
    return {
      restauranteId: solicitud.restauranteId,
      staffId: solicitud.staffId,
      tipo: solicitud.tipo,
      fechaDesde: solicitud.fechaDesde,
      fechaHasta: solicitud.fechaHasta,
      motivo: solicitud.motivo,
      estado: solicitud.estado,
      respuestaAdmin: solicitud.respuestaAdmin,
      resueltoPor: solicitud.resueltoPor,
      resueltoEn: solicitud.resueltoEn,
      turnosAsignadosIdsCancelados: solicitud.turnosAsignadosIdsCancelados,
      createdAt: solicitud.createdAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Solicitud {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      staffId: data.staffId,
      tipo: data.tipo,
      fechaDesde: data.fechaDesde,
      fechaHasta: data.fechaHasta,
      motivo: data.motivo ?? '',
      estado: data.estado ?? 'pendiente',
      respuestaAdmin: data.respuestaAdmin ?? '',
      resueltoPor: data.resueltoPor ?? null,
      resueltoEn: data.resueltoEn ?? null,
      turnosAsignadosIdsCancelados: data.turnosAsignadosIdsCancelados ?? [],
      createdAt: data.createdAt,
    }
  },
}
