import type { PedidoEstado, PedidoHistorialEntrada, PedidoItem } from '@/types/pedido'
import type { RolStaff } from '@/types/staff'

/** Estados en los que el pedido todavía está "en la cocina": ya se cargó
 * pero todavía no se despachó a la mesa. Usado tanto por el dashboard de
 * cocina como por el set de pruebas (`scripts/seedPedidos.ts`). */
export const ESTADOS_EN_COCINA: PedidoEstado[] = ['pendiente', 'en_preparacion', 'listo']

/** `entregado`/`pagado`/`cancelado`: no admiten ninguna transición más (una
 * devolución post-pago es un caso aparte, sin diseñar todavía). */
export const ESTADOS_TERMINALES: PedidoEstado[] = ['pagado', 'cancelado']

/** Transiciones válidas de la máquina de estados — ver
 * `docs/database-schema.md#pedido--comanda`. */
const TRANSICIONES_VALIDAS: Record<PedidoEstado, PedidoEstado[]> = {
  pendiente: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: ['pagado'],
  pagado: [],
  cancelado: [],
}

/** Roles habilitados a disparar cada transición puntual. `administrador`
 * puede todo lo que ya es válido en `TRANSICIONES_VALIDAS` (no hace falta
 * repetirlo en cada entrada). */
const ROLES_POR_TRANSICION: Partial<Record<PedidoEstado, Partial<Record<PedidoEstado, RolStaff[]>>>> = {
  pendiente: { en_preparacion: ['cocinero', 'bartender'], cancelado: ['mozo'] },
  en_preparacion: { listo: ['cocinero', 'bartender'], cancelado: ['mozo'] },
  listo: { entregado: ['mozo'], cancelado: ['mozo'] },
  entregado: { pagado: ['mozo'] },
}

export function esEstadoTerminal(estado: PedidoEstado): boolean {
  return ESTADOS_TERMINALES.includes(estado)
}

export function transicionesDisponibles(estado: PedidoEstado): PedidoEstado[] {
  return TRANSICIONES_VALIDAS[estado]
}

export function requiereMotivoCancelacion(estadoDestino: PedidoEstado): boolean {
  return estadoDestino === 'cancelado'
}

/** `administrador` puede disparar cualquier transición que ya sea válida
 * para el estado actual; el resto de los roles solo las que tengan
 * explícitamente asignadas en `ROLES_POR_TRANSICION`. */
export function puedeTransicionar(desde: PedidoEstado, hasta: PedidoEstado, rol: RolStaff): boolean {
  if (!TRANSICIONES_VALIDAS[desde].includes(hasta)) return false
  if (rol === 'administrador') return true
  return (ROLES_POR_TRANSICION[desde]?.[hasta] ?? []).includes(rol)
}

/** `precioUnitario` ya incluye los adicionales de las opciones elegidas
 * (ver `PedidoItem` en `types/pedido.ts`), así que esto es directamente lo
 * que esa línea suma al total del pedido. */
export function precioTotalItem(item: PedidoItem): number {
  return item.precioUnitario * item.cantidad
}

export function calcularSubtotalPedido(items: PedidoItem[]): number {
  return items.reduce((total, item) => total + precioTotalItem(item), 0)
}

/** Hoy siempre igual al subtotal (sin descuentos/propina todavía) — ver
 * nota en `docs/database-schema.md#pedido--comanda`. */
export function calcularTotalPedido(items: PedidoItem[]): number {
  return calcularSubtotalPedido(items)
}

/** Milisegundos entre la primera vez que el pedido pasó por `desde` y la
 * primera vez que pasó por `hasta`, leyendo `historialEstados` — base para
 * las métricas de tiempo en cocina/salón (ver
 * `docs/database-schema.md#pedido--comanda`). `null` si el pedido todavía
 * no pasó por alguno de los dos (ej. medir "listo → entregado" en un
 * pedido que sigue en preparación), o si `hasta` ocurrió antes que
 * `desde` en el historial (dato inconsistente). */
export function duracionEntreEstados(
  historial: PedidoHistorialEntrada[],
  desde: PedidoEstado,
  hasta: PedidoEstado,
): number | null {
  const inicio = historial.find((entrada) => entrada.estado === desde)
  const fin = historial.find((entrada) => entrada.estado === hasta)
  if (!inicio || !fin) return null

  const diferenciaMs = fin.en.toMillis() - inicio.en.toMillis()
  return diferenciaMs >= 0 ? diferenciaMs : null
}
