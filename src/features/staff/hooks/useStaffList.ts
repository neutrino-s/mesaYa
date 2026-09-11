import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { staffRepository } from '../data/staffRepository'

function staffListKey(restauranteId: string | null) {
  return ['staff', 'list', restauranteId] as const
}

/** Lista de staff de un restaurante, en tiempo real: `queryFn` hace la
 * carga inicial (da estado de loading/error a React Query) y el
 * `onSnapshot` de abajo mantiene la cache al día mientras el componente
 * esté montado. */
export function useStaffList(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = staffListKey(restauranteId)

  useEffect(() => {
    if (!restauranteId) return

    return staffRepository.subscribeList(restauranteId, (staff) => {
      queryClient.setQueryData(staffListKey(restauranteId), staff)
    })
  }, [restauranteId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => staffRepository.getList(restauranteId!),
    enabled: Boolean(restauranteId),
  })
}
