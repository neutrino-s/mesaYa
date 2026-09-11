import type { CartaProducto } from '@/types/cartaProducto'

/** `null`/`undefined` cuando el plato todavía no tiene precio cargado. */
export function formatPrecio(precio: number | null): string | null {
  if (precio === null) return null
  return precio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

/** Máscara de precio estilo Argentina (punto de miles, coma decimal, hasta
 * 2 decimales) — se aplica en cada tecleo sobre el input de `precio` del
 * form. Descarta cualquier caracter que no sea dígito o coma, y se queda
 * solo con la primera coma tipeada (separador decimal). */
export function maskPrecioInput(raw: string): string {
  const soloDigitosYComa = raw.replace(/[^\d,]/g, '')
  const indexComa = soloDigitosYComa.indexOf(',')

  const enterosSinFormatear =
    indexComa === -1 ? soloDigitosYComa : soloDigitosYComa.slice(0, indexComa)
  const enteros = enterosSinFormatear
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  if (indexComa === -1) return enteros

  const decimales = soloDigitosYComa.slice(indexComa + 1).replace(/,/g, '').slice(0, 2)
  return `${enteros},${decimales}`
}

/** Inverso de `maskPrecioInput`: convierte el string con máscara AR a un
 * `number` (o `null` si está vacío) para persistir en Firestore. */
export function parsePrecioInput(masked: string): number | null {
  if (masked.trim() === '') return null
  const normalizado = masked.replace(/\./g, '').replace(',', '.')
  const value = Number(normalizado)
  return Number.isFinite(value) ? value : null
}

/** Formatea un precio ya guardado como string con máscara AR, para
 * precargar el input al editar un plato existente. */
export function precioInicialInput(precio: number | null): string {
  if (precio === null) return ''
  return precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Agrupa los productos (colección plana, ver `docs/database-schema.md#carta---producto`)
 * por `seccionId` para pintarlos dentro de cada `CartaSeccionCard`. */
export function agruparPorSeccion(productos: CartaProducto[]): Map<string, CartaProducto[]> {
  const porSeccion = new Map<string, CartaProducto[]>()
  for (const producto of productos) {
    const lista = porSeccion.get(producto.seccionId) ?? []
    lista.push(producto)
    porSeccion.set(producto.seccionId, lista)
  }
  return porSeccion
}
