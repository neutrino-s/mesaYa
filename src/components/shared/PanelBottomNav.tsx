import { Armchair, BookOpen, Home, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const NAV_ITEMS = [
  { to: paths.panel, label: 'Inicio', icon: Home, end: true },
  { to: paths.panelStaff, label: 'Staff', icon: Users, end: false },
  { to: paths.panelCarta, label: 'Carta', icon: BookOpen, end: false },
  { to: paths.panelSalon, label: 'Salón', icon: Armchair, end: false },
] as const

/** Navegación principal del panel: barra fija abajo con las cuatro
 * secciones más usadas, siempre presente (junto a `PanelSidebar` en
 * desktop, sola en mobile), como en el modelo. */
export function PanelBottomNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'sticky bottom-0 z-10 shrink-0 border-t border-border bg-card shadow-md',
        className,
      )}
    >
      <div
        className="mx-auto flex max-w-2xl items-stretch justify-around py-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-1 text-xs font-medium"
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-primary group-hover:bg-secondary/70',
                  )}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={cn(
                    'truncate transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
