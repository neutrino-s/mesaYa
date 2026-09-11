/** Las cuatro columnas del tablero de "Pedidos en vivo" — el estado
 * `pagado` de `Pedido` se agrupa bajo `entregado` (ver
 * `columnaDePedido` en `pedidoBoardRules.ts`): una vez servido no queda
 * nada operativo por trackear en el salón/cocina. `cancelado` no tiene
 * columna, se excluye del tablero por completo. */
export type PedidoBoardColumnaId = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'

/** Filtro rápido del tablero: además de las cuatro columnas, "todos" las
 * muestra en simultáneo (vista kanban completa). La vista agrupada por mesa
 * (ver `MesasBoard`) vive aparte, en la página "Mesas" del sidebar. */
export type PedidoBoardFiltro = 'todos' | PedidoBoardColumnaId
