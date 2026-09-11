import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'

/**
 * Colección raíz: `qrCodes/{qrToken}` — el id del documento es el propio `qrToken`.
 */
export interface QrCode {
  qrToken: string
  restauranteId: string
  salonId: string
  mesaId: string
}

export const qrCodeConverter: FirestoreDataConverter<QrCode> = {
  toFirestore(qrCode) {
    return {
      restauranteId: qrCode.restauranteId,
      salonId: qrCode.salonId,
      mesaId: qrCode.mesaId,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): QrCode {
    const data = snapshot.data(options)
    return {
      qrToken: snapshot.id,
      restauranteId: data.restauranteId,
      salonId: data.salonId,
      mesaId: data.mesaId,
    }
  },
}
