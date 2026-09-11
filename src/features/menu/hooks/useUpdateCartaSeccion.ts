import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaSeccionRepository } from '../data/cartaSeccionRepository'
import type { CartaSeccionFormValues } from '../domain/types'

export function useUpdateCartaSeccion(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ seccionId, input }: { seccionId: string; input: CartaSeccionFormValues }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaSeccionRepository.update(restauranteId, seccionId, input)
    },
    onSuccess: () => {
      toast.success('Sección actualizada.')
      queryClient.invalidateQueries({ queryKey: ['cartaSecciones', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos guardar los cambios. Probá de nuevo.')
    },
  })
}
