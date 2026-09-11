import type { CartaProductoGrupoOpciones, CartaProductoOpcion } from '@/types/cartaProducto'

export function crearGrupoOpciones(): CartaProductoGrupoOpciones {
  return {
    id: crypto.randomUUID(),
    nombre: '',
    obligatorio: false,
    seleccionMultiple: false,
    opciones: [],
  }
}

export function crearOpcion(): CartaProductoOpcion {
  return {
    id: crypto.randomUUID(),
    nombre: '',
    precioAdicional: 0,
    subgrupos: [],
  }
}

/** Total de opciones configurables de un plato, contando también las
 * anidadas en subgrupos — usado para el resumen en `CartaProductoCard`. */
export function contarOpcionesConfigurables(grupos: CartaProductoGrupoOpciones[]): number {
  return grupos.reduce((total, grupo) => {
    const delGrupo = grupo.opciones.reduce(
      (subtotal, opcion) => subtotal + 1 + contarOpcionesConfigurables(opcion.subgrupos),
      0,
    )
    return total + delGrupo
  }, 0)
}
