import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { cartaProductoRepository } from '../data/cartaProductoRepository'

function cartaProductosListKey(restauranteId: string | null) {
  return ['cartaProductos', 'list', restauranteId] as const
}

/** Todos los productos de la carta de un restaurante, en tiempo real
 * (mismo patrón que `useSalonesList`). La página los agrupa por sección con
 * `agruparPorSeccion` — ver `docs/database-schema.md#carta---producto`. */
export function useCartaProductosList(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = cartaProductosListKey(restauranteId)

  useEffect(() => {
    if (!restauranteId) return

    return cartaProductoRepository.subscribeList(restauranteId, (productos) => {
      queryClient.setQueryData(cartaProductosListKey(restauranteId), productos)
    })
  }, [restauranteId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => cartaProductoRepository.getList(restauranteId!),
    enabled: Boolean(restauranteId),
  })
}
