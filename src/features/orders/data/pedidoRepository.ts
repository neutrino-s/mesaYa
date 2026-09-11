import { getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore'

import { pedidosRef } from '@/types/firestoreRefs'
import type { Pedido } from '@/types/pedido'

import { ESTADOS_VISIBLES_BOARD } from '../domain/pedidoBoardRules'

function pedidosEnVivoQuery(restauranteId: string) {
  return query(
    pedidosRef(restauranteId),
    where('estado', 'in', ESTADOS_VISIBLES_BOARD),
    orderBy('createdAt', 'asc'),
  )
}

// Único lugar del feature que importa Firestore para `pedidos`.
export const pedidoRepository = {
  async getEnVivo(restauranteId: string): Promise<Pedido[]> {
    const snapshot = await getDocs(pedidosEnVivoQuery(restauranteId))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Se suscribe en tiempo real a los pedidos no cancelados del
   * restaurante (el tablero de "Pedidos en vivo"). Devuelve la función
   * para desuscribirse. */
  subscribeEnVivo(restauranteId: string, onData: (pedidos: Pedido[]) => void): () => void {
    return onSnapshot(pedidosEnVivoQuery(restauranteId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },
}
