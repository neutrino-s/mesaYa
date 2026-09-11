import { useEffect } from 'react'

import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'
import { useAuthStore } from '@/stores/authStore'

import { authRepository } from '../data/authRepository'

export type SessionBootstrapStatus = 'validating' | 'ready' | 'invalid'

/** Se usa en `SplashPage`, entre el login y el panel: resuelve el doc de
 * staff del usuario (valida que su cuenta esté vinculada a un restaurante) y
 * precarga el restaurante en la cache de React Query, para que el panel
 * entre con los datos ya listos en vez de mostrar sus propios loaders.
 * Si el usuario no tiene doc de staff (cuenta huérfana), cierra la sesión. */
export function useSessionBootstrap(): SessionBootstrapStatus {
  const staffQuery = useMyStaff()
  const { restaurante, isLoading: isLoadingRestaurante } = useMyRestaurante()
  const setUser = useAuthStore((state) => state.setUser)

  const invalid = staffQuery.isSuccess && staffQuery.data === null

  useEffect(() => {
    if (!invalid) return
    authRepository.signOut().then(() => setUser(null))
  }, [invalid, setUser])

  if (invalid) return 'invalid'
  if (!staffQuery.isSuccess || isLoadingRestaurante || !restaurante) return 'validating'
  return 'ready'
}
