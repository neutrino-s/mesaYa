import { useQuery } from '@tanstack/react-query'

import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'

import { restauranteRepository } from '../data/restauranteRepository'

/** Datos del restaurante del usuario con sesión iniciada (nombre, tipo de
 * negocio, dirección). Lo consumen el header del panel y la pantalla de
 * Inicio. */
export function useMyRestaurante() {
  const { restauranteId, isLoading: isLoadingId } = useMyRestauranteId()

  const query = useQuery({
    queryKey: ['restaurante', restauranteId],
    queryFn: () => restauranteRepository.getById(restauranteId!),
    enabled: Boolean(restauranteId),
    staleTime: Infinity,
  })

  return { restaurante: query.data ?? null, isLoading: isLoadingId || query.isPending }
}
