import { addDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'

import { fichajeRef, fichajesRef } from '@/types/firestoreRefs'
import type { Fichaje } from '@/types/fichaje'

function diaQuery(restauranteId: string, fecha: string) {
  return query(fichajesRef(restauranteId), where('fecha', '==', fecha), orderBy('entrada'))
}

// Mismo criterio que `turnoAsignadoRepository.rangoQuery`: comparación
// lexicográfica de `fecha` (`YYYY-MM-DD`) válida en un `where` de rango.
function rangoQuery(restauranteId: string, fechaDesde: string, fechaHasta: string) {
  return query(
    fichajesRef(restauranteId),
    where('fecha', '>=', fechaDesde),
    where('fecha', '<=', fechaHasta),
    orderBy('fecha'),
  )
}

// Único lugar del feature que importa Firestore para `fichajes`.
export const fichajeRepository = {
  async getDia(restauranteId: string, fecha: string): Promise<Fichaje[]> {
    const snapshot = await getDocs(diaQuery(restauranteId, fecha))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Se suscribe en tiempo real a los fichajes de un día. Devuelve la
   * función para desuscribirse. */
  subscribeDia(restauranteId: string, fecha: string, onData: (fichajes: Fichaje[]) => void): () => void {
    return onSnapshot(diaQuery(restauranteId, fecha), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async getRango(restauranteId: string, fechaDesde: string, fechaHasta: string): Promise<Fichaje[]> {
    const snapshot = await getDocs(rangoQuery(restauranteId, fechaDesde, fechaHasta))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Se suscribe en tiempo real a los fichajes de un rango de fechas — lo
   * usa la pestaña de Métricas. Devuelve la función para desuscribirse. */
  subscribeRango(
    restauranteId: string,
    fechaDesde: string,
    fechaHasta: string,
    onData: (fichajes: Fichaje[]) => void,
  ): () => void {
    return onSnapshot(rangoQuery(restauranteId, fechaDesde, fechaHasta), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async ficharEntrada(
    restauranteId: string,
    staffId: string,
    fecha: string,
    turnoAsignadoId: string | null,
  ): Promise<void> {
    await addDoc(fichajesRef(restauranteId), {
      // `id` es parte del tipo `Fichaje` pero el converter no lo escribe:
      // Firestore genera el id real al crear el documento.
      id: '',
      restauranteId,
      staffId,
      fecha,
      turnoAsignadoId,
      entrada: serverTimestamp(),
      salida: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async ficharSalida(restauranteId: string, fichajeId: string): Promise<void> {
    await updateDoc(fichajeRef(restauranteId, fichajeId), {
      salida: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },
}
