import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { salonRepository } from '../data/salonRepository'
import type { SalonFormValues } from '../domain/types'

export function useUpdateSalon(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ salonId, input }: { salonId: string; input: SalonFormValues }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return salonRepository.update(restauranteId, salonId, input)
    },
    onSuccess: () => {
      toast.success('Datos del salón actualizados.')
      queryClient.invalidateQueries({ queryKey: ['salones', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos guardar los cambios. Probá de nuevo.')
    },
  })
}
