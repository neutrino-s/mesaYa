import { Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'
import { db } from '../../lib/admin'
import { asignacionActivaDeMesaQuery, mesaRef, staffRef } from '../../lib/firestoreRefs'
import { esStaffAutorizadoParaLiberarMesa, puedeLiberarMesa } from './domain/mesaRules'
import { liberarMesaRequestSchema } from './types'
import type { LiberarMesaResponse } from './types'

/**
 * Callable que invoca el mozo al escanear el QR de una mesa ocupada para
 * liberarla: cierra las asignaciones activas, vacía `mozoIds` y
 * transiciona la mesa a "libre" de forma atómica.
 */
export const liberarMesa = onCall(async (request: CallableRequest<unknown>): Promise<LiberarMesaResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debés iniciar sesión para liberar una mesa.')
  }

  const parsed = liberarMesaRequestSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'restauranteId, salonId, mesaId y staffId son requeridos.')
  }
  const { restauranteId, salonId, mesaId, staffId } = parsed.data

  return db.runTransaction<LiberarMesaResponse>(async (transaction) => {
    const mesaSnap = await transaction.get(mesaRef(restauranteId, salonId, mesaId))
    if (!mesaSnap.exists) {
      throw new HttpsError('not-found', 'La mesa no existe en el restaurante indicado.')
    }
    const mesa = mesaSnap.data()!

    const staffSnap = await transaction.get(staffRef(restauranteId, staffId))
    const staff = staffSnap.exists ? staffSnap.data() : undefined
    if (!esStaffAutorizadoParaLiberarMesa(staff, restauranteId, request.auth!.uid)) {
      throw new HttpsError(
        'permission-denied',
        'No estás autorizado a liberar mesas en este restaurante.',
      )
    }

    if (!puedeLiberarMesa(mesa.estado)) {
      throw new HttpsError('failed-precondition', `La mesa no está ocupada (estado actual: "${mesa.estado}").`)
    }

    const asignacionActivaSnap = await transaction.get(asignacionActivaDeMesaQuery(restauranteId, mesaId))
    const ahora = Timestamp.now()

    for (const asignacionDoc of asignacionActivaSnap.docs) {
      transaction.update(asignacionDoc.ref, { fin: ahora, activa: false })
    }

    transaction.update(mesaRef(restauranteId, salonId, mesaId), {
      estado: 'libre',
      mozoIds: [],
      updatedAt: ahora,
    })

    return { restauranteId, mesaId }
  })
})
