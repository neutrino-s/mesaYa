import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { fichajeRepository } from '../data/fichajeRepository'

export function fichajesRangoKey(restauranteId: string | null, fechaDesde: string, fechaHasta: string) {
  return ['fichajes', 'rango', restauranteId, fechaDesde, fechaHasta] as const
}

/** Fichajes dentro de un rango de fechas, en tiempo real — mismo patrón que
 * `useCuadranteRange`. Lo usa la pestaña de Métricas. */
export function useFichajesRango(restauranteId: string | null, fechaDesde: string, fechaHasta: string) {
  const queryClient = useQueryClient()
  const queryKey = fichajesRangoKey(restauranteId, fechaDesde, fechaHasta)

  useEffect(() => {
    if (!restauranteId) return

    return fichajeRepository.subscribeRango(restauranteId, fechaDesde, fechaHasta, (fichajes) => {
      queryClient.setQueryData(queryKey, fichajes)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `queryKey` se deriva de las mismas deps
  }, [restauranteId, fechaDesde, fechaHasta, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => fichajeRepository.getRango(restauranteId!, fechaDesde, fechaHasta),
    enabled: Boolean(restauranteId),
  })
}
