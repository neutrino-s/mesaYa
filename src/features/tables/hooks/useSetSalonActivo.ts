import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { salonRepository } from '../data/salonRepository'

export function useSetSalonActivo(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ salonId, activo }: { salonId: string; activo: boolean }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return salonRepository.setActivo(restauranteId, salonId, activo)
    },
    onSuccess: (_data, { activo }) => {
      toast.success(activo ? 'Salón reactivado.' : 'Salón dado de baja.')
      queryClient.invalidateQueries({ queryKey: ['salones', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos actualizar el salón. Probá de nuevo.')
    },
  })
}
