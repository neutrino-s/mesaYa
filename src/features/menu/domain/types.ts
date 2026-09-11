import type { CartaProductoGrupoOpciones } from '@/types/cartaProducto'

export interface CartaSeccionFormValues {
  nombre: string
}

export interface CartaProductoFormValues {
  nombre: string
  descripcion: string
  /** String tal como lo tipea el usuario (o `''` si no cargó precio); se
   * convierte a `number | null` recién al guardar. */
  precio: string
  /** Grupos de opciones configurables (salsas, guarniciones, adicionales),
   * armados en `OpcionesGruposEditor` como estado local, fuera de React
   * Hook Form — ver ese componente. */
  gruposOpciones: CartaProductoGrupoOpciones[]
  /** Habilita el campo de comentario libre para el comensal (ej. "sin
   * sal"); estado local, mismo criterio que `gruposOpciones`. */
  permiteComentarios: boolean
}
