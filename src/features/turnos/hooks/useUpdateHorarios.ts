import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { restauranteRepository } from '@/features/restaurant/data/restauranteRepository'
import type { HorariosRestaurante } from '@/types/restaurante'

export function useUpdateHorarios(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (horarios: HorariosRestaurante) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return restauranteRepository.updateHorarios(restauranteId, horarios)
    },
    onSuccess: () => {
      toast.success('Horarios guardados.')
      queryClient.invalidateQueries({ queryKey: ['restaurante', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos guardar los horarios. Probá de nuevo.')
    },
  })
}
