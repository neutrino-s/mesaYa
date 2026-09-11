import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { pedidoRepository } from '../data/pedidoRepository'

function pedidosEnVivoKey(restauranteId: string | null) {
  return ['pedidos', 'en-vivo', restauranteId] as const
}

/** Pedidos no cancelados de un restaurante, en tiempo real: `queryFn` hace
 * la carga inicial (da estado de loading/error a React Query) y el
 * `onSnapshot` de abajo mantiene la cache al día mientras el tablero esté
 * montado — mismo patrón que `useStaffList`. */
export function usePedidosEnVivo(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = pedidosEnVivoKey(restauranteId)

  useEffect(() => {
    if (!restauranteId) return

    return pedidoRepository.subscribeEnVivo(restauranteId, (pedidos) => {
      queryClient.setQueryData(pedidosEnVivoKey(restauranteId), pedidos)
    })
  }, [restauranteId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => pedidoRepository.getEnVivo(restauranteId!),
    enabled: Boolean(restauranteId),
  })
}
