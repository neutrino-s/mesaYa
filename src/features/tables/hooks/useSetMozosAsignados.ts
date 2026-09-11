import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { mesaRepository } from '../data/mesaRepository'
import { mesasDeSalonKey } from './useMesasDeSalon'

interface SetMozosAsignadosInput {
  mesaId: string
  mozoIds: string[]
}

export function useSetMozosAsignados(restauranteId: string | null, salonId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mesaId, mozoIds }: SetMozosAsignadosInput) => {
      if (!restauranteId || !salonId) throw new Error('No se pudo identificar el salón.')
      return mesaRepository.setMozosAsignados(restauranteId, salonId, mesaId, mozoIds)
    },
    onSuccess: () => {
      toast.success('Mozos asignados actualizados.')
      queryClient.invalidateQueries({ queryKey: mesasDeSalonKey(restauranteId, salonId) })
    },
    onError: () => {
      toast.error('No pudimos actualizar los mozos asignados. Probá de nuevo.')
    },
  })
}
