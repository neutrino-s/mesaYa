import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RolStaff } from '@/types/staff'

import { turnoAsignadoRepository } from '../data/turnoAsignadoRepository'
import type { TurnoAsignadoFormSchema } from '../domain/cuadranteSchema'

export function useUpdateTurnoAsignado(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      turnoId,
      rol,
      input,
    }: {
      turnoId: string
      rol: RolStaff
      input: TurnoAsignadoFormSchema
    }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return turnoAsignadoRepository.update(restauranteId, turnoId, rol, input)
    },
    onSuccess: () => {
      toast.success('Turno actualizado.')
      queryClient.invalidateQueries({ queryKey: ['turnosAsignados', 'range', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos actualizar el turno. Probá de nuevo.')
    },
  })
}
