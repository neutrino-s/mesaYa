import {
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'

import { salonRef, salonesRef } from '@/types/firestoreRefs'
import type { Salon } from '@/types/salon'

import type { SalonFormValues } from '../domain/types'

function salonQuery(restauranteId: string) {
  return query(salonesRef(restauranteId), orderBy('orden'))
}

// Único lugar del feature que importa Firestore para `salones`. Hooks y
// componentes solo hablan con este objeto.
export const salonRepository = {
  async getList(restauranteId: string): Promise<Salon[]> {
    const snapshot = await getDocs(salonQuery(restauranteId))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Se suscribe en tiempo real a los salones de un restaurante. Devuelve
   * la función para desuscribirse. */
  subscribeList(restauranteId: string, onData: (salones: Salon[]) => void): () => void {
    return onSnapshot(salonQuery(restauranteId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async getById(restauranteId: string, salonId: string): Promise<Salon | null> {
    const snapshot = await getDoc(salonRef(restauranteId, salonId))
    return snapshot.exists() ? snapshot.data() : null
  },

  async create(restauranteId: string, input: SalonFormValues): Promise<void> {
    const actuales = await getDocs(salonesRef(restauranteId))

    await addDoc(salonesRef(restauranteId), {
      // `id` es parte del tipo `Salon` pero `salonConverter.toFirestore` no
      // lo escribe: Firestore genera el id real al crear el documento.
      id: '',
      restauranteId,
      nombre: input.nombre,
      descripcion: input.descripcion,
      orden: actuales.size,
      activo: true,
    })
  },

  async update(restauranteId: string, salonId: string, input: SalonFormValues): Promise<void> {
    await updateDoc(salonRef(restauranteId, salonId), {
      nombre: input.nombre,
      descripcion: input.descripcion,
    })
  },

  async setActivo(restauranteId: string, salonId: string, activo: boolean): Promise<void> {
    await updateDoc(salonRef(restauranteId, salonId), { activo })
  },
}
