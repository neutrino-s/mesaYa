import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaProductoRepository } from '../data/cartaProductoRepository'

export function useDeleteCartaProducto(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productoId: string) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaProductoRepository.delete(restauranteId, productoId)
    },
    onSuccess: () => {
      toast.success('Plato eliminado.')
      queryClient.invalidateQueries({ queryKey: ['cartaProductos', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos eliminar el plato. Probá de nuevo.')
    },
  })
}
