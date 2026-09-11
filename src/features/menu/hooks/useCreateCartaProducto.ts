import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaProductoRepository } from '../data/cartaProductoRepository'
import type { CartaProductoFormValues } from '../domain/types'

interface CreateCartaProductoInput {
  seccionId: string
  values: CartaProductoFormValues
  imagenFile: File | null
}

export function useCreateCartaProducto(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ seccionId, values, imagenFile }: CreateCartaProductoInput) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaProductoRepository.create(restauranteId, seccionId, values, imagenFile)
    },
    onSuccess: () => {
      toast.success('Plato agregado.')
      queryClient.invalidateQueries({ queryKey: ['cartaProductos', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos agregar el plato. Probá de nuevo.')
    },
  })
}
