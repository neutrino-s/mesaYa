import { useQuery } from '@tanstack/react-query'

import { salonRepository } from '../data/salonRepository'

/** El salón puntual del lienzo (nombre para el header, etc). */
export function useSalon(restauranteId: string | null, salonId: string | null) {
  return useQuery({
    queryKey: ['salones', 'byId', restauranteId, salonId],
    queryFn: () => salonRepository.getById(restauranteId!, salonId!),
    enabled: Boolean(restauranteId) && Boolean(salonId),
  })
}
