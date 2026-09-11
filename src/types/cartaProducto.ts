import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'

/**
 * Grupo de opciones configurables de un plato (ej. "Salsa", "Guarnición").
 * Anidado dentro de `CartaProducto.gruposOpciones` — no es su propia
 * colección de Firestore, ver `docs/database-schema.md#carta---producto`.
 */
export interface CartaProductoGrupoOpciones {
  id: string
  /** Ej. "Salsa", "Guarnición". */
  nombre: string
  /** Si es `true`, el comensal debe elegir al menos una opción del grupo. */
  obligatorio: boolean
  /** Si es `true`, puede elegir más de una opción del grupo (ej. adicionales); si es `false`, es a elección única (ej. una sola salsa). */
  seleccionMultiple: boolean
  opciones: CartaProductoOpcion[]
}

/**
 * Una opción dentro de un `CartaProductoGrupoOpciones` (ej. "Bolognesa",
 * "Ensalada"). Puede tener sus propios subgrupos anidados (ej. "Ensalada"
 * ofreciendo a su vez un grupo de aderezos).
 */
export interface CartaProductoOpcion {
  id: string
  nombre: string
  /** Se suma al precio base del plato al elegirla; `0` si no tiene costo extra. */
  precioAdicional: number
  subgrupos: CartaProductoGrupoOpciones[]
}

/**
 * Colección plana (no anidada bajo la sección): `restaurantes/{restauranteId}/cartaProductos/{productoId}`.
 * Ver `docs/database-schema.md#carta---producto` para el porqué.
 */
export interface CartaProducto {
  id: string
  restauranteId: string
  seccionId: string
  /** Todos los campos de contenido son opcionales: se puede cargar un
   * producto parcial y completarlo después. */
  nombre: string
  descripcion: string
  precio: number | null
  imagenUrl: string | null
  orden: number
  /** Marcado a demanda desde la tarjeta del plato ("Marcar agotado") — no
   * se borra el plato, solo se oculta como disponible. */
  agotado: boolean
  /** Grupos de opciones configurables del plato (salsas, guarniciones,
   * adicionales, etc.); `[]` si el plato no tiene ninguno. */
  gruposOpciones: CartaProductoGrupoOpciones[]
  /** Si es `true`, el comensal puede dejar un comentario libre al pedir
   * este plato (ej. "sin sal"). `false` por defecto — no todos los platos
   * necesitan esta opción. */
  permiteComentarios: boolean
}

export const cartaProductoConverter: FirestoreDataConverter<CartaProducto> = {
  toFirestore(producto) {
    return {
      restauranteId: producto.restauranteId,
      seccionId: producto.seccionId,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagenUrl: producto.imagenUrl,
      orden: producto.orden,
      agotado: producto.agotado,
      gruposOpciones: producto.gruposOpciones,
      permiteComentarios: producto.permiteComentarios,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): CartaProducto {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      seccionId: data.seccionId,
      nombre: data.nombre ?? '',
      descripcion: data.descripcion ?? '',
      precio: data.precio ?? null,
      imagenUrl: data.imagenUrl ?? null,
      orden: data.orden,
      agotado: data.agotado ?? false,
      // `?? []`/`?? false` para platos creados antes de sumar esta funcionalidad.
      gruposOpciones: data.gruposOpciones ?? [],
      permiteComentarios: data.permiteComentarios ?? false,
    }
  },
}
