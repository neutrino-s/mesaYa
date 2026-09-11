import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { salonRepository } from '../data/salonRepository'
import type { SalonFormValues } from '../domain/types'

export function useCreateSalon(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SalonFormValues) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return salonRepository.create(restauranteId, input)
    },
    onSuccess: () => {
      toast.success('Salón agregado.')
      queryClient.invalidateQueries({ queryKey: ['salones', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos agregar el salón. Probá de nuevo.')
    },
  })
}
