import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { mesaRepository } from '../data/mesaRepository'
import { mesasDeSalonKey } from './useMesasDeSalon'

/** Asigna uno o más mozos a todas las mesas de un salón de una sola vez —
 * atajo para no tener que abrir "Editar mesa" mesa por mesa; el resultado
 * final es el mismo (`Mesa.mozoIds` reemplazado en cada una). */
export function useAsignarMozosASalon(restauranteId: string | null, salonId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mozoIds: string[]) => {
      if (!restauranteId || !salonId) throw new Error('No se pudo identificar el salón.')
      return mesaRepository.asignarMozosASalon(restauranteId, salonId, mozoIds)
    },
    onSuccess: () => {
      toast.success('Mozos asignados a todas las mesas del salón.')
      queryClient.invalidateQueries({ queryKey: mesasDeSalonKey(restauranteId, salonId) })
    },
    onError: () => {
      toast.error('No pudimos asignar los mozos. Probá de nuevo.')
    },
  })
}
