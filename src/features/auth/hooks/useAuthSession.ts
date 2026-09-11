import { useEffect } from 'react'

import { useAuthStore } from '@/stores/authStore'

import { authRepository } from '../data/authRepository'

/** Se llama una sola vez, en la raíz de la app: mantiene el store de sesión
 * sincronizado con el estado real de Firebase Auth. */
export function useAuthSession() {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    return authRepository.watchAuthState(setUser)
  }, [setUser])
}
