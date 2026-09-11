import { useMutation } from '@tanstack/react-query'

import { authRepository } from '../data/authRepository'

/** Cierra la sesión actual. `useAuthSession` reacciona al cambio de estado
 * de Firebase y limpia el store; acá no hace falta tocarlo a mano. */
export function useSignOut() {
  return useMutation({ mutationFn: () => authRepository.signOut() })
}
