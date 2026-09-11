import {
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { functions } from '@/lib/firebase'
import { staffColRef, staffIndexRef, staffRef } from '@/types/firestoreRefs'
import type { EstadoStaff, Staff } from '@/types/staff'

import type { StaffFormValues } from '../domain/types'

interface CrearStaffResponse {
  staffId: string
}

function staffQuery(restauranteId: string) {
  return query(staffColRef(restauranteId), orderBy('nombre'))
}

// Único lugar del feature que importa Firestore. Hooks y componentes solo
// hablan con este objeto.
export const staffRepository = {
  async getList(restauranteId: string): Promise<Staff[]> {
    const snapshot = await getDocs(staffQuery(restauranteId))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Se suscribe en tiempo real al staff de un restaurante. Devuelve la
   * función para desuscribirse. */
  subscribeList(
    restauranteId: string,
    onData: (staff: Staff[]) => void,
  ): () => void {
    return onSnapshot(staffQuery(restauranteId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  /** `staff` está anidado bajo `restaurantes`, así que no se puede resolver
   * "quién soy" con un solo `get()` sin conocer el restaurante de
   * antemano: primero se resuelve el restaurante vía `staffIndex/{uid}`
   * (ver `docs/database-schema.md#staff`), y recién ahí se lee el doc de
   * staff propiamente dicho. */
  async getMyStaff(authUid: string): Promise<Staff | null> {
    const indexSnapshot = await getDoc(staffIndexRef(authUid))
    if (!indexSnapshot.exists()) return null

    const { restauranteId } = indexSnapshot.data()
    const snapshot = await getDoc(staffRef(restauranteId, authUid))
    return snapshot.exists() ? snapshot.data() : null
  },

  /** Crea el colaborador invocando la Cloud Function `crearStaff`: da de
   * alta su cuenta de Firebase Auth (con la contraseña provisoria) y el doc
   * de staff en un mismo paso server-side — el cliente nunca escribe este
   * doc directo. */
  async create(restauranteId: string, input: StaffFormValues): Promise<void> {
    if (!functions) throw new Error('Firebase no está configurado.')

    const crearStaff = httpsCallable<
      {
        restauranteId: string
        nombre: string
        email: string
        telefono: string
        direccion: string
        rol: StaffFormValues['rol']
        turno: StaffFormValues['turno']
        password: string
      },
      CrearStaffResponse
    >(functions, 'crearStaff')

    await crearStaff({
      restauranteId,
      nombre: input.nombre,
      email: input.email,
      telefono: input.telefono,
      direccion: input.direccion,
      rol: input.rol,
      turno: input.turno,
      password: input.password ?? '',
    })
  },

  async update(restauranteId: string, staffId: string, input: StaffFormValues): Promise<void> {
    await updateDoc(staffRef(restauranteId, staffId), {
      nombre: input.nombre,
      email: input.email,
      telefono: input.telefono,
      direccion: input.direccion,
      rol: input.rol,
      turno: input.turno,
      horasSemanalesContrato:
        input.horasSemanalesContrato.trim() === '' ? null : Number(input.horasSemanalesContrato),
    })
  },

  async setEstado(restauranteId: string, staffId: string, estado: EstadoStaff): Promise<void> {
    await updateDoc(staffRef(restauranteId, staffId), { estado })
  },

  /** Único cambio que el propio staff puede hacer sobre su doc (ver
   * `firestore.rules`): apagar el flag de contraseña provisoria tras
   * cambiarla en su primer login. */
  async markPasswordChanged(restauranteId: string, staffId: string): Promise<void> {
    await updateDoc(staffRef(restauranteId, staffId), { debeCambiarPassword: false })
  },
}
