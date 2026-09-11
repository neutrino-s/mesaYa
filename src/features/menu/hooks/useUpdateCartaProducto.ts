import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaProductoRepository } from '../data/cartaProductoRepository'
import type { CartaProductoFormValues } from '../domain/types'

interface UpdateCartaProductoInput {
  productoId: string
  values: CartaProductoFormValues
  imagenFile: File | null
  imagenUrlActual: string | null
}

export function useUpdateCartaProducto(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productoId, values, imagenFile, imagenUrlActual }: UpdateCartaProductoInput) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaProductoRepository.update(restauranteId, productoId, values, imagenFile, imagenUrlActual)
    },
    onSuccess: () => {
      toast.success('Plato actualizado.')
      queryClient.invalidateQueries({ queryKey: ['cartaProductos', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos guardar los cambios. Probá de nuevo.')
    },
  })
}
