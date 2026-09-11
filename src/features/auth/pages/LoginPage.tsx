import { Navigate } from 'react-router-dom'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { BREAKPOINTS } from '@/lib/breakpoints'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/authStore'

import { BrandPanel } from '../components/BrandPanel'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const status = useAuthStore((state) => state.status)
  const isExpanded = useMediaQuery(`(min-width: ${BREAKPOINTS.expanded}px)`)

  if (status === 'signedIn') {
    return <Navigate to={paths.panel} replace />
  }

  // Debajo de 1024px el panel de marca no entra al costado: pasa a ser una
  // banda arriba, más baja, y el formulario va debajo, con scroll propio.
  if (isExpanded) {
    return (
      <div className="grid min-h-dvh grid-cols-5 bg-auth-canvas">
        <BrandPanel className="col-span-2" />
        <div className="col-span-3 flex items-center justify-center overflow-y-auto px-8 py-12">
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-auth-canvas">
      <BrandPanel compact className="h-[300px] shrink-0" />
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <LoginForm />
      </div>
    </div>
  )
}
