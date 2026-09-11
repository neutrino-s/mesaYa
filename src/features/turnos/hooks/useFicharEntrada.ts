import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fichajeRepository } from '../data/fichajeRepository'
import { fichajesDiaKey } from './useFichajesDia'

export function useFicharEntrada(restauranteId: string | null, fecha: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffId, turnoAsignadoId }: { staffId: string; turnoAsignadoId: string | null }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return fichajeRepository.ficharEntrada(restauranteId, staffId, fecha, turnoAsignadoId)
    },
    onSuccess: () => {
      toast.success('Entrada fichada.')
      queryClient.invalidateQueries({ queryKey: fichajesDiaKey(restauranteId, fecha) })
    },
    onError: () => {
      toast.error('No pudimos fichar la entrada. Probá de nuevo.')
    },
  })
}
