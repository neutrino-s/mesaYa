import { ChevronDown, LogOut, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'

import logo from '@/assets/logo.svg'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSignOut } from '@/features/auth/hooks/useSignOut'
import { NotificationBell } from '@/features/notificaciones/components/NotificationBell'
import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'
import { rolLabel } from '@/features/staff/domain/staffRules'
import { useMyStaff } from '@/features/staff/hooks/useMyStaff'
import { TIPO_NEGOCIO_OPTIONS } from '@/types/restaurante'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/authStore'

function tipoNegocioLabel(tipo: string) {
  return TIPO_NEGOCIO_OPTIONS.find((option) => option.value === tipo)?.label
}

/** Header fijo del panel: marca del restaurante a la izquierda, sesión del
 * usuario a la derecha. Vive en todas las pantallas autenticadas, tanto
 * desktop (junto a `PanelSidebar`) como mobile (junto a `PanelBottomNav`). */
export function PanelHeader() {
  const user = useAuthStore((state) => state.user)
  const { data: myStaff } = useMyStaff()
  const { restaurante } = useMyRestaurante()
  const signOut = useSignOut()

  const subtitle = restaurante
    ? (tipoNegocioLabel(restaurante.tipoNegocio) ?? restaurante.direccion)
    : undefined

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <img src={logo} alt="MesaYa" className="size-10 shrink-0 select-none" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-heading text-base text-foreground">
            {restaurante?.nombre ?? 'MesaYa'}
          </span>
          {subtitle && (
            <span className="truncate text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationBell restauranteId={myStaff?.restauranteId ?? null} staffId={myStaff?.id ?? null} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex shrink-0 items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-9">
              <AvatarFallback>{user?.initials}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start sm:flex">
              <span className="text-sm font-medium text-foreground">
                {user?.displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {myStaff ? rolLabel(myStaff.rol) : ''}
              </span>
            </div>
            <ChevronDown size={16} className="hidden text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to={paths.panelPerfil}>
                <UserCog size={16} />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut.mutate()}>
              <LogOut size={16} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
