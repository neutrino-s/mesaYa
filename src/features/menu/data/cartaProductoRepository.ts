import {
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

import { storage } from '@/lib/firebase'
import { cartaProductoRef, cartaProductosRef } from '@/types/firestoreRefs'
import type { CartaProducto } from '@/types/cartaProducto'

import { parsePrecioInput } from '../domain/cartaRules'
import type { CartaProductoFormValues } from '../domain/types'

function productosQuery(restauranteId: string) {
  // Trae todos los productos del restaurante (sin filtrar por sección acá);
  // la UI los agrupa por `seccionId` en memoria — ver
  // `docs/database-schema.md#carta---producto` para el porqué (evita sumar
  // un índice compuesto).
  return query(cartaProductosRef(restauranteId), orderBy('orden'))
}

function imagenRef(restauranteId: string, productoId: string) {
  return storageRef(storage, `restaurantes/${restauranteId}/carta/${productoId}/imagen`)
}

async function uploadImagen(restauranteId: string, productoId: string, file: File): Promise<string> {
  const ref = imagenRef(restauranteId, productoId)
  await uploadBytes(ref, file)
  return getDownloadURL(ref)
}

// Único lugar del feature que importa Firestore/Storage para
// `cartaProductos`. Hooks y componentes solo hablan con este objeto.
export const cartaProductoRepository = {
  /** Se suscribe en tiempo real a todos los productos de la carta del
   * restaurante. Devuelve la función para desuscribirse. */
  subscribeList(restauranteId: string, onData: (productos: CartaProducto[]) => void): () => void {
    return onSnapshot(productosQuery(restauranteId), (snapshot) => {
      onData(snapshot.docs.map((doc) => doc.data()))
    })
  },

  async getList(restauranteId: string): Promise<CartaProducto[]> {
    const snapshot = await getDocs(productosQuery(restauranteId))
    return snapshot.docs.map((doc) => doc.data())
  },

  /** El id del producto se genera acá (en vez de con `addDoc`) para poder
   * nombrar el archivo de Storage con ese mismo id antes de escribir el
   * documento. */
  async create(
    restauranteId: string,
    seccionId: string,
    input: CartaProductoFormValues,
    imagenFile: File | null,
  ): Promise<void> {
    const existentes = await getDocs(
      query(cartaProductosRef(restauranteId), where('seccionId', '==', seccionId)),
    )
    const productoRef = doc(cartaProductosRef(restauranteId))
    const imagenUrl = imagenFile ? await uploadImagen(restauranteId, productoRef.id, imagenFile) : null

    await setDoc(productoRef, {
      // `id` es parte del tipo `CartaProducto` pero el converter no lo
      // escribe: Firestore ya usa el id de `productoRef`.
      id: '',
      restauranteId,
      seccionId,
      nombre: input.nombre,
      descripcion: input.descripcion,
      precio: parsePrecioInput(input.precio),
      imagenUrl,
      orden: existentes.size,
      agotado: false,
      gruposOpciones: input.gruposOpciones,
      permiteComentarios: input.permiteComentarios,
    })
  },

  async update(
    restauranteId: string,
    productoId: string,
    input: CartaProductoFormValues,
    imagenFile: File | null,
    imagenUrlActual: string | null,
  ): Promise<void> {
    const imagenUrl = imagenFile ? await uploadImagen(restauranteId, productoId, imagenFile) : imagenUrlActual

    await updateDoc(cartaProductoRef(restauranteId, productoId), {
      nombre: input.nombre,
      descripcion: input.descripcion,
      precio: parsePrecioInput(input.precio),
      imagenUrl,
      gruposOpciones: input.gruposOpciones,
      permiteComentarios: input.permiteComentarios,
    })
  },

  async setAgotado(restauranteId: string, productoId: string, agotado: boolean): Promise<void> {
    await updateDoc(cartaProductoRef(restauranteId, productoId), { agotado })
  },

  async delete(restauranteId: string, productoId: string): Promise<void> {
    await deleteDoc(cartaProductoRef(restauranteId, productoId))

    try {
      await deleteObject(imagenRef(restauranteId, productoId))
    } catch {
      // El producto puede no haber tenido imagen cargada — no es un error real.
    }
  },
}
