import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

export type TipoNotificacion = 'solicitud_creada' | 'solicitud_resuelta'

/**
 * Subcolección: `restaurantes/{restauranteId}/notificaciones/{notificacionId}`.
 *
 * Aviso en la campana del header para un único destinatario — ver
 * `docs/database-schema.md#notificación`. Hoy el único origen es el ciclo
 * de vida de `Solicitud`: se crea una al crear el pedido (para quien
 * gestiona el cuadrante) y otra al resolverlo (para quien lo pidió).
 */
export interface Notificacion {
  id: string
  restauranteId: string
  /** `staffId` de quien la recibe — un doc por destinatario. */
  destinatarioStaffId: string
  tipo: TipoNotificacion
  /** Texto ya armado por quien la crea (`domain/solicitudRules.ts`); esta
   * colección solo lo persiste. */
  mensaje: string
  solicitudId: string
  leida: boolean
  createdAt: Timestamp
}

export const notificacionConverter: FirestoreDataConverter<Notificacion> = {
  toFirestore(notificacion) {
    return {
      restauranteId: notificacion.restauranteId,
      destinatarioStaffId: notificacion.destinatarioStaffId,
      tipo: notificacion.tipo,
      mensaje: notificacion.mensaje,
      solicitudId: notificacion.solicitudId,
      leida: notificacion.leida,
      createdAt: notificacion.createdAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Notificacion {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      destinatarioStaffId: data.destinatarioStaffId,
      tipo: data.tipo,
      mensaje: data.mensaje ?? '',
      solicitudId: data.solicitudId ?? '',
      leida: data.leida ?? false,
      createdAt: data.createdAt,
    }
  },
}
