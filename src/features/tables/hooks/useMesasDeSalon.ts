import { useQuery } from '@tanstack/react-query'

import { mesaRepository } from '../data/mesaRepository'

function mesasDeSalonKey(restauranteId: string | null, salonId: string | null) {
  return ['mesas', 'list', restauranteId, salonId] as const
}

/** Mesas de un salón, para cargar el lienzo. Deliberadamente **sin**
 * realtime (`onSnapshot`): el lienzo es una sesión de edición de un solo
 * admin con guardado explícito — sincronizar por snapshot mientras se
 * arrastra pisaría el estado local en edición. Se invalida tras un
 * `saveLayout` exitoso para releer el estado canónico. */
export function useMesasDeSalon(restauranteId: string | null, salonId: string | null) {
  return useQuery({
    queryKey: mesasDeSalonKey(restauranteId, salonId),
    queryFn: () => mesaRepository.getList(restauranteId!, salonId!),
    enabled: Boolean(restauranteId) && Boolean(salonId),
  })
}

export { mesasDeSalonKey }
