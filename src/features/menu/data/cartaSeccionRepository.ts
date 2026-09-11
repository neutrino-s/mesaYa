import {
  addDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'

import { cartaSeccionRef, cartaSeccionesRef } from '@/types/firestoreRefs'
import type { CartaSeccion } from '@/types/cartaSeccion'

import type { CartaSeccionFormValues } from '../domain/types'

function cartaSeccionQuery(restauranteId: string) {
  return query(cartaSeccionesRef(restauranteId), orderBy('orden'))
}

// Único lugar del feature que importa Firestore para `cartaSecciones`.
// Hooks y componentes solo hablan con este objeto.
export const cartaSeccionRepository = {
  /** Se suscribe en tiempo real a las secciones de la carta. Devuelve la
   * función para desuscribirse. */
  subscribeList(restauranteId: string, onData: (secciones: CartaSeccion[]) => void): () => void {
    return onSnapshot(cartaSeccionQuery(restauranteId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async getList(restauranteId: string): Promise<CartaSeccion[]> {
    const snapshot = await getDocs(cartaSeccionQuery(restauranteId))
    return snapshot.docs.map((doc) => doc.data())
  },

  async create(restauranteId: string, input: CartaSeccionFormValues): Promise<void> {
    const actuales = await getDocs(cartaSeccionesRef(restauranteId))

    await addDoc(cartaSeccionesRef(restauranteId), {
      // `id` es parte del tipo `CartaSeccion` pero `cartaSeccionConverter.toFirestore`
      // no lo escribe: Firestore genera el id real al crear el documento.
      id: '',
      restauranteId,
      nombre: input.nombre,
      orden: actuales.size,
      activo: true,
    })
  },

  async update(restauranteId: string, seccionId: string, input: CartaSeccionFormValues): Promise<void> {
    await updateDoc(cartaSeccionRef(restauranteId, seccionId), {
      nombre: input.nombre,
    })
  },

  async setActivo(restauranteId: string, seccionId: string, activo: boolean): Promise<void> {
    await updateDoc(cartaSeccionRef(restauranteId, seccionId), { activo })
  },
}
