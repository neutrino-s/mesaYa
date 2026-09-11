import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { solicitudRepository } from '../data/solicitudRepository'
import { misSolicitudesKey } from './useMisSolicitudes'

export function useCancelarSolicitud(restauranteId: string | null, staffId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (solicitudId: string) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return solicitudRepository.cancelar(restauranteId, solicitudId)
    },
    onSuccess: () => {
      toast.success('Solicitud retirada.')
      queryClient.invalidateQueries({ queryKey: misSolicitudesKey(restauranteId, staffId) })
    },
    onError: () => {
      toast.error('No pudimos retirar la solicitud. Probá de nuevo.')
    },
  })
}
