import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cartaProductoRepository } from '../data/cartaProductoRepository'

interface SetCartaProductoAgotadoInput {
  productoId: string
  agotado: boolean
}

export function useSetCartaProductoAgotado(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productoId, agotado }: SetCartaProductoAgotadoInput) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return cartaProductoRepository.setAgotado(restauranteId, productoId, agotado)
    },
    onSuccess: (_data, { agotado }) => {
      toast.success(agotado ? 'Plato marcado como agotado.' : 'Plato marcado como disponible.')
      queryClient.invalidateQueries({ queryKey: ['cartaProductos', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos actualizar el plato. Probá de nuevo.')
    },
  })
}
