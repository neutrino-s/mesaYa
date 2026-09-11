import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Solicitud } from '@/types/solicitud'

import { parseFechaId } from '../domain/cuadranteRules'
import { estadoSolicitudBadgeClasses, estadoSolicitudLabel, tipoSolicitudLabel } from '../domain/solicitudRules'
import { useCancelarSolicitud } from '../hooks/useCancelarSolicitud'

interface MisSolicitudesListProps {
  restauranteId: string | null
  staffId: string | null
  solicitudes: Solicitud[]
}

function rangoLabel(solicitud: Solicitud): string {
  const desde = format(parseFechaId(solicitud.fechaDesde), 'd MMM', { locale: es })
  if (solicitud.fechaDesde === solicitud.fechaHasta) return desde
  const hasta = format(parseFechaId(solicitud.fechaHasta), 'd MMM yyyy', { locale: es })
  return `${desde} – ${hasta}`
}

/** Historial propio, cualquier estado — el empleado puede retirar un pedido
 * mientras siga `pendiente` (ver `firestore.rules`). */
export function MisSolicitudesList({ restauranteId, staffId, solicitudes }: MisSolicitudesListProps) {
  const cancelar = useCancelarSolicitud(restauranteId, staffId)
  // `createdAt` puede llegar `null` un instante: es un `serverTimestamp()`
  // todavía no confirmado por el servidor en la escritura optimista local
  // (pasa justo después de crear la propia solicitud). Tratarlo como "lo más
  // nuevo" (en vez de `Date.now()`, impuro durante el render) evita un
  // crash mientras se resuelve.
  const ordenadas = [...solicitudes].sort(
    (a, b) => (b.createdAt?.toMillis() ?? Infinity) - (a.createdAt?.toMillis() ?? Infinity),
  )

  if (ordenadas.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no enviaste ninguna solicitud.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {ordenadas.map((solicitud) => (
        <li key={solicitud.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{tipoSolicitudLabel(solicitud.tipo)}</p>
              <p className="text-xs text-muted-foreground">{rangoLabel(solicitud)}</p>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-medium',
                estadoSolicitudBadgeClasses(solicitud.estado),
              )}
            >
              {estadoSolicitudLabel(solicitud.estado)}
            </span>
          </div>
          <p className="text-sm text-foreground">{solicitud.motivo}</p>
          {solicitud.estado === 'rechazada' && solicitud.respuestaAdmin ? (
            <p className="text-xs text-muted-foreground">Motivo del rechazo: {solicitud.respuestaAdmin}</p>
          ) : null}
          {solicitud.estado === 'pendiente' ? (
            <button
              type="button"
              onClick={() => cancelar.mutate(solicitud.id)}
              disabled={cancelar.isPending}
              className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-destructive hover:underline disabled:opacity-60"
            >
              <X size={14} />
              Retirar solicitud
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
