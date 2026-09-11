import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { turnoAsignadoRepository } from '../data/turnoAsignadoRepository'

export function useDeleteTurnoAsignado(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (turnoId: string) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return turnoAsignadoRepository.remove(restauranteId, turnoId)
    },
    onSuccess: () => {
      toast.success('Turno eliminado del cuadrante.')
      queryClient.invalidateQueries({ queryKey: ['turnosAsignados', 'range', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos eliminar el turno. Probá de nuevo.')
    },
  })
}
