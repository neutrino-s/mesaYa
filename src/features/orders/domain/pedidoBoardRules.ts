// Lógica pura del tablero de "Pedidos en vivo": sin React, sin Firebase.

import type { Timestamp } from 'firebase/firestore'

import type { Pedido, PedidoEstado, PedidoItem } from '@/types/pedido'

import type { PedidoBoardColumnaId, PedidoBoardFiltro } from './types'

export interface PedidoBoardColumna {
  id: PedidoBoardColumnaId
  titulo: string
  /** Color del punto del encabezado de columna, un token crudo de la
   * paleta de marca (ver `--brand-*`/`--accent`/`--primary` en index.css)
   * para que cada estado se reconozca de un vistazo, igual que
   * `avatarClasses` en `features/staff/domain/staffRules.ts`. */
  dotClassName: string
}

export const COLUMNAS_BOARD: PedidoBoardColumna[] = [
  { id: 'pendiente', titulo: 'Pendientes', dotClassName: 'bg-accent' },
  { id: 'en_preparacion', titulo: 'En preparación', dotClassName: 'bg-brand-lavender' },
  { id: 'listo', titulo: 'Listos para entregar', dotClassName: 'bg-primary' },
  { id: 'entregado', titulo: 'Entregados', dotClassName: 'bg-muted-foreground' },
]

export const FILTRO_OPTIONS: { value: PedidoBoardFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'listo', label: 'Listos' },
  { value: 'entregado', label: 'Entregados' },
]

/** Etiqueta legible de cada estado de la máquina de estados — usada en el
 * timeline de `MesaPedidosDialog` (además de los títulos de columna de
 * arriba, que solo cubren los cuatro estados "vivos" del tablero). */
export const ESTADO_LABELS: Record<PedidoEstado, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

/** Estados que siguen "vivos" para el tablero: todo lo que no sea
 * `cancelado`. Es la lista que arma el `where('estado', 'in', ...)` del
 * repositorio — ver el índice compuesto `estado`+`createdAt` documentado en
 * `docs/database-schema.md#pedido--comanda`. */
export const ESTADOS_VISIBLES_BOARD: PedidoEstado[] = [
  'pendiente',
  'en_preparacion',
  'listo',
  'entregado',
  'pagado',
]

/** `pagado` no tiene columna propia: se muestra junto a `entregado` (ya se
 * sirvió, lo único que cambió es que además se cobró). */
export function columnaDePedido(estado: PedidoEstado): PedidoBoardColumnaId {
  return estado === 'pagado' ? 'entregado' : (estado as PedidoBoardColumnaId)
}

export function agruparPedidosPorColumna(pedidos: Pedido[]): Record<PedidoBoardColumnaId, Pedido[]> {
  const grupos: Record<PedidoBoardColumnaId, Pedido[]> = {
    pendiente: [],
    en_preparacion: [],
    listo: [],
    entregado: [],
  }
  for (const pedido of pedidos) {
    grupos[columnaDePedido(pedido.estado)].push(pedido)
  }
  return grupos
}

export function columnasVisibles(filtro: PedidoBoardFiltro): PedidoBoardColumna[] {
  if (filtro === 'todos') return COLUMNAS_BOARD
  return COLUMNAS_BOARD.filter((columna) => columna.id === filtro)
}

/** Grupos de opciones elegidas de un item, ya formateados para mostrar bajo
 * su línea en la card (ej. "Salsa: 4 quesos · Guarnición: Ensalada"); `null`
 * si el plato no tenía grupos. */
export function detalleDeItem(item: PedidoItem): string | null {
  if (item.detalle.length === 0) return null
  return item.detalle
    .map((grupo) => `${grupo.grupoNombre}: ${grupo.opciones.map((opcion) => opcion.nombre).join(', ')}`)
    .join(' · ')
}

/** Observaciones a destacar en la card: el `comentario` de cada item que
 * vino con alguno, tal cual lo escribió el comensal (ej. "Sin cebolla"). */
export function observacionesDePedido(pedido: Pedido): string[] {
  return pedido.items.map((item) => item.comentario).filter((comentario) => comentario.trim() !== '')
}

/** `mercadoPagoPaymentId` es el pago online al armar el pedido (Checkout
 * Pro/API) — independiente del estado `pagado` de la máquina de estados,
 * que representa el cierre de cuenta en la mesa. Por eso una card
 * "Pendiente" puede mostrar el badge "Pagado" igual. */
export function estaPagadoOnline(pedido: Pedido): boolean {
  return pedido.mercadoPagoPaymentId !== null
}

/** Horario en que el pedido entró a su estado actual: la entrada de
 * `historialEstados` que coincide con `pedido.estado`, recorrida de atrás
 * para adelante (el historial es append-only y cronológico, así que la
 * última coincidencia es la vigente). Cae a `updatedAt` si no hay ninguna
 * (no debería pasar en operación normal). */
export function horaInicioEstadoActual(pedido: Pedido): Timestamp {
  for (let i = pedido.historialEstados.length - 1; i >= 0; i--) {
    if (pedido.historialEstados[i].estado === pedido.estado) return pedido.historialEstados[i].en
  }
  return pedido.updatedAt
}

/** Resumen de una mesa activa para la vista "Mesas": agrupa todos sus
 * pedidos en curso en una sola card (`pedidos` ordenados del más reciente
 * al más antiguo). `mozoAsignadoId`/`creadoEn` toman el valor del pedido
 * más reciente de la mesa; `montoTotal` es la suma de todos. */
export interface MesaPedidosGrupo {
  mesaId: string
  mesaNumero: string
  mozoAsignadoId: string | null
  creadoEn: Pedido['createdAt']
  montoTotal: number
  pedidos: Pedido[]
}

export function agruparPedidosPorMesa(pedidos: Pedido[]): MesaPedidosGrupo[] {
  const porMesa = new Map<string, Pedido[]>()
  for (const pedido of pedidos) {
    const pedidosDeMesa = porMesa.get(pedido.mesaId) ?? []
    pedidosDeMesa.push(pedido)
    porMesa.set(pedido.mesaId, pedidosDeMesa)
  }

  const grupos = Array.from(porMesa.values()).map((pedidosDeMesa): MesaPedidosGrupo => {
    const ordenados = [...pedidosDeMesa].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    const masReciente = ordenados[0]
    return {
      mesaId: masReciente.mesaId,
      mesaNumero: masReciente.mesaNumero,
      mozoAsignadoId: masReciente.mozoAsignadoId,
      creadoEn: masReciente.createdAt,
      montoTotal: pedidosDeMesa.reduce((total, pedido) => total + pedido.total, 0),
      pedidos: ordenados,
    }
  })

  return grupos.sort((a, b) => a.mesaNumero.localeCompare(b.mesaNumero, undefined, { numeric: true }))
}
