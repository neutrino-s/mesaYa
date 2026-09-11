import { Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'
import { db } from '../../lib/admin'
import { asignacionActivaDeMesaQuery, asignacionesColRef, mesaRef, staffRef } from '../../lib/firestoreRefs'
import { esMozoAsignable } from './domain/asignacionRules'
import { asignarMozoAMesaRequestSchema } from './types'
import type { AsignarMozoAMesaResponse } from './types'

/**
 * Callable que reemplaza la lista completa de mozos asignados a una mesa
 * (puede haber más de uno a la vez): diffea contra las asignaciones activas
 * actuales en `asignaciones` — cierra las que ya no corresponden, crea las
 * nuevas, deja intactas las que siguen — y actualiza `mesa.mozoIds` de
 * forma atómica. El cliente nunca escribe `asignaciones` ni `mesa.mozoIds`
 * directamente — solo invoca esta función.
 */
export const asignarMozoAMesa = onCall(async (request: CallableRequest<unknown>): Promise<AsignarMozoAMesaResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debés iniciar sesión para asignar un mozo a una mesa.')
  }

  const parsed = asignarMozoAMesaRequestSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'restauranteId, salonId, mesaId y mozoIds son requeridos.')
  }
  const { restauranteId, salonId, mesaId, mozoIds } = parsed.data
  // Ignora duplicados del cliente: cada mozo tiene a lo sumo una asignación
  // activa por mesa.
  const mozoIdsUnicos = [...new Set(mozoIds)]

  const callerSnap = await staffRef(restauranteId, request.auth.uid).get()
  const callerStaff = callerSnap.exists ? callerSnap.data() : undefined
  if (!callerStaff || callerStaff.estado !== 'activo') {
    throw new HttpsError('permission-denied', 'No pertenecés a este restaurante o tu cuenta de staff está inactiva.')
  }

  return db.runTransaction<AsignarMozoAMesaResponse>(async (transaction) => {
    const mesaSnap = await transaction.get(mesaRef(restauranteId, salonId, mesaId))
    if (!mesaSnap.exists) {
      throw new HttpsError('not-found', 'La mesa no existe en el restaurante indicado.')
    }

    // Todas las lecturas (mozos a validar + asignaciones activas actuales)
    // antes de cualquier escritura, como exige una transacción de Firestore.
    const mozoSnaps = await Promise.all(mozoIdsUnicos.map((mozoId) => transaction.get(staffRef(restauranteId, mozoId))))
    mozoSnaps.forEach((mozoSnap, index) => {
      const mozo = mozoSnap.exists ? mozoSnap.data() : undefined
      if (!esMozoAsignable(mozo, restauranteId)) {
        throw new HttpsError(
          'failed-precondition',
          `El mozo "${mozoIdsUnicos[index]}" no existe, no está activo o no pertenece a este restaurante.`,
        )
      }
    })

    const asignacionActivaSnap = await transaction.get(asignacionActivaDeMesaQuery(restauranteId, mesaId))
    const ahora = Timestamp.now()

    const mozoIdsSet = new Set(mozoIdsUnicos)
    const yaAsignados = new Set<string>()

    for (const asignacionDoc of asignacionActivaSnap.docs) {
      const asignacion = asignacionDoc.data()
      if (mozoIdsSet.has(asignacion.mozoId)) {
        // Sigue asignado: no se toca (mantiene su `inicio` original).
        yaAsignados.add(asignacion.mozoId)
      } else {
        // Ya no corresponde: se cierra.
        transaction.update(asignacionDoc.ref, { fin: ahora, activa: false })
      }
    }

    for (const mozoId of mozoIdsUnicos) {
      if (yaAsignados.has(mozoId)) continue
      const nuevaAsignacionRef = asignacionesColRef(restauranteId).doc()
      transaction.set(nuevaAsignacionRef, {
        id: nuevaAsignacionRef.id,
        restauranteId,
        mozoId,
        mesaId,
        salonId,
        inicio: ahora,
        fin: null,
        activa: true,
      })
    }

    transaction.update(mesaRef(restauranteId, salonId, mesaId), {
      mozoIds: mozoIdsUnicos,
      updatedAt: ahora,
    })

    return { restauranteId, mesaId, mozoIds: mozoIdsUnicos }
  })
})
