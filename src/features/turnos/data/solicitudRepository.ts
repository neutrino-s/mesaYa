import { addDoc, deleteDoc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'

import { notificacionRepository } from '@/features/notificaciones/data/notificacionRepository'
import { db } from '@/lib/firebase'
import { solicitudRef, solicitudesRef, staffRef, turnoAsignadoRef } from '@/types/firestoreRefs'
import type { EstadoSolicitud, Solicitud } from '@/types/solicitud'

import { mensajeSolicitudCreada, mensajeSolicitudResuelta, turnosAfectados } from '../domain/solicitudRules'
import type { SolicitudFormSchema } from '../domain/solicitudSchema'
import { turnoAsignadoRepository } from './turnoAsignadoRepository'

/** La notificación es un efecto secundario del pedido de negocio real (crear
 * / aprobar / rechazar la solicitud): si falla, no tiene que tirar abajo esa
 * operación principal ni mostrarle al usuario un error sobre algo que en
 * realidad sí se guardó. */
async function notificarSinRomper(accion: () => Promise<void>): Promise<void> {
  try {
    await accion()
  } catch (error) {
    console.error('No se pudo crear la notificación de la solicitud.', error)
  }
}

function miasQuery(restauranteId: string, staffId: string) {
  return query(solicitudesRef(restauranteId), where('staffId', '==', staffId))
}

function pendientesQuery(restauranteId: string) {
  return query(solicitudesRef(restauranteId), where('estado', '==', 'pendiente'))
}

// Único lugar del feature que importa Firestore para `solicitudes`.
export const solicitudRepository = {
  async getMias(restauranteId: string, staffId: string): Promise<Solicitud[]> {
    const snapshot = await getDocs(miasQuery(restauranteId, staffId))
    return snapshot.docs.map((doc) => doc.data())
  },

  subscribeMias(restauranteId: string, staffId: string, onData: (solicitudes: Solicitud[]) => void): () => void {
    return onSnapshot(miasQuery(restauranteId, staffId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async getPendientes(restauranteId: string): Promise<Solicitud[]> {
    const snapshot = await getDocs(pendientesQuery(restauranteId))
    return snapshot.docs.map((doc) => doc.data())
  },

  subscribePendientes(restauranteId: string, onData: (solicitudes: Solicitud[]) => void): () => void {
    return onSnapshot(pendientesQuery(restauranteId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async crear(restauranteId: string, staffId: string, input: SolicitudFormSchema): Promise<void> {
    const nuevaSolicitud = await addDoc(solicitudesRef(restauranteId), {
      // `id` es parte del tipo `Solicitud` pero el converter no lo escribe:
      // Firestore genera el id real al crear el documento.
      id: '',
      restauranteId,
      staffId,
      tipo: input.tipo,
      fechaDesde: input.fechaDesde,
      fechaHasta: input.fechaHasta,
      motivo: input.motivo,
      estado: 'pendiente',
      respuestaAdmin: '',
      resueltoPor: null,
      resueltoEn: null,
      turnosAsignadosIdsCancelados: [],
      createdAt: serverTimestamp(),
    })

    await notificarSinRomper(async () => {
      const staffSnapshot = await getDoc(staffRef(restauranteId, staffId))
      const nombreSolicitante = staffSnapshot.exists() ? staffSnapshot.data().nombre : 'Un colaborador'
      await notificacionRepository.crearPorSolicitudCreada(
        restauranteId,
        nuevaSolicitud.id,
        mensajeSolicitudCreada(nombreSolicitante, input.tipo),
      )
    })
  },

  /** Retira un pedido propio todavía pendiente (`firestore.rules` exige
   * `staffId === request.auth.uid` y `estado === 'pendiente'`). */
  async cancelar(restauranteId: string, solicitudId: string): Promise<void> {
    await deleteDoc(solicitudRef(restauranteId, solicitudId))
  },

  /** Aprueba y, en el mismo `writeBatch`, cancela (borra) los `TurnoAsignado`
   * del empleado dentro de `[fechaDesde, fechaHasta]` — "mata" el cuadrante
   * de esos días. Relee los turnos del rango en el momento de aprobar (no
   * confía en lo que tenga cacheado la pantalla) para no cancelar turnos
   * desactualizados. */
  async aprobar(restauranteId: string, solicitud: Solicitud, resueltoPor: string): Promise<void> {
    const turnosDelRango = await turnoAsignadoRepository.getRange(restauranteId, solicitud.fechaDesde, solicitud.fechaHasta)
    const afectados = turnosAfectados(turnosDelRango, solicitud)

    const batch = writeBatch(db)
    batch.update(solicitudRef(restauranteId, solicitud.id), {
      estado: 'aprobada',
      resueltoPor,
      resueltoEn: serverTimestamp(),
      turnosAsignadosIdsCancelados: afectados.map((turno) => turno.id),
    })
    for (const turno of afectados) {
      batch.delete(turnoAsignadoRef(restauranteId, turno.id))
    }
    await batch.commit()

    await notificarResolucion(restauranteId, solicitud, 'aprobada')
  },

  async rechazar(restauranteId: string, solicitud: Solicitud, resueltoPor: string, respuestaAdmin: string): Promise<void> {
    await updateDoc(solicitudRef(restauranteId, solicitud.id), {
      estado: 'rechazada',
      resueltoPor,
      resueltoEn: serverTimestamp(),
      respuestaAdmin,
      turnosAsignadosIdsCancelados: [],
    })

    await notificarResolucion(restauranteId, solicitud, 'rechazada')
  },
}

async function notificarResolucion(
  restauranteId: string,
  solicitud: Solicitud,
  estado: Exclude<EstadoSolicitud, 'pendiente'>,
): Promise<void> {
  await notificarSinRomper(() =>
    notificacionRepository.crearPorSolicitudResuelta(
      restauranteId,
      solicitud.staffId,
      solicitud.id,
      mensajeSolicitudResuelta(solicitud.tipo, estado),
    ),
  )
}
