import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '@/stores/authStore'

import { staffRepository } from '../data/staffRepository'

/** El documento de staff del usuario con sesión iniciada: de qué
 * restaurante es, su rol, etc. Lo consumen tanto las pantallas que
 * necesitan el `restauranteId` (ver `useMyRestauranteId`) como el header
 * del panel, que muestra el rol junto al nombre. */
export function useMyStaff() {
  const uid = useAuthStore((state) => state.user?.uid)

  return useQuery({
    queryKey: ['staff', 'me', uid],
    queryFn: () => staffRepository.getMyStaff(uid!),
    enabled: Boolean(uid),
    staleTime: Infinity,
  })
}
