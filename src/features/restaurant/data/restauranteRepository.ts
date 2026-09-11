import { getDoc, updateDoc } from 'firebase/firestore'

import { restauranteRef } from '@/types/firestoreRefs'
import type { HorariosRestaurante, Restaurante } from '@/types/restaurante'

// Único lugar del feature que importa Firestore. Hooks y componentes solo
// hablan con este objeto.
export const restauranteRepository = {
  async getById(restauranteId: string): Promise<Restaurante | null> {
    const snapshot = await getDoc(restauranteRef(restauranteId))
    return snapshot.exists() ? snapshot.data() : null
  },

  async updateHorarios(restauranteId: string, horarios: HorariosRestaurante): Promise<void> {
    await updateDoc(restauranteRef(restauranteId), { horarios })
  },
}
