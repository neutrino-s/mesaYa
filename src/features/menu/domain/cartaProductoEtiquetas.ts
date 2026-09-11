import type { CartaProductoEtiqueta } from '@/types/cartaProducto'

/** Orden fijo en que se listan/muestran las etiquetas en toda la app. */
export const ETIQUETAS_DISPONIBLES: CartaProductoEtiqueta[] = ['nuevo', 'masSolicitado', 'vegano', 'sinTacc']

export const ETIQUETA_LABEL: Record<CartaProductoEtiqueta, string> = {
  nuevo: 'Nuevo',
  masSolicitado: 'Más solicitado',
  vegano: 'Vegano',
  sinTacc: 'Sin TACC',
}

// Cada etiqueta necesita distinguirse de un vistazo en la carta, así que no
// comparten el color de acento del proyecto (reservado a acciones primarias).
export const ETIQUETA_CLASSNAME: Record<CartaProductoEtiqueta, string> = {
  nuevo: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  masSolicitado: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  vegano: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  sinTacc: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
}
