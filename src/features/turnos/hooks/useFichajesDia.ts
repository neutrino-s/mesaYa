import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { fichajeRepository } from '../data/fichajeRepository'

export function fichajesDiaKey(restauranteId: string | null, fecha: string) {
  return ['fichajes', 'dia', restauranteId, fecha] as const
}

/** Fichajes de un día puntual, en tiempo real — mismo patrón que
 * `useCuadranteRange`. */
export function useFichajesDia(restauranteId: string | null, fecha: string) {
  const queryClient = useQueryClient()
  const queryKey = fichajesDiaKey(restauranteId, fecha)

  useEffect(() => {
    if (!restauranteId) return

    return fichajeRepository.subscribeDia(restauranteId, fecha, (fichajes) => {
      queryClient.setQueryData(queryKey, fichajes)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `queryKey` se deriva de las mismas deps
  }, [restauranteId, fecha, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => fichajeRepository.getDia(restauranteId!, fecha),
    enabled: Boolean(restauranteId),
  })
}
