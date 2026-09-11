import { useState } from 'react'

import { useAuthStore } from '@/stores/authStore'

import { registerRepository } from '../data/registerRepository'
import { firebaseErrorCode, mapAuthErrorCode } from '../domain/authRules'
import type { RegisterFormValues } from '../domain/registerSchema'

/** Estado y acciones de la pantalla de registro. Único puente entre el
 * formulario y `registerRepository`. */
export function useRegister() {
  const setUser = useAuthStore((state) => state.setUser)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(values: RegisterFormValues): Promise<boolean> {
    setSubmitting(true)
    setError(null)
    try {
      const user = await registerRepository.registerRestaurant({
        ...values,
        sucursales: Number(values.sucursales),
      })
      setUser(user)
      return true
    } catch (err) {
      setError(mapAuthErrorCode(firebaseErrorCode(err)))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  function clearError() {
    setError(null)
  }

  return { submit, submitting, error, clearError }
}
