import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions, Timestamp } from 'firebase/firestore'

export type PedidoEstado = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'pagado' | 'cancelado'

export type PedidoOrigen = 'comensal' | 'mozo'

/** Una opción elegida dentro de un grupo, tal como quedó al momento de
 * pedir (ver `CartaProductoGrupoOpciones`/`CartaProductoOpcion` en
 * `types/cartaProducto.ts`). */
export interface PedidoOpcionElegida {
  nombre: string
  precioAdicional: number
}

/** Mismo shape que `CarritoPreviewDetalleGrupo` en
 * `features/menu/domain/cartaPreviewRules.ts` — un pedido real es, en los
 * hechos, el carrito de la previsualización de la carta ya persistido. */
export interface PedidoDetalleGrupo {
  grupoNombre: string
  opciones: PedidoOpcionElegida[]
}

/** Un registro de `historialEstados`: una transición de la máquina de
 * estados que efectivamente ocurrió, con el momento en que pasó. La
 * primera entrada siempre es `{ estado: 'pendiente', en: createdAt }`;
 * nunca se edita ni se borra una entrada existente, solo se agregan nuevas
 * a medida que el pedido avanza — ver `docs/database-schema.md#pedido--comanda`. */
export interface PedidoHistorialEntrada {
  estado: PedidoEstado
  en: Timestamp
}

/** Una línea del pedido. */
export interface PedidoItem {
  /** Id local a la línea (uuid), para poder referenciarla puntualmente a
   * futuro (ej. cancelar/editar un solo item). */
  id: string
  productoId: string
  /** Denormalizado al momento de pedir: si el admin edita el nombre del
   * plato después, el histórico de este pedido no cambia. */
  productoNombre: string
  cantidad: number
  /** Precio base del plato + adicionales de las opciones elegidas,
   * calculado al momento de pedir. */
  precioUnitario: number
  /** `[]` si el plato no tenía grupos de opciones. */
  detalle: PedidoDetalleGrupo[]
  /** Aclaración libre del comensal (ej. "sin sal"); `''` si no aplica. */
  comentario: string
}

/**
 * Colección raíz (anidada bajo `restaurantes`, no subcolección de mesa):
 * `restaurantes/{restauranteId}/pedidos/{pedidoId}`.
 * Ver `docs/database-schema.md#pedido--comanda` para el esquema completo,
 * la máquina de estados y los roles habilitados por transición
 * (`features/orders/domain/pedidoRules.ts`).
 */
export interface Pedido {
  id: string
  restauranteId: string
  mesaId: string
  salonId: string
  /** Denormalizado — `string`, igual que `Mesa.numero` (ver `types/mesa.ts`). */
  mesaNumero: string
  /** `null` si el pedido no se originó escaneando un QR (ver `origen`). */
  qrTokenOrigen: string | null
  origen: PedidoOrigen
  estado: PedidoEstado
  /** Timeline de la máquina de estados — ver `PedidoHistorialEntrada`.
   * Base para métricas de tiempo (cuánto tarda de `pendiente` a
   * `en_preparacion`, etc.), no solo el último cambio como `updatedAt`. */
  historialEstados: PedidoHistorialEntrada[]
  items: PedidoItem[]
  /** Suma de `precioUnitario * cantidad` de todos los items. */
  subtotal: number
  /** Hoy siempre igual a `subtotal` (sin descuentos/propina todavía). */
  total: number
  mozoAsignadoId: string | null
  /** Obligatorio (no vacío) cuando `estado === 'cancelado'`; `null` en
   * cualquier otro estado. */
  motivoCancelacion: string | null
  mercadoPagoPaymentId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const pedidoConverter: FirestoreDataConverter<Pedido> = {
  toFirestore(pedido) {
    return {
      restauranteId: pedido.restauranteId,
      mesaId: pedido.mesaId,
      salonId: pedido.salonId,
      mesaNumero: pedido.mesaNumero,
      qrTokenOrigen: pedido.qrTokenOrigen,
      origen: pedido.origen,
      estado: pedido.estado,
      historialEstados: pedido.historialEstados,
      items: pedido.items,
      subtotal: pedido.subtotal,
      total: pedido.total,
      mozoAsignadoId: pedido.mozoAsignadoId,
      motivoCancelacion: pedido.motivoCancelacion,
      mercadoPagoPaymentId: pedido.mercadoPagoPaymentId,
      createdAt: pedido.createdAt,
      updatedAt: pedido.updatedAt,
    }
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Pedido {
    const data = snapshot.data(options)
    return {
      id: snapshot.id,
      restauranteId: data.restauranteId,
      mesaId: data.mesaId,
      salonId: data.salonId,
      mesaNumero: data.mesaNumero,
      qrTokenOrigen: data.qrTokenOrigen ?? null,
      origen: data.origen ?? 'mozo',
      estado: data.estado,
      historialEstados: data.historialEstados ?? [],
      items: data.items ?? [],
      subtotal: data.subtotal ?? 0,
      total: data.total ?? 0,
      mozoAsignadoId: data.mozoAsignadoId ?? null,
      motivoCancelacion: data.motivoCancelacion ?? null,
      mercadoPagoPaymentId: data.mercadoPagoPaymentId ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  },
}
