import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RolStaff } from '@/types/staff'

import { turnoAsignadoRepository } from '../data/turnoAsignadoRepository'
import type { TurnoAsignadoFormSchema } from '../domain/cuadranteSchema'

/** Alta de un turno. El listener de `useCuadranteRange` refleja el alta
 * solo; acá alcanza con invalidar por si la pantalla se vuelve a montar
 * antes de que llegue el primer snapshot (mismo criterio que `useCreateStaff`). */
export function useCreateTurnoAsignado(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ rol, input }: { rol: RolStaff; input: TurnoAsignadoFormSchema }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return turnoAsignadoRepository.create(restauranteId, rol, input)
    },
    onSuccess: () => {
      toast.success('Turno agregado al cuadrante.')
      queryClient.invalidateQueries({ queryKey: ['turnosAsignados', 'range', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos agregar el turno. Probá de nuevo.')
    },
  })
}
