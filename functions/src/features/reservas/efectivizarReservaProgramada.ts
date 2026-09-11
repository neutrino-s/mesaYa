import { Timestamp } from 'firebase-admin/firestore'
import * as logger from 'firebase-functions/logger'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { db } from '../../lib/admin'
import { mesaRef, reservaRef, reservasConfirmadasVencidasQuery } from '../../lib/firestoreRefs'

/**
 * Corre cada 1 minuto para todos los restaurantes (collectionGroup query,
 * no hay un restauranteId de entrada). Por cada reserva "confirmada" cuya
 * `fechaHora` ya pasó: transiciona la mesa a "ocupada" sin esperar ninguna
 * acción del comensal ni del mozo, y marca la reserva "cumplida".
 */
export const efectivizarReservaProgramada = onSchedule('every 1 minutes', async () => {
  const ahora = Timestamp.now()
  const vencidasSnap = await reservasConfirmadasVencidasQuery(ahora).get()

  if (vencidasSnap.empty) {
    return
  }

  await Promise.all(
    vencidasSnap.docs.map(async (reservaDoc) => {
      const reserva = reservaDoc.data()
      const restauranteId = reservaDoc.ref.parent.parent?.id
      if (!restauranteId) {
        logger.error('Reserva sin restauranteId resoluble desde el path', { reservaId: reserva.id })
        return
      }

      await db.runTransaction(async (transaction) => {
        const mesaSnap = await transaction.get(mesaRef(restauranteId, reserva.salonId, reserva.mesaId))
        if (!mesaSnap.exists) {
          logger.error('La mesa de una reserva vencida ya no existe', {
            restauranteId,
            salonId: reserva.salonId,
            mesaId: reserva.mesaId,
            reservaId: reserva.id,
          })
          return
        }

        transaction.update(mesaRef(restauranteId, reserva.salonId, reserva.mesaId), {
          estado: 'ocupada',
          updatedAt: ahora,
        })
        transaction.update(reservaRef(restauranteId, reserva.id), {
          estado: 'cumplida',
        })
      })
    }),
  )
})
