import { doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { db, functions } from '@/lib/firebase'
import { mesaRef, mesasRef, qrCodeRef } from '@/types/firestoreRefs'
import type { Mesa } from '@/types/mesa'

import { generateQrToken } from '../domain/mesaLayoutRules'
import type { MesaLayoutDiff } from '../domain/mesaLayoutRules'

interface AsignarMozoAMesaResponse {
  restauranteId: string
  mesaId: string
  mozoIds: string[]
}

/** Único punto que arma el callable `asignarMozoAMesa` — lo usan tanto
 * `setMozosAsignados` (una mesa) como `asignarMozosASalon` (todas las del
 * salón). El cliente nunca escribe `mozoIds`/`asignaciones` directo, ver
 * `firestore.rules` y el comentario de la Cloud Function. */
function asignarMozoAMesaCallable() {
  if (!functions) throw new Error('Firebase no está configurado.')
  return httpsCallable<
    { restauranteId: string; salonId: string; mesaId: string; mozoIds: string[] },
    AsignarMozoAMesaResponse
  >(functions, 'asignarMozoAMesa')
}

// Único lugar del feature que importa Firestore para `mesas` (y los
// `qrCodes` que se crean/borran junto con ellas).
export const mesaRepository = {
  async getList(restauranteId: string, salonId: string): Promise<Mesa[]> {
    const snapshot = await getDocs(mesasRef(restauranteId, salonId))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** Persiste el diseño completo del lienzo en un solo `writeBatch`: altas,
   * cambios de posición/forma/número/capacidad y bajas, más el `qrCodes`
   * correspondiente a cada mesa creada o borrada. Nunca toca `estado` ni
   * `mozoIds` — son del ciclo operativo, no del diseño del salón. */
  async saveLayout(restauranteId: string, salonId: string, diff: MesaLayoutDiff): Promise<void> {
    const batch = writeBatch(db)

    for (const item of diff.toCreate) {
      const nuevaMesaRef = doc(mesasRef(restauranteId, salonId))

      batch.set(nuevaMesaRef, {
        id: nuevaMesaRef.id,
        restauranteId,
        salonId,
        numero: item.numero,
        capacidad: item.capacidad,
        forma: item.forma,
        posicion: item.posicion,
        rotacion: item.rotacion,
        grupoId: item.grupoId,
        seccion: item.seccion,
        estado: 'libre',
        // El QR se genera a demanda desde "Editar mesa" (`generarQr`), no
        // acá — una mesa nueva siempre nace sin código.
        qrToken: '',
        mozoIds: [],
        updatedAt: serverTimestamp(),
      })
    }

    for (const { mesaId, changes } of diff.toUpdate) {
      batch.update(mesaRef(restauranteId, salonId, mesaId), { ...changes })
    }

    for (const mesa of diff.toDelete) {
      batch.delete(mesaRef(restauranteId, salonId, mesa.id))
      if (mesa.qrToken) {
        batch.delete(qrCodeRef(mesa.qrToken))
      }
    }

    await batch.commit()
  },

  /** Genera el código QR único de la mesa (a demanda, desde "Editar mesa" /
   * "Editar Barra"): un `qrToken` nuevo más su doc de resolución pública en
   * `qrCodes` — ver `docs/database-schema.md#código-qr`. Si `qrTokenAnterior`
   * viene cargado (regenerar por un código extraviado/dañado) borra ese doc
   * viejo en el mismo batch, así nunca queda un `qrCodes` huérfano. Devuelve
   * el token generado. */
  async generarQr(
    restauranteId: string,
    salonId: string,
    mesaId: string,
    qrTokenAnterior: string | null,
  ): Promise<string> {
    const qrToken = generateQrToken()
    const batch = writeBatch(db)

    if (qrTokenAnterior) {
      batch.delete(qrCodeRef(qrTokenAnterior))
    }
    batch.update(mesaRef(restauranteId, salonId, mesaId), { qrToken })
    batch.set(qrCodeRef(qrToken), { qrToken, restauranteId, salonId, mesaId })

    await batch.commit()
    return qrToken
  },

  /** Elimina el código QR de la mesa: borra el `qrCodes/{qrToken}` y deja
   * `qrToken` vacío en la mesa (vuelve al estado "sin QR"). */
  async eliminarQr(restauranteId: string, salonId: string, mesaId: string, qrToken: string): Promise<void> {
    const batch = writeBatch(db)

    batch.update(mesaRef(restauranteId, salonId, mesaId), { qrToken: '' })
    batch.delete(qrCodeRef(qrToken))

    await batch.commit()
  },

  /** Reemplaza la lista completa de mozos asignados a la mesa (puede ser
   * más de uno a la vez). Invoca la Cloud Function `asignarMozoAMesa` — no
   * escribe `mozoIds` directo: esa función mantiene además el historial en
   * `asignaciones` (abre/cierra según corresponda) de forma transaccional. */
  async setMozosAsignados(restauranteId: string, salonId: string, mesaId: string, mozoIds: string[]): Promise<void> {
    await asignarMozoAMesaCallable()({ restauranteId, salonId, mesaId, mozoIds })
  },

  /** Reemplaza `mozoIds` en todas las mesas del salón de una sola vez —
   * mismo resultado final que abrir "Editar mesa" una por una y asignar los
   * mismos mozos, solo que en un único paso. Excluye `forma === 'banos'`
   * (elemento decorativo, no lo atiende ningún mozo). */
  async asignarMozosASalon(restauranteId: string, salonId: string, mozoIds: string[]): Promise<void> {
    const snapshot = await getDocs(mesasRef(restauranteId, salonId))
    const asignables = snapshot.docs.filter((mesaDoc) => mesaDoc.data().forma !== 'banos')
    if (asignables.length === 0) return

    const asignarMozoAMesa = asignarMozoAMesaCallable()
    await Promise.all(
      asignables.map((mesaDoc) =>
        asignarMozoAMesa({ restauranteId, salonId, mesaId: mesaDoc.id, mozoIds }),
      ),
    )
  },
}
