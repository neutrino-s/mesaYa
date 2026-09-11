import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaSeccionRepository } from '../data/cartaSeccionRepository'
import type { CartaSeccionFormValues } from '../domain/types'

export function useCreateCartaSeccion(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CartaSeccionFormValues) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaSeccionRepository.create(restauranteId, input)
    },
    onSuccess: () => {
      toast.success('Sección agregada.')
      queryClient.invalidateQueries({ queryKey: ['cartaSecciones', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos agregar la sección. Probá de nuevo.')
    },
  })
}
