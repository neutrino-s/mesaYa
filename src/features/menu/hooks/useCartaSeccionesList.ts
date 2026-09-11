import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { cartaSeccionRepository } from '../data/cartaSeccionRepository'

function cartaSeccionesListKey(restauranteId: string | null) {
  return ['cartaSecciones', 'list', restauranteId] as const
}

/** Lista de secciones de la carta de un restaurante, en tiempo real (mismo
 * patrón que `useSalonesList`). */
export function useCartaSeccionesList(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = cartaSeccionesListKey(restauranteId)

  useEffect(() => {
    if (!restauranteId) return

    return cartaSeccionRepository.subscribeList(restauranteId, (secciones) => {
      queryClient.setQueryData(cartaSeccionesListKey(restauranteId), secciones)
    })
  }, [restauranteId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => cartaSeccionRepository.getList(restauranteId!),
    enabled: Boolean(restauranteId),
  })
}
