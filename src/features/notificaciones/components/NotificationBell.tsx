import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, CalendarCheck, CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import type { Notificacion } from '@/types/notificacion'

import { contarNoLeidas, ordenarPorFecha } from '../domain/notificacionRules'
import { useMarcarNotificacionLeida } from '../hooks/useMarcarNotificacionLeida'
import { useMarcarTodasLeidas } from '../hooks/useMarcarTodasLeidas'
import { useNotificaciones } from '../hooks/useNotificaciones'

interface NotificationBellProps {
  restauranteId: string | null
  staffId: string | null
}

function iconoDe(tipo: Notificacion['tipo']) {
  return tipo === 'solicitud_creada' ? CalendarClock : CalendarCheck
}

/** Campana de notificaciones del header — hoy solo cubre el ciclo de vida
 * de `Solicitud` (ver `docs/database-schema.md#notificación`): nueva
 * solicitud para quien gestiona el cuadrante, resolución para quien la
 * pidió. Click en un ítem marca esa notificación como leída y lleva a
 * Jornadas › Solicitudes. */
export function NotificationBell({ restauranteId, staffId }: NotificationBellProps) {
  const { data } = useNotificaciones(restauranteId, staffId)
  const marcarLeida = useMarcarNotificacionLeida(restauranteId)
  const marcarTodas = useMarcarTodasLeidas(restauranteId)

  const notificaciones = ordenarPorFecha(data ?? [])
  const noLeidas = contarNoLeidas(notificaciones)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {noLeidas > 0 ? (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-medium text-foreground">Notificaciones</span>
          {noLeidas > 0 ? (
            <button
              type="button"
              className="text-xs text-primary outline-none hover:underline focus-visible:underline"
              onClick={(event) => {
                event.preventDefault()
                marcarTodas.mutate(notificaciones)
              }}
            >
              Marcar todas como leídas
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-80 overflow-y-auto p-1">
          {notificaciones.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No tenés notificaciones.</p>
          ) : (
            notificaciones.map((notificacion) => {
              const Icon = iconoDe(notificacion.tipo)
              return (
                <DropdownMenuItem key={notificacion.id} asChild className="items-start whitespace-normal">
                  <Link
                    to={`${paths.panelTurnos}?tab=solicitudes`}
                    onClick={() => {
                      if (!notificacion.leida) marcarLeida.mutate(notificacion.id)
                    }}
                  >
                    <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn('text-sm text-foreground', !notificacion.leida && 'font-medium')}>
                        {notificacion.mensaje}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notificacion.createdAt.toDate(), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    {!notificacion.leida ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /> : null}
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
