import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Notificacion } from '@/types/notificacion'

import { notificacionRepository } from '../data/notificacionRepository'

export function useMarcarTodasLeidas(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificaciones: Notificacion[]) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return notificacionRepository.marcarTodasLeidas(restauranteId, notificaciones)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', restauranteId] })
    },
  })
}
