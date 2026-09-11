import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { solicitudRepository } from '../data/solicitudRepository'

export function solicitudesPendientesKey(restauranteId: string | null) {
  return ['solicitudes', 'pendientes', restauranteId] as const
}

/** Cola de aprobación (solo quien gestiona el cuadrante llega a esta query,
 * ver `firestore.rules`), en tiempo real. */
export function useSolicitudesPendientes(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = solicitudesPendientesKey(restauranteId)

  useEffect(() => {
    if (!restauranteId) return

    return solicitudRepository.subscribePendientes(restauranteId, (solicitudes) => {
      queryClient.setQueryData(queryKey, solicitudes)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `queryKey` se deriva de las mismas deps
  }, [restauranteId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => solicitudRepository.getPendientes(restauranteId!),
    enabled: Boolean(restauranteId),
  })
}
