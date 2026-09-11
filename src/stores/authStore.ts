import { create } from 'zustand'

import type { AppUser } from '@/features/auth/domain/types'

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

interface AuthState {
  user: AppUser | null
  status: AuthStatus
  setUser: (user: AppUser | null) => void
}

/** Quién está usando el panel. Se llena desde `useAuthSession`, que escucha
 * el estado real de Firebase Auth. Nadie más escribe acá. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
}))
