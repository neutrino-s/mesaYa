import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { mesaRepository } from '../data/mesaRepository'
import { mesasDeSalonKey } from './useMesasDeSalon'

interface EliminarQrInput {
  mesaId: string
  qrToken: string
}

export function useEliminarQr(restauranteId: string | null, salonId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mesaId, qrToken }: EliminarQrInput) => {
      if (!restauranteId || !salonId) throw new Error('No se pudo identificar el salón.')
      return mesaRepository.eliminarQr(restauranteId, salonId, mesaId, qrToken)
    },
    onSuccess: () => {
      toast.success('Código QR eliminado.')
      queryClient.invalidateQueries({ queryKey: mesasDeSalonKey(restauranteId, salonId) })
    },
    onError: () => {
      toast.error('No pudimos eliminar el código QR. Probá de nuevo.')
    },
  })
}
