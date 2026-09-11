import {
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'

import { auth } from '@/lib/firebase'

import { deriveDisplayNameFromEmail, deriveInitials } from '../domain/authRules'
import type { AppUser, LoginCredentials } from '../domain/types'

/** Mismo shape que un `FirebaseError`, para que `mapAuthErrorCode` lo trate
 * igual sin que el dominio tenga que conocer el SDK de Firebase. */
const notConfiguredError = { code: 'app/not-configured' }

function toAppUser(user: FirebaseUser): AppUser {
  const displayName = user.displayName ?? deriveDisplayNameFromEmail(user.email ?? '')
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName,
    initials: deriveInitials(displayName),
  }
}

// Única puerta a Firebase Auth. La UI y los hooks nunca importan `firebase/auth`
// directo, solo este archivo.
export const authRepository = {
  async signIn({ email, password }: LoginCredentials): Promise<AppUser> {
    if (!auth) throw notConfiguredError

    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    )
    return toAppUser(credential.user)
  },

  async signUp({
    email,
    password,
    displayName,
  }: {
    email: string
    password: string
    displayName: string
  }): Promise<AppUser> {
    if (!auth) throw notConfiguredError

    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    )
    await updateProfile(credential.user, { displayName })
    return toAppUser(credential.user)
  },

  /** Deshace un alta a medio terminar (p. ej. si después falla la escritura
   * en Firestore), para no dejar cuentas de Auth huérfanas sin restaurante. */
  deleteCurrentUser(): Promise<void> {
    if (!auth?.currentUser) return Promise.resolve()
    return deleteUser(auth.currentUser)
  },

  /** Usada en el modal de cambio de contraseña obligatorio del primer
   * login: cambia la contraseña de la sesión actual (no requiere el flujo
   * de "olvidé mi contraseña" porque el usuario ya está autenticado con la
   * provisoria). */
  changePassword(newPassword: string): Promise<void> {
    if (!auth?.currentUser) return Promise.reject(notConfiguredError)

    return updatePassword(auth.currentUser, newPassword)
  },

  sendPasswordReset(email: string): Promise<void> {
    if (!auth) return Promise.reject(notConfiguredError)

    return sendPasswordResetEmail(auth, email.trim())
  },

  signOut(): Promise<void> {
    if (!auth) return Promise.resolve()

    return firebaseSignOut(auth)
  },

  /** Se suscribe al estado de sesión de Firebase. Devuelve la función para
   * desuscribirse. */
  watchAuthState(onChange: (user: AppUser | null) => void): () => void {
    if (!auth) {
      onChange(null)
      return () => {}
    }

    return onAuthStateChanged(auth, (user) => {
      onChange(user ? toAppUser(user) : null)
    })
  },
}
