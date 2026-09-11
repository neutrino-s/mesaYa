import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fichajeRepository } from '../data/fichajeRepository'
import { fichajesDiaKey } from './useFichajesDia'

export function useFicharSalida(restauranteId: string | null, fecha: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fichajeId: string) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return fichajeRepository.ficharSalida(restauranteId, fichajeId)
    },
    onSuccess: () => {
      toast.success('Salida fichada.')
      queryClient.invalidateQueries({ queryKey: fichajesDiaKey(restauranteId, fecha) })
    },
    onError: () => {
      toast.error('No pudimos fichar la salida. Probá de nuevo.')
    },
  })
}
