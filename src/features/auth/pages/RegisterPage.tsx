import { Navigate } from 'react-router-dom'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { BREAKPOINTS } from '@/lib/breakpoints'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/authStore'

import { BrandPanel } from '../components/BrandPanel'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const status = useAuthStore((state) => state.status)
  const isExpanded = useMediaQuery(`(min-width: ${BREAKPOINTS.expanded}px)`)

  if (status === 'signedIn') {
    return <Navigate to={paths.panel} replace />
  }

  // El wordmark del fieldset tiene que aparecer en la misma posición que en
  // `LoginPage`, sin importar en qué paso del wizard esté (cada paso tiene
  // una altura distinta). Por eso se ancla arriba (`items-start` + padding-top
  // fijo) en vez de centrarse: centrar reubicaría el logo según la altura del
  // contenido de cada paso, que es justo el efecto "saltón" que se quiere evitar.
  if (isExpanded) {
    return (
      <div className="grid min-h-dvh grid-cols-5 bg-auth-canvas">
        <BrandPanel className="col-span-2" />
        <div className="col-span-3 flex items-start justify-center overflow-y-auto px-8 pt-24 pb-12">
          <RegisterForm />
        </div>
      </div>
    )
  }

  // Debajo de 1024px no hay lugar para la banda de marca de `LoginPage` sin
  // forzar scroll (el registro tiene muchos más campos), así que se omite y
  // el wizard usa toda la pantalla. El wordmark no queda a la misma altura
  // exacta que en el login, pero sí mantiene el mismo tamaño y una posición
  // fija arriba de la pantalla en los 4 pasos.
  return (
    <div className="flex min-h-dvh items-start justify-center overflow-y-auto bg-auth-canvas px-8 pt-10 pb-4">
      <RegisterForm />
    </div>
  )
}
