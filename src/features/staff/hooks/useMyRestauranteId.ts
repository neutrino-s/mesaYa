import { useMyStaff } from './useMyStaff'

/** Resuelve el `restauranteId` del usuario con sesión iniciada a partir de
 * su propio documento de staff. Lo consumen las pantallas del panel que
 * necesitan filtrar datos por restaurante. */
export function useMyRestauranteId() {
  const { data, isPending } = useMyStaff()

  return { restauranteId: data?.restauranteId ?? null, isLoading: isPending }
}
