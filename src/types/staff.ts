import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

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
 *
 * El id del documento ES el uid de Firebase Auth para todo el staff (no solo
 * el admin): el alta de cualquier colaborador crea su cuenta de Auth en el
 * mismo paso (ver `crearStaff` Cloud Function y `registerRepository.ts`).
 * Para resolver "a qué restaurante pertenezco" sin conocerlo de antemano se
 * usa la colección raíz auxiliar `staffIndex/{uid} -> { restauranteId }`
 * (ver `staffIndexRef` en `types/firestoreRefs.ts`).
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
  /** `true` mientras el usuario no cambió la contraseña provisoria que le
   * asignó el admin al darlo de alta. Mientras sea `true`, la interfaz lo
   * bloquea con un modal de cambio de contraseña obligatorio. */
  debeCambiarPassword: boolean
  /** Tope contractual de horas semanales, para proyectar horas planificadas
   * del cuadrante contra el límite del empleado (ver `features/turnos`).
   * `null` si no se cargó — el cuadrante igual funciona, solo sin esa
   * métrica puntual. Se edita desde "Editar colaborador". */
  horasSemanalesContrato: number | null
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
      horasSemanalesContrato: staff.horasSemanalesContrato,
      createdAt: staff.createdAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Staff {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      direccion: data.direccion ?? '',
      rol: data.rol,
      turno: data.turno ?? 'rotativo',
      estado: data.estado ?? (data.activo === false ? 'inactivo' : 'activo'),
      authUid: data.authUid ?? '',
      debeCambiarPassword: data.debeCambiarPassword ?? false,
      horasSemanalesContrato: data.horasSemanalesContrato ?? null,
      createdAt: data.createdAt,
    }
  },
}
