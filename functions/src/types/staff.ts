import type { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore'

export type RolStaff =
  | 'administrador'
  | 'mozo'
  | 'cocinero'
  | 'bartender'
  | 'recepcionista'
  | 'cajero'
  | 'encargado'
export type TurnoStaff = 'mañana' | 'tarde' | 'noche' | 'rotativo'
export type EstadoStaff = 'activo' | 'inactivo'

/**
 * Subcolección de restaurante: `restaurantes/{restauranteId}/staff/{staffId}`.
 * Espejo del tipo de cliente en `src/types/staff.ts` (ver nota en `mesa.ts`).
 */
export interface Staff {
  id: string
  restauranteId: string
  nombre: string
  email: string
  telefono: string
  direccion: string
  rol: RolStaff
  turno: TurnoStaff
  estado: EstadoStaff
  authUid: string
  debeCambiarPassword: boolean
  createdAt: Timestamp
}

export const staffConverter: FirestoreDataConverter<Staff> = {
  toFirestore(staff) {
    return {
      restauranteId: staff.restauranteId,
      nombre: staff.nombre,
      email: staff.email,
      telefono: staff.telefono,
      direccion: staff.direccion,
      rol: staff.rol,
      turno: staff.turno,
      estado: staff.estado,
      authUid: staff.authUid,
      debeCambiarPassword: staff.debeCambiarPassword,
      createdAt: staff.createdAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Staff {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion,
      rol: data.rol,
      turno: data.turno,
      estado: data.estado,
      authUid: data.authUid,
      debeCambiarPassword: data.debeCambiarPassword ?? false,
      createdAt: data.createdAt,
    }
  },
}
