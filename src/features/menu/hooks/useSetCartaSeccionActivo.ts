import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaSeccionRepository } from '../data/cartaSeccionRepository'

export function useSetCartaSeccionActivo(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ seccionId, activo }: { seccionId: string; activo: boolean }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaSeccionRepository.setActivo(restauranteId, seccionId, activo)
    },
    onSuccess: (_data, { activo }) => {
      toast.success(activo ? 'Sección reactivada.' : 'Sección dada de baja.')
      queryClient.invalidateQueries({ queryKey: ['cartaSecciones', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos actualizar la sección. Probá de nuevo.')
    },
  })
}
