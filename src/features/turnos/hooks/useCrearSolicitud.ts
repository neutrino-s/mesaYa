import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { solicitudRepository } from '../data/solicitudRepository'
import type { SolicitudFormSchema } from '../domain/solicitudSchema'
import { misSolicitudesKey } from './useMisSolicitudes'

export function useCrearSolicitud(restauranteId: string | null, staffId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SolicitudFormSchema) => {
      if (!restauranteId || !staffId) throw new Error('No se pudo identificar al empleado.')
      return solicitudRepository.crear(restauranteId, staffId, input)
    },
    onSuccess: () => {
      toast.success('Solicitud enviada.')
      queryClient.invalidateQueries({ queryKey: misSolicitudesKey(restauranteId, staffId) })
    },
    onError: () => {
      toast.error('No pudimos enviar la solicitud. Probá de nuevo.')
    },
  })
}
