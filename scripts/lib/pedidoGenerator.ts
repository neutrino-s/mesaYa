/**
 * Generador puro de pedidos de prueba: sin Firestore/Admin SDK, solo datos
 * de entrada -> `PedidoSeed[]`. Separado de `seedPedidos.ts` para poder
 * probarlo de forma aislada (ver `scripts/lib/pedidoGenerator.selftest.ts`)
 * y para que la lógica de "cómo se arma un pedido" no dependa de cómo se
 * lee/escribe en Firestore.
 *
 * Los tipos de acá son un espejo deliberadamente reducido de
 * `src/types/cartaProducto.ts` / `src/types/pedido.ts` — mismo criterio que
 * `functions/src/types/*.ts` ya usa en este proyecto: cada paquete que no
 * comparte build con el frontend duplica el subset de shape que necesita en
 * vez de importar `src/` directo.
 */
import { randomUUID } from 'node:crypto'
import { elegirNSinRepetir, pickRandom, randomInt } from './random.js'

export type PedidoEstado = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'pagado' | 'cancelado'
export type PedidoOrigen = 'comensal' | 'mozo'

/** Igual que `ESTADOS_EN_COCINA` en `src/features/orders/domain/pedidoRules.ts`
 * — duplicado acá a propósito (ver comentario de archivo). */
export const ESTADOS_EN_COCINA: readonly PedidoEstado[] = ['pendiente', 'en_preparacion', 'listo']

export interface OpcionSeed {
  id: string
  nombre: string
  precioAdicional: number
  subgrupos: GrupoOpcionesSeed[]
}

export interface GrupoOpcionesSeed {
  id: string
  nombre: string
  obligatorio: boolean
  seleccionMultiple: boolean
  opciones: OpcionSeed[]
}

export interface ProductoSeed {
  id: string
  seccionId: string
  nombre: string
  precio: number | null
  agotado: boolean
  gruposOpciones: GrupoOpcionesSeed[]
  permiteComentarios: boolean
}

export interface MesaSeed {
  id: string
  salonId: string
  numero: string
  qrToken: string
}

export interface StaffSeed {
  id: string
}

export interface PedidoDetalleGrupoSeed {
  grupoNombre: string
  opciones: { nombre: string; precioAdicional: number }[]
}

export interface PedidoItemSeed {
  id: string
  productoId: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  detalle: PedidoDetalleGrupoSeed[]
  comentario: string
}

/** Espejo de `PedidoHistorialEntrada` (`src/types/pedido.ts`) con `en` como
 * epoch ms — mismo motivo que `createdAtMs`/`updatedAtMs` de abajo. */
export interface PedidoHistorialEntradaSeed {
  estado: PedidoEstado
  enMs: number
}

/** `createdAt`/`updatedAt` como epoch ms (no `Timestamp`): este módulo no
 * conoce Firestore — `seedPedidos.ts` los convierte al escribir/serializar. */
export interface PedidoSeed {
  mesaId: string
  salonId: string
  mesaNumero: string
  qrTokenOrigen: string | null
  origen: PedidoOrigen
  estado: PedidoEstado
  historialEstados: PedidoHistorialEntradaSeed[]
  items: PedidoItemSeed[]
  subtotal: number
  total: number
  mozoAsignadoId: string | null
  motivoCancelacion: string | null
  mercadoPagoPaymentId: null
  createdAtMs: number
  updatedAtMs: number
}

const EJEMPLOS_COMENTARIO = [
  'sin sal',
  'sin cebolla',
  'bien cocido',
  'poco picante',
  'sin tacc por favor',
  'para compartir',
  'salsa aparte',
  'sin verdeo',
]

const EJEMPLOS_MOTIVO_CANCELACION = [
  'El comensal se fue de la mesa antes de que saliera',
  'Pidió cambiar el pedido por otro plato',
  'Se acabó el ingrediente principal después de tomar el pedido',
  'Pedido duplicado por error',
  'Demora excesiva en cocina, el comensal prefirió cancelar',
]

/** Secuencia lineal completa de la máquina de estados — ver
 * `ESTADOS_EN_COCINA`/`TRANSICIONES_VALIDAS` en
 * `src/features/orders/domain/pedidoRules.ts` (duplicado acá a propósito,
 * ver comentario de archivo). `cancelado` no es lineal: se ramifica desde
 * cualquiera de los primeros tres estados, nunca desde `entregado`/`pagado`. */
const ESTADOS_LINEALES: readonly PedidoEstado[] = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'pagado']
const ESTADOS_CANCELABLES_DESDE: readonly PedidoEstado[] = ['pendiente', 'en_preparacion', 'listo']

/** Distribución de estados a generar: ponderada hacia los "en cocina" para
 * seguir poblando bien el tablero en vivo por defecto, pero cubriendo
 * también los estados terminales (antes el script nunca los generaba). */
const ESTADOS_POSIBLES_PONDERADOS: readonly PedidoEstado[] = [
  'pendiente',
  'pendiente',
  'pendiente',
  'en_preparacion',
  'en_preparacion',
  'en_preparacion',
  'listo',
  'listo',
  'listo',
  'entregado',
  'entregado',
  'pagado',
  'pagado',
  'cancelado',
]

/** Recorre los grupos de opciones de un plato y arma tanto el detalle
 * legible (`PedidoDetalleGrupoSeed[]`) como el adicional de precio
 * resultante. Los grupos obligatorios siempre eligen algo; los opcionales,
 * con 50% de probabilidad — mismo criterio recursivo que
 * `calcularPrecioAdicional`/`todosLosObligatoriosCompletos` en
 * `src/features/menu/domain/cartaPreviewRules.ts` (acá además decide la
 * selección, no solo la valida). */
function elegirOpciones(
  grupos: GrupoOpcionesSeed[],
  rng: () => number,
): { detalle: PedidoDetalleGrupoSeed[]; precioAdicional: number } {
  let precioAdicional = 0
  const detalle: PedidoDetalleGrupoSeed[] = []

  for (const grupo of grupos) {
    if (grupo.opciones.length === 0) continue
    const incluirGrupo = grupo.obligatorio || rng() < 0.5
    if (!incluirGrupo) continue

    const cantidadAElegir = grupo.seleccionMultiple ? randomInt(rng, 1, Math.min(2, grupo.opciones.length)) : 1
    const elegidas = elegirNSinRepetir(rng, grupo.opciones, cantidadAElegir)

    detalle.push({
      grupoNombre: grupo.nombre || 'Opciones',
      opciones: elegidas.map((opcion) => ({ nombre: opcion.nombre || 'Opción', precioAdicional: opcion.precioAdicional })),
    })

    for (const opcion of elegidas) {
      precioAdicional += opcion.precioAdicional
      const delSubgrupo = elegirOpciones(opcion.subgrupos, rng)
      precioAdicional += delSubgrupo.precioAdicional
      detalle.push(...delSubgrupo.detalle)
    }
  }

  return { detalle, precioAdicional }
}

function generarComentario(producto: ProductoSeed, rng: () => number): string {
  if (!producto.permiteComentarios) return ''
  if (rng() > 0.4) return ''
  return pickRandom(rng, EJEMPLOS_COMENTARIO)
}

function crearItem(producto: ProductoSeed, rng: () => number): PedidoItemSeed {
  const { detalle, precioAdicional } = elegirOpciones(producto.gruposOpciones, rng)
  return {
    id: randomUUID(),
    productoId: producto.id,
    productoNombre: producto.nombre || 'Plato sin nombre',
    cantidad: randomInt(rng, 1, 3),
    precioUnitario: (producto.precio ?? 0) + precioAdicional,
    detalle,
    comentario: generarComentario(producto, rng),
  }
}

function totalDeItems(items: PedidoItemSeed[]): number {
  return items.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0)
}

/** Cuántos minutos toma cada transición puntual — rangos a ojo, solo para
 * que el historial generado sea plausible (cocina tarda más que "el mozo
 * lo lleva a la mesa", etc.). `hasta` es el estado de llegada. */
function minutosTransicion(hasta: PedidoEstado, rng: () => number): number {
  switch (hasta) {
    case 'en_preparacion':
      return randomInt(rng, 1, 10) // cocina "toma" el pedido
    case 'listo':
      return randomInt(rng, 5, 25) // tiempo de cocción
    case 'entregado':
      return randomInt(rng, 1, 8) // el mozo lo retira y lo lleva a la mesa
    case 'pagado':
      return randomInt(rng, 2, 45) // hasta que se pide y se cierra la cuenta
    case 'cancelado':
      return randomInt(rng, 1, 15) // hasta que se decide cancelar
    default:
      return 0
  }
}

interface HistorialPasoSeed {
  estado: PedidoEstado
  minutosAcumulados: number
}

/** Arma la secuencia de estados que atravesó el pedido hasta llegar a
 * `estadoFinal` (con sus minutos acumulados desde `pendiente`) y, si
 * `estadoFinal === 'cancelado'`, también el motivo — se cancela desde
 * cualquiera de `ESTADOS_CANCELABLES_DESDE`, nunca desde `entregado`/`pagado`,
 * igual que valida `puedeTransicionar` en `src/features/orders/domain/pedidoRules.ts`. */
function construirHistorial(
  estadoFinal: PedidoEstado,
  rng: () => number,
): { historial: HistorialPasoSeed[]; motivoCancelacion: string | null } {
  const secuencia: PedidoEstado[] =
    estadoFinal === 'cancelado'
      ? [
          ...ESTADOS_LINEALES.slice(0, ESTADOS_LINEALES.indexOf(pickRandom(rng, ESTADOS_CANCELABLES_DESDE)) + 1),
          'cancelado',
        ]
      : ESTADOS_LINEALES.slice(0, ESTADOS_LINEALES.indexOf(estadoFinal) + 1)

  const historial: HistorialPasoSeed[] = [{ estado: 'pendiente', minutosAcumulados: 0 }]
  let acumulado = 0
  for (let i = 1; i < secuencia.length; i++) {
    acumulado += minutosTransicion(secuencia[i], rng)
    historial.push({ estado: secuencia[i], minutosAcumulados: acumulado })
  }

  const motivoCancelacion = estadoFinal === 'cancelado' ? pickRandom(rng, EJEMPLOS_MOTIVO_CANCELACION) : null
  return { historial, motivoCancelacion }
}

export interface GenerarPedidoOpts {
  itemsMax: number
  /** Minutos atrás en los que se cargó un pedido que sigue `pendiente` (los
   * demás estados derivan su propio `createdAt` de cuánto tardó en llegar
   * hasta ahí — ver `construirHistorial`/`minutosTransicion`). */
  minutosAtrasMin: number
  minutosAtrasMax: number
  ahoraMs: number
}

function crearPedido(
  mesa: MesaSeed,
  productos: readonly ProductoSeed[],
  mozos: readonly StaffSeed[],
  rng: () => number,
  opts: GenerarPedidoOpts,
): PedidoSeed {
  const cantidadItems = randomInt(rng, 1, opts.itemsMax)
  // Productos sin repetir dentro de un mismo pedido: pedir el mismo plato
  // dos veces se refleja en `cantidad`, nunca en dos líneas separadas.
  const productosElegidos = elegirNSinRepetir(rng, productos, cantidadItems)
  const items = productosElegidos.map((producto) => crearItem(producto, rng))
  const total = totalDeItems(items)
  const estado = pickRandom(rng, ESTADOS_POSIBLES_PONDERADOS)
  const origen: PedidoOrigen = rng() < 0.7 ? 'comensal' : 'mozo'

  const { historial, motivoCancelacion } = construirHistorial(estado, rng)
  // `pendiente` (historial de un solo paso): usa el rango `minutosAtras`
  // de siempre, para dar variación entre pedidos recién llegados. El resto
  // deriva su `createdAt` de cuánto tardó realmente en recorrer el
  // historial, así ningún timestamp queda en el futuro.
  const duracionTotalMin =
    historial.length > 1 ? historial[historial.length - 1].minutosAcumulados : randomInt(rng, opts.minutosAtrasMin, opts.minutosAtrasMax)
  const createdAtMs = opts.ahoraMs - duracionTotalMin * 60_000
  const historialEstados: PedidoHistorialEntradaSeed[] = historial.map((paso) => ({
    estado: paso.estado,
    enMs: createdAtMs + paso.minutosAcumulados * 60_000,
  }))
  const updatedAtMs = historialEstados[historialEstados.length - 1].enMs

  return {
    mesaId: mesa.id,
    salonId: mesa.salonId,
    mesaNumero: mesa.numero,
    qrTokenOrigen: origen === 'comensal' && mesa.qrToken ? mesa.qrToken : null,
    origen,
    estado,
    historialEstados,
    items,
    subtotal: total,
    total,
    mozoAsignadoId: mozos.length > 0 ? pickRandom(rng, mozos).id : null,
    motivoCancelacion,
    mercadoPagoPaymentId: null,
    createdAtMs,
    updatedAtMs,
  }
}

export interface GenerarPedidosOpts {
  pedidosMax: number
  itemsMax: number
  minutosAtrasMin: number
  minutosAtrasMax: number
  ahoraMs: number
}

/** Orquesta la generación para todas las mesas dadas: entre 1 y
 * `pedidosMax` pedidos por mesa. Pura — no toca Firestore. */
export function generarPedidosParaMesas(
  mesas: readonly MesaSeed[],
  productos: readonly ProductoSeed[],
  mozos: readonly StaffSeed[],
  rng: () => number,
  opts: GenerarPedidosOpts,
): PedidoSeed[] {
  const pedidos: PedidoSeed[] = []
  for (const mesa of mesas) {
    const cantidadPedidos = randomInt(rng, 1, opts.pedidosMax)
    for (let i = 0; i < cantidadPedidos; i++) {
      pedidos.push(crearPedido(mesa, productos, mozos, rng, opts))
    }
  }
  return pedidos
}
