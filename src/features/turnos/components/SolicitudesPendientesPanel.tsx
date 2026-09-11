import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheck, Check, X } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StaffAvatar } from '@/features/staff/components/StaffAvatar'
import type { Solicitud } from '@/types/solicitud'
import type { Staff } from '@/types/staff'

import { parseFechaId } from '../domain/cuadranteRules'
import { tipoSolicitudLabel } from '../domain/solicitudRules'
import { useAprobarSolicitud } from '../hooks/useAprobarSolicitud'
import { useRechazarSolicitud } from '../hooks/useRechazarSolicitud'

interface SolicitudesPendientesPanelProps {
  restauranteId: string | null
  resueltoPor: string | null
  staff: Staff[]
  solicitudes: Solicitud[]
}

function rangoLabel(solicitud: Solicitud): string {
  const desde = format(parseFechaId(solicitud.fechaDesde), 'd MMM', { locale: es })
  if (solicitud.fechaDesde === solicitud.fechaHasta) return desde
  const hasta = format(parseFechaId(solicitud.fechaHasta), 'd MMM yyyy', { locale: es })
  return `${desde} – ${hasta}`
}

/** Cola de aprobación: solo quien gestiona el cuadrante llega acá (ver
 * `puedeGestionarTurnos`). Aprobar es un click directo — mismo criterio que
 * el resto del panel (sin confirmación extra); rechazar sí pide un motivo
 * breve para que el empleado entienda qué pasó. */
export function SolicitudesPendientesPanel({
  restauranteId,
  resueltoPor,
  staff,
  solicitudes,
}: SolicitudesPendientesPanelProps) {
  const aprobar = useAprobarSolicitud(restauranteId, resueltoPor)
  const rechazar = useRechazarSolicitud(restauranteId, resueltoPor)
  const [rechazando, setRechazando] = useState<Solicitud | null>(null)
  const [respuesta, setRespuesta] = useState('')

  const staffPorId = new Map(staff.map((member) => [member.id, member]))
  // `createdAt` puede llegar `null` un instante mientras el `serverTimestamp()`
  // de una solicitud recién creada todavía no vuelve confirmado del
  // servidor — tratarla como "lo más nuevo" la manda al final de la cola
  // (orden ascendente) sin necesitar `Date.now()`, impuro durante el render.
  const ordenadas = [...solicitudes].sort(
    (a, b) => (a.createdAt?.toMillis() ?? Infinity) - (b.createdAt?.toMillis() ?? Infinity),
  )

  function handleAbrirRechazo(solicitud: Solicitud) {
    setRechazando(solicitud)
    setRespuesta('')
  }

  async function handleConfirmarRechazo() {
    if (!rechazando) return
    await rechazar.mutateAsync({ solicitud: rechazando, respuestaAdmin: respuesta })
    setRechazando(null)
  }

  if (ordenadas.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No hay solicitudes pendientes"
        description="Cuando alguien del equipo pida un día libre, vacaciones o una licencia, aparece acá."
      />
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {ordenadas.map((solicitud) => {
          const empleado = staffPorId.get(solicitud.staffId)
          return (
            <li
              key={solicitud.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {empleado ? (
                  <StaffAvatar nombre={empleado.nombre} rol={empleado.rol} className="size-9 shrink-0" />
                ) : null}
                <div>
                  <p className="text-sm font-medium text-foreground">{empleado?.nombre ?? 'Empleado'}</p>
                  <p className="text-xs text-muted-foreground">
                    {tipoSolicitudLabel(solicitud.tipo)} · {rangoLabel(solicitud)}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{solicitud.motivo}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAbrirRechazo(solicitud)}
                  disabled={aprobar.isPending || rechazar.isPending}
                >
                  <X size={16} />
                  Rechazar
                </Button>
                <Button size="sm" onClick={() => aprobar.mutate(solicitud)} disabled={aprobar.isPending || rechazar.isPending}>
                  <Check size={16} />
                  Aprobar
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={Boolean(rechazando)} onOpenChange={(open) => !open && setRechazando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              {rechazando ? `${staffPorId.get(rechazando.staffId)?.nombre ?? 'El empleado'} va a ver este motivo.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="respuestaAdmin">Motivo (opcional)</Label>
            <Textarea
              id="respuestaAdmin"
              rows={3}
              value={respuesta}
              onChange={(event) => setRespuesta(event.target.value)}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setRechazando(null)} disabled={rechazar.isPending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmarRechazo} disabled={rechazar.isPending}>
              {rechazar.isPending ? 'Rechazando…' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
