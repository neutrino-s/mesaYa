import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { notificacionRepository } from '../data/notificacionRepository'

export function notificacionesKey(restauranteId: string | null, staffId: string | null) {
  return ['notificaciones', restauranteId, staffId] as const
}

/** Notificaciones propias (campana del header), en tiempo real. */
export function useNotificaciones(restauranteId: string | null, staffId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = notificacionesKey(restauranteId, staffId)

  useEffect(() => {
    if (!restauranteId || !staffId) return

    return notificacionRepository.subscribeMias(restauranteId, staffId, (notificaciones) => {
      queryClient.setQueryData(queryKey, notificaciones)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `queryKey` se deriva de las mismas deps
  }, [restauranteId, staffId, queryClient])

  return useQuery({
    queryKey,
    queryFn: () => notificacionRepository.getMias(restauranteId!, staffId!),
    enabled: Boolean(restauranteId && staffId),
  })
}
