import {
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

import { turnoAsignadoRef, turnosAsignadosRef } from '@/types/firestoreRefs'
import type { RolStaff } from '@/types/staff'
import type { EstadoTurnoAsignado, TurnoAsignado } from '@/types/turnoAsignado'

import type { TurnoAsignadoFormSchema } from '../domain/cuadranteSchema'

// Comparación lexicográfica de `fecha` (`YYYY-MM-DD`) válida en un `where`
// de rango — mismo criterio que el resto del proyecto (ver `cuadranteRules.ts`).
function rangoQuery(restauranteId: string, fechaDesde: string, fechaHasta: string) {
  return query(
    turnosAsignadosRef(restauranteId),
    where('fecha', '>=', fechaDesde),
    where('fecha', '<=', fechaHasta),
    orderBy('fecha'),
  )
}

// Único lugar del feature que importa Firestore para `turnosAsignados`.
export const turnoAsignadoRepository = {
  async getRange(restauranteId: string, fechaDesde: string, fechaHasta: string): Promise<TurnoAsignado[]> {
    const snapshot = await getDocs(rangoQuery(restauranteId, fechaDesde, fechaHasta))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Se suscribe en tiempo real a los turnos asignados dentro de un rango de
   * fechas. Devuelve la función para desuscribirse. */
  subscribeRange(
    restauranteId: string,
    fechaDesde: string,
    fechaHasta: string,
    onData: (turnos: TurnoAsignado[]) => void,
  ): () => void {
    return onSnapshot(rangoQuery(restauranteId, fechaDesde, fechaHasta), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async create(restauranteId: string, rol: RolStaff, input: TurnoAsignadoFormSchema): Promise<void> {
    await addDoc(turnosAsignadosRef(restauranteId), {
      // `id` es parte del tipo `TurnoAsignado` pero el converter no lo
      // escribe: Firestore genera el id real al crear el documento.
      id: '',
      restauranteId,
      staffId: input.staffId,
      fecha: input.fecha,
      horaInicio: input.horaInicio,
      horaFin: input.horaFin,
      area: input.area,
      rol,
      estado: 'planificado',
      notas: input.notas,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async update(restauranteId: string, turnoId: string, rol: RolStaff, input: TurnoAsignadoFormSchema): Promise<void> {
    await updateDoc(turnoAsignadoRef(restauranteId, turnoId), {
      staffId: input.staffId,
      fecha: input.fecha,
      horaInicio: input.horaInicio,
      horaFin: input.horaFin,
      area: input.area,
      rol,
      notas: input.notas,
      updatedAt: serverTimestamp(),
    })
  },

  async setEstado(restauranteId: string, turnoId: string, estado: EstadoTurnoAsignado): Promise<void> {
    await updateDoc(turnoAsignadoRef(restauranteId, turnoId), { estado, updatedAt: serverTimestamp() })
  },

  async remove(restauranteId: string, turnoId: string): Promise<void> {
    await deleteDoc(turnoAsignadoRef(restauranteId, turnoId))
  },
}
