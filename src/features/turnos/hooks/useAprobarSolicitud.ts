import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Solicitud } from '@/types/solicitud'

import { solicitudRepository } from '../data/solicitudRepository'
import { misSolicitudesKey } from './useMisSolicitudes'
import { solicitudesPendientesKey } from './useSolicitudesPendientes'

export function useAprobarSolicitud(restauranteId: string | null, resueltoPor: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (solicitud: Solicitud) => {
      if (!restauranteId || !resueltoPor) throw new Error('No se pudo identificar al responsable.')
      return solicitudRepository.aprobar(restauranteId, solicitud, resueltoPor)
    },
    onSuccess: (_data, solicitud) => {
      toast.success('Solicitud aprobada. El cuadrante ya quedó actualizado.')
      queryClient.invalidateQueries({ queryKey: solicitudesPendientesKey(restauranteId) })
      queryClient.invalidateQueries({ queryKey: misSolicitudesKey(restauranteId, solicitud.staffId) })
      queryClient.invalidateQueries({ queryKey: ['turnosAsignados', 'range', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos aprobar la solicitud. Probá de nuevo.')
    },
  })
}
