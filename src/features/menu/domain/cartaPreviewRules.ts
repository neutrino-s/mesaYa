import type { CartaProductoGrupoOpciones } from '@/types/cartaProducto'
import type { PedidoDetalleGrupo } from '@/types/pedido'

/** Opciones elegidas en la previsualización: `grupoId -> ids de opciones
 * elegidas dentro de ese grupo`. Como los `id` de grupo son únicos en todo
 * el árbol del plato (`crypto.randomUUID()`), alcanza un mapa plano aunque
 * los grupos estén anidados. */
export type CarritoPreviewSeleccion = Record<string, string[]>

/** Mismo shape que `PedidoItem.detalle` (`types/pedido.ts`): el carrito de
 * la previsualización es, en los hechos, un `Pedido` todavía no persistido. */
export type CarritoPreviewDetalleGrupo = PedidoDetalleGrupo

export interface CarritoPreviewItem {
  id: string
  productoId: string
  productoNombre: string
  imagenUrl: string | null
  cantidad: number
  /** Precio base del plato + adicionales de las opciones elegidas. */
  precioUnitario: number
  detalle: CarritoPreviewDetalleGrupo[]
  /** Aclaración libre del comensal (ej. "sin sal"); `''` si el plato no
   * tiene `permiteComentarios` o el comensal no escribió nada. */
  comentario: string
}

/** Alterna una opción dentro de un grupo: en selección única (`!seleccionMultiple`)
 * elegir una opción reemplaza cualquier otra ya elegida del mismo grupo (y
 * tocarla de nuevo la deselecciona, como una radio "cancelable"); en
 * selección múltiple simplemente suma/saca esa opción de la lista. */
export function alternarOpcion(
  seleccion: CarritoPreviewSeleccion,
  grupo: CartaProductoGrupoOpciones,
  opcionId: string,
): CarritoPreviewSeleccion {
  const actuales = seleccion[grupo.id] ?? []

  if (!grupo.seleccionMultiple) {
    const yaElegida = actuales[0] === opcionId
    return { ...seleccion, [grupo.id]: yaElegida ? [] : [opcionId] }
  }

  const siguientes = actuales.includes(opcionId)
    ? actuales.filter((id) => id !== opcionId)
    : [...actuales, opcionId]
  return { ...seleccion, [grupo.id]: siguientes }
}

/** Suma recursiva de `precioAdicional` de las opciones elegidas —
 * solo desciende a los subgrupos de una opción si esa opción está elegida
 * (los subgrupos de una opción no elegida no son "alcanzables"). */
export function calcularPrecioAdicional(
  grupos: CartaProductoGrupoOpciones[],
  seleccion: CarritoPreviewSeleccion,
): number {
  return grupos.reduce((total, grupo) => {
    const elegidas = seleccion[grupo.id] ?? []
    const delGrupo = grupo.opciones.reduce((subtotal, opcion) => {
      if (!elegidas.includes(opcion.id)) return subtotal
      return subtotal + opcion.precioAdicional + calcularPrecioAdicional(opcion.subgrupos, seleccion)
    }, 0)
    return total + delGrupo
  }, 0)
}

/** `true` si todos los grupos obligatorios alcanzables (ver comentario de
 * `calcularPrecioAdicional`) tienen al menos una opción elegida. */
export function todosLosObligatoriosCompletos(
  grupos: CartaProductoGrupoOpciones[],
  seleccion: CarritoPreviewSeleccion,
): boolean {
  return grupos.every((grupo) => {
    const elegidas = seleccion[grupo.id] ?? []
    if (grupo.obligatorio && elegidas.length === 0) return false

    return grupo.opciones.every((opcion) => {
      if (!elegidas.includes(opcion.id)) return true
      return todosLosObligatoriosCompletos(opcion.subgrupos, seleccion)
    })
  })
}

/** Arma el detalle legible de la selección (para la línea del carrito),
 * recorriendo solo los grupos/opciones alcanzables. */
export function describirSeleccion(
  grupos: CartaProductoGrupoOpciones[],
  seleccion: CarritoPreviewSeleccion,
): CarritoPreviewDetalleGrupo[] {
  return grupos.flatMap((grupo) => {
    const elegidas = grupo.opciones.filter((opcion) => (seleccion[grupo.id] ?? []).includes(opcion.id))
    if (elegidas.length === 0) return []

    const propio: CarritoPreviewDetalleGrupo = {
      grupoNombre: grupo.nombre || 'Opciones',
      opciones: elegidas.map((opcion) => ({
        nombre: opcion.nombre || 'Opción',
        precioAdicional: opcion.precioAdicional,
      })),
    }
    const deSubgrupos = elegidas.flatMap((opcion) => describirSeleccion(opcion.subgrupos, seleccion))
    return [propio, ...deSubgrupos]
  })
}

function mismaLinea(
  a: Pick<CarritoPreviewItem, 'detalle' | 'comentario'>,
  b: Pick<CarritoPreviewItem, 'detalle' | 'comentario'>,
): boolean {
  return a.comentario === b.comentario && JSON.stringify(a.detalle) === JSON.stringify(b.detalle)
}

/** Agrega un plato al carrito, mergeando cantidad con una línea existente
 * si el plato, la selección de opciones y el comentario son idénticos
 * (mismo criterio que un carrito de compra real — dos comentarios
 * distintos son pedidos distintos, no se suman). */
export function agregarAlCarrito(
  carrito: CarritoPreviewItem[],
  nuevo: Omit<CarritoPreviewItem, 'id'>,
): CarritoPreviewItem[] {
  const existente = carrito.find(
    (item) => item.productoId === nuevo.productoId && mismaLinea(item, nuevo),
  )

  if (existente) {
    return carrito.map((item) =>
      item.id === existente.id ? { ...item, cantidad: item.cantidad + nuevo.cantidad } : item,
    )
  }

  return [...carrito, { ...nuevo, id: crypto.randomUUID() }]
}

/** `cantidad <= 0` saca la línea del carrito. */
export function actualizarCantidadCarrito(
  carrito: CarritoPreviewItem[],
  itemId: string,
  cantidad: number,
): CarritoPreviewItem[] {
  if (cantidad <= 0) return carrito.filter((item) => item.id !== itemId)
  return carrito.map((item) => (item.id === itemId ? { ...item, cantidad } : item))
}

export function quitarDelCarrito(carrito: CarritoPreviewItem[], itemId: string): CarritoPreviewItem[] {
  return carrito.filter((item) => item.id !== itemId)
}

export function calcularTotalCarrito(carrito: CarritoPreviewItem[]): number {
  return carrito.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0)
}

export function contarItemsCarrito(carrito: CarritoPreviewItem[]): number {
  return carrito.reduce((total, item) => total + item.cantidad, 0)
}
