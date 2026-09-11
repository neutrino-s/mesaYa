import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { salonRepository } from '../data/salonRepository'

function salonesListKey(restauranteId: string | null) {
  return ['salones', 'list', restauranteId] as const
}

/** Lista de salones de un restaurante, en tiempo real (mismo patrón que
 * `useStaffList`). */
export function useSalonesList(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = salonesListKey(restauranteId)

  useEffect(() => {
    if (!restauranteId) return

    return salonRepository.subscribeList(restauranteId, (salones) => {
      queryClient.setQueryData(salonesListKey(restauranteId), salones)
    })
  }, [restauranteId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => salonRepository.getList(restauranteId!),
    enabled: Boolean(restauranteId),
  })
}
