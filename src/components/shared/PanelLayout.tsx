import { ChangePasswordModal } from '@/features/staff/components/ChangePasswordModal'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'

import { PanelAnimatedOutlet } from './PanelAnimatedOutlet'
import { PanelBottomNav } from './PanelBottomNav'
import { PanelHeader } from './PanelHeader'
import { PanelSidebar } from './PanelSidebar'

/** Layout del panel autenticado: header fijo arriba, sidebar en desktop
 * junto al contenido, y la barra de navegación inferior siempre presente
 * abajo (en todos los tamaños de pantalla, como en el modelo). La barra
 * inferior vive dentro de la misma columna que `main` (no debajo del
 * sidebar) para que su centrado quede alineado con el contenido visible, no
 * con el ancho total de la pantalla. Es también el único punto de montaje de
 * las pantallas autenticadas, así que acá se bloquea todo el panel con
 * `ChangePasswordModal` mientras el staff logueado no haya cambiado su
 * contraseña provisoria. */
export function PanelLayout() {
  const { data: myStaff } = useMyStaff()

  return (
    <div className="flex h-dvh flex-col bg-background">
      <PanelHeader />
      <div className="flex flex-1 overflow-hidden">
        <PanelSidebar className="hidden lg:flex" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex flex-1 flex-col overflow-y-auto">
            <PanelAnimatedOutlet />
          </main>
          <PanelBottomNav />
        </div>
      </div>
      <ChangePasswordModal
        open={myStaff?.debeCambiarPassword === true}
        restauranteId={myStaff?.restauranteId ?? null}
      />
    </div>
  )
}
