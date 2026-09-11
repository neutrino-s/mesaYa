import {
  Clock,
  LineChart,
  Megaphone,
  Package,
  ShoppingBag,
  Table2,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { to: paths.panelPedidos, label: 'Pedidos', icon: ShoppingBag },
      { to: paths.panelMesas, label: 'Mesas', icon: Table2 },
      { to: paths.panelStock, label: 'Stock', icon: Package },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: paths.panelReportes, label: 'Reportes', icon: LineChart },
      { to: paths.panelPromociones, label: 'Promociones', icon: Megaphone },
      { to: paths.panelTurnos, label: 'Jornadas', icon: Clock },
    ],
  },
]

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent text-accent-foreground'
      : 'text-foreground/80 hover:bg-accent/10 hover:text-accent',
  )
}

/** Navegación principal del panel en desktop: sidebar fija con los accesos
 * secundarios (los más usados viven en `PanelBottomNav`, siempre visible),
 * agrupados en secciones con encabezado. En mobile queda oculta. */
export function PanelSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-4 py-6',
        className,
      )}
    >
      <nav className="flex flex-1 flex-col gap-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <span className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {section.label}
            </span>
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClasses}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
