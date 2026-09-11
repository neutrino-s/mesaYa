import { Timestamp } from 'firebase-admin/firestore'
import * as logger from 'firebase-functions/logger'
import { db } from '../../lib/admin'
import { mesaRef } from '../../lib/firestoreRefs'
import { puedeIniciarWalkIn } from './domain/mesaRules'
import type { RegistrarPrimeraCompraParams } from './types'

/**
 * No es una Cloud Function propia (no se exporta desde `index.ts`): la
 * invoca directamente, en el mismo proceso, el backend de Pedidos cuando
 * confirma la primera compra sobre una mesa. Se llama por cada compra, pero
 * solo transiciona la mesa la primera vez — de ahí el chequeo de
 * idempotencia contra `estado === 'ocupada'`.
 */
export async function registrarPrimeraCompra(params: RegistrarPrimeraCompraParams): Promise<void> {
  const { restauranteId, salonId, mesaId, pedidoId } = params
  logger.info('registrarPrimeraCompra', { restauranteId, salonId, mesaId, pedidoId })

  await db.runTransaction(async (transaction) => {
    const mesaSnap = await transaction.get(mesaRef(restauranteId, salonId, mesaId))
    if (!mesaSnap.exists) {
      throw new Error(`La mesa ${mesaId} no existe en el restaurante ${restauranteId}.`)
    }
    const mesa = mesaSnap.data()!

    if (mesa.estado === 'ocupada') {
      return
    }
    if (!puedeIniciarWalkIn(mesa.estado)) {
      throw new Error(`No se puede registrar la primera compra: la mesa ${mesaId} está en estado "${mesa.estado}".`)
    }

    transaction.update(mesaRef(restauranteId, salonId, mesaId), {
      estado: 'ocupada',
      updatedAt: Timestamp.now(),
    })
  })
}
