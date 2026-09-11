import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { EstadoTurnoAsignado } from '@/types/turnoAsignado'

import { turnoAsignadoRepository } from '../data/turnoAsignadoRepository'

/** Alterna `planificado`/`confirmado` — la marca visual de "cuadrante ya
 * publicado" (ver `types/turnoAsignado.ts`). */
export function useSetEstadoTurnoAsignado(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ turnoId, estado }: { turnoId: string; estado: EstadoTurnoAsignado }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return turnoAsignadoRepository.setEstado(restauranteId, turnoId, estado)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnosAsignados', 'range', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos actualizar el estado del turno. Probá de nuevo.')
    },
  })
}
