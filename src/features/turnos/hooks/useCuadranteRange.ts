import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { turnoAsignadoRepository } from '../data/turnoAsignadoRepository'

export function cuadranteRangeKey(restauranteId: string | null, fechaDesde: string, fechaHasta: string) {
  return ['turnosAsignados', 'range', restauranteId, fechaDesde, fechaHasta] as const
}

/** Turnos asignados dentro de un rango de fechas, en tiempo real: mismo
 * patrón que `useStaffList` — `queryFn` da la carga inicial (loading/error)
 * y el `onSnapshot` mantiene la cache al día mientras el rango esté
 * montado. */
export function useCuadranteRange(restauranteId: string | null, fechaDesde: string, fechaHasta: string) {
  const queryClient = useQueryClient()
  const queryKey = cuadranteRangeKey(restauranteId, fechaDesde, fechaHasta)

  useEffect(() => {
    if (!restauranteId) return

    return turnoAsignadoRepository.subscribeRange(restauranteId, fechaDesde, fechaHasta, (turnos) => {
      queryClient.setQueryData(queryKey, turnos)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `queryKey` se deriva de las mismas deps
  }, [restauranteId, fechaDesde, fechaHasta, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => turnoAsignadoRepository.getRange(restauranteId!, fechaDesde, fechaHasta),
    enabled: Boolean(restauranteId),
  })
}
