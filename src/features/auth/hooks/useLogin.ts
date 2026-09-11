import { useState } from 'react'

import { useAuthStore } from '@/stores/authStore'

import { authRepository } from '../data/authRepository'
import { firebaseErrorCode, mapAuthErrorCode } from '../domain/authRules'
import type { LoginCredentials } from '../domain/types'

/** Estado y acciones de la pantalla de ingreso. Es el único puente entre el
 * formulario y `authRepository`. */
export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(credentials: LoginCredentials): Promise<boolean> {
    setSubmitting(true)
    setError(null)
    try {
      const user = await authRepository.signIn(credentials)
      setUser(user)
      return true
    } catch (err) {
      setError(mapAuthErrorCode(firebaseErrorCode(err)))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  /** Devuelve `null` si salió bien, o el mensaje de error para mostrar. */
  async function resetPassword(email: string): Promise<string | null> {
    try {
      await authRepository.sendPasswordReset(email)
      return null
    } catch (err) {
      return mapAuthErrorCode(firebaseErrorCode(err))
    }
  }

  function clearError() {
    setError(null)
  }

  return { submit, submitting, error, clearError, resetPassword }
}
