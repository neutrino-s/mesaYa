import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { solicitudRepository } from '../data/solicitudRepository'

export function misSolicitudesKey(restauranteId: string | null, staffId: string | null) {
  return ['solicitudes', 'mias', restauranteId, staffId] as const
}

/** Solicitudes propias (cualquier estado), en tiempo real. */
export function useMisSolicitudes(restauranteId: string | null, staffId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = misSolicitudesKey(restauranteId, staffId)

  useEffect(() => {
    if (!restauranteId || !staffId) return

    return solicitudRepository.subscribeMias(restauranteId, staffId, (solicitudes) => {
      queryClient.setQueryData(queryKey, solicitudes)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `queryKey` se deriva de las mismas deps
  }, [restauranteId, staffId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => solicitudRepository.getMias(restauranteId!, staffId!),
    enabled: Boolean(restauranteId && staffId),
  })
}
