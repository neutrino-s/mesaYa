import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notificacionRepository } from '../data/notificacionRepository'

/** Marca una notificación como leída al hacer click. Falla en silencio
 * (sin toast): es un detalle menor de estado de lectura, no una acción que
 * el usuario necesite confirmar. */
export function useMarcarNotificacionLeida(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificacionId: string) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return notificacionRepository.marcarLeida(restauranteId, notificacionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones', restauranteId] })
    },
  })
}
