import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Solicitud } from '@/types/solicitud'

import { solicitudRepository } from '../data/solicitudRepository'
import { misSolicitudesKey } from './useMisSolicitudes'
import { solicitudesPendientesKey } from './useSolicitudesPendientes'

export function useRechazarSolicitud(restauranteId: string | null, resueltoPor: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ solicitud, respuestaAdmin }: { solicitud: Solicitud; respuestaAdmin: string }) => {
      if (!restauranteId || !resueltoPor) throw new Error('No se pudo identificar al responsable.')
      return solicitudRepository.rechazar(restauranteId, solicitud, resueltoPor, respuestaAdmin)
    },
    onSuccess: (_data, { solicitud }) => {
      toast.success('Solicitud rechazada.')
      queryClient.invalidateQueries({ queryKey: solicitudesPendientesKey(restauranteId) })
      queryClient.invalidateQueries({ queryKey: misSolicitudesKey(restauranteId, solicitud.staffId) })
    },
    onError: () => {
      toast.error('No pudimos rechazar la solicitud. Probá de nuevo.')
    },
  })
}
