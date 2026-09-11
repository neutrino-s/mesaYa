import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authRepository } from '@/features/auth/data/authRepository'
import { useAuthStore } from '@/stores/authStore'

import { staffRepository } from '../data/staffRepository'

/** Cambio de contraseña obligatorio del primer login: cambia la contraseña
 * en Firebase Auth y apaga `debeCambiarPassword` en el doc de staff, para
 * que `ChangePasswordModal` deje de bloquear el panel. */
export function useChangePassword(restauranteId: string | null) {
  const queryClient = useQueryClient()
  const uid = useAuthStore((state) => state.user?.uid)

  return useMutation({
    mutationFn: async (newPassword: string) => {
      if (!restauranteId || !uid) throw new Error('No se pudo identificar la sesión.')
      await authRepository.changePassword(newPassword)
      await staffRepository.markPasswordChanged(restauranteId, uid)
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada.')
      queryClient.invalidateQueries({ queryKey: ['staff', 'me', uid] })
    },
    onError: () => {
      toast.error('No pudimos cambiar la contraseña. Probá de nuevo.')
    },
  })
}
