import { addDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { notificacionesRef, notificacionRef, staffColRef } from '@/types/firestoreRefs'
import type { Notificacion, TipoNotificacion } from '@/types/notificacion'

function miasQuery(restauranteId: string, staffId: string) {
  return query(
    notificacionesRef(restauranteId),
    where('destinatarioStaffId', '==', staffId),
    orderBy('createdAt', 'desc'),
    limit(30),
  )
}

function nuevaNotificacion(restauranteId: string, destinatarioStaffId: string, tipo: TipoNotificacion, solicitudId: string, mensaje: string) {
  return {
    // `id` es parte del tipo `Notificacion` pero el converter no lo escribe.
    id: '',
    restauranteId,
    destinatarioStaffId,
    tipo,
    mensaje,
    solicitudId,
    leida: false,
    createdAt: serverTimestamp(),
  }
}

// Único lugar del feature que importa Firestore para `notificaciones`.
export const notificacionRepository = {
  async getMias(restauranteId: string, staffId: string): Promise<Notificacion[]> {
    const snapshot = await getDocs(miasQuery(restauranteId, staffId))
    return snapshot.docs.map((docSnapshot) => docSnapshot.data())
  },

  subscribeMias(restauranteId: string, staffId: string, onData: (notificaciones: Notificacion[]) => void): () => void {
    return onSnapshot(miasQuery(restauranteId, staffId), (snapshot) => {
      onData(snapshot.docs.map((docSnapshot) => docSnapshot.data()))
    })
  },

  async marcarLeida(restauranteId: string, notificacionId: string): Promise<void> {
    await updateDoc(notificacionRef(restauranteId, notificacionId), { leida: true })
  },

  async marcarTodasLeidas(restauranteId: string, notificaciones: Notificacion[]): Promise<void> {
    const pendientes = notificaciones.filter((notificacion) => !notificacion.leida)
    if (pendientes.length === 0) return

    const batch = writeBatch(db)
    for (const notificacion of pendientes) {
      batch.update(notificacionRef(restauranteId, notificacion.id), { leida: true })
    }
    await batch.commit()
  },

  /** Notifica a todo el staff activo que gestiona el cuadrante
   * (`administrador`/`encargado`, mismo criterio que `canGestionarTurnos`
   * en `firestore.rules`) de que se creó una `Solicitud` nueva. */
  async crearPorSolicitudCreada(restauranteId: string, solicitudId: string, mensaje: string): Promise<void> {
    const destinatarios = await getDocs(
      query(
        staffColRef(restauranteId),
        where('rol', 'in', ['administrador', 'encargado']),
        where('estado', '==', 'activo'),
      ),
    )
    if (destinatarios.empty) return

    const batch = writeBatch(db)
    for (const staffDoc of destinatarios.docs) {
      const ref = doc(notificacionesRef(restauranteId))
      batch.set(ref, nuevaNotificacion(restauranteId, staffDoc.id, 'solicitud_creada', solicitudId, mensaje))
    }
    await batch.commit()
  },

  /** Notifica a quien pidió la `Solicitud` que ya fue resuelta (aprobada o
   * rechazada). */
  async crearPorSolicitudResuelta(restauranteId: string, staffId: string, solicitudId: string, mensaje: string): Promise<void> {
    await addDoc(notificacionesRef(restauranteId), nuevaNotificacion(restauranteId, staffId, 'solicitud_resuelta', solicitudId, mensaje))
  },
}
