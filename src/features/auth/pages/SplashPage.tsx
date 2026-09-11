import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { paths } from '@/routes/paths'

import { SplashLogo } from '../components/SplashLogo'
import { useSessionBootstrap } from '../hooks/useSessionBootstrap'

/** Puerta entre el login y el panel: valida la sesión (doc de staff +
 * restaurante) y deja esos datos precargados en cache mientras el usuario ve
 * una animación, en vez de que esa carga se note recién adentro del panel. */
export function SplashPage() {
  const status = useSessionBootstrap()

  useEffect(() => {
    if (status !== 'invalid') return
    toast.error('Tu cuenta no está vinculada a ningún restaurante. Contactá al administrador.')
  }, [status])

  if (status === 'invalid') return <Navigate to={paths.login} replace />
  if (status === 'ready') return <Navigate to={paths.panel} replace />

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-br from-auth-gradient-start to-auth-gradient-end px-6">
      <SplashLogo />
      <p className="text-[15px] text-white/75">Preparando tu panel…</p>
    </div>
  )
}
