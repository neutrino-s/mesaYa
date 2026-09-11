import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { restaurantesRef, staffIndexRef, staffRef } from '@/types/firestoreRefs'
import { HORARIOS_VACIO } from '@/types/restaurante'

import type { AppUser, RegisterRestaurantInput } from '../domain/types'
import { authRepository } from './authRepository'

/**
 * Única puerta a la creación de un restaurante nuevo: da de alta la cuenta
 * de Firebase Auth del dueño (vía `authRepository`) y, en el mismo paso, los
 * documentos `restaurantes/{id}`, `restaurantes/{id}/staff/{authUid}` y
 * `staffIndex/{authUid}` que lo enlazan.
 *
 * El id del documento de staff es el propio `authUid`, y `staffIndex`
 * apunta de ese `authUid` al restaurante: así el resto de la app resuelve
 * "¿de qué restaurante es este usuario?" con dos `get()` directos, sin
 * necesidad de una query (ver `docs/database-schema.md#staff`).
 */
export const registerRepository = {
  async registerRestaurant(input: RegisterRestaurantInput): Promise<AppUser> {
    const user = await authRepository.signUp({
      email: input.email,
      password: input.password,
      displayName: input.nombreAdmin,
    })

    try {
      const restauranteRef = doc(restaurantesRef())
      const batch = writeBatch(db)

      batch.set(restauranteRef, {
        id: restauranteRef.id,
        nombre: input.nombreRestaurante,
        tipoNegocio: input.tipoNegocio,
        sucursales: input.sucursales,
        direccion: input.direccion,
        telefono: input.telefono,
        activo: true,
        horarios: HORARIOS_VACIO,
        createdAt: serverTimestamp(),
      })

      batch.set(staffRef(restauranteRef.id, user.uid), {
        id: user.uid,
        restauranteId: restauranteRef.id,
        nombre: input.nombreAdmin,
        email: user.email,
        telefono: input.telefonoContacto,
        direccion: input.direccion,
        rol: 'administrador',
        turno: 'rotativo',
        estado: 'activo',
        authUid: user.uid,
        debeCambiarPassword: false,
        horasSemanalesContrato: null,
        createdAt: serverTimestamp(),
      })

      batch.set(staffIndexRef(user.uid), { restauranteId: restauranteRef.id })

      await batch.commit()
    } catch (err) {
      await authRepository.deleteCurrentUser().catch(() => {})
      throw err
    }

    return user
  },
}
