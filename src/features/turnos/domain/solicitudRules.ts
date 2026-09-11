// Lógica pura de solicitudes: sin React, sin Firebase. Se prueba sola.

import type { EstadoSolicitud, Solicitud, TipoSolicitud } from '@/types/solicitud'
import type { TurnoAsignado } from '@/types/turnoAsignado'

export const TIPO_SOLICITUD_OPTIONS: { value: TipoSolicitud; label: string }[] = [
  { value: 'dia_libre', label: 'Día libre' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'licencia', label: 'Licencia' },
]

export function tipoSolicitudLabel(tipo: TipoSolicitud): string {
  return TIPO_SOLICITUD_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo
}

export const ESTADO_SOLICITUD_OPTIONS: { value: EstadoSolicitud; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
]

export function estadoSolicitudLabel(estado: EstadoSolicitud): string {
  return ESTADO_SOLICITUD_OPTIONS.find((option) => option.value === estado)?.label ?? estado
}

export function estadoSolicitudBadgeClasses(estado: EstadoSolicitud): string {
  switch (estado) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
    case 'aprobada':
      return 'bg-primary/10 text-primary'
    case 'rechazada':
      return 'bg-destructive/10 text-destructive'
  }
}

/** Mensaje de la notificación que recibe quien gestiona el cuadrante
 * (administrador/encargado) al crearse una solicitud nueva. */
export function mensajeSolicitudCreada(nombreSolicitante: string, tipo: TipoSolicitud): string {
  return `${nombreSolicitante} solicitó ${tipoSolicitudLabel(tipo).toLowerCase()}.`
}

/** Mensaje de la notificación que recibe el empleado cuando su solicitud
 * se resuelve. */
export function mensajeSolicitudResuelta(tipo: TipoSolicitud, estado: Exclude<EstadoSolicitud, 'pendiente'>): string {
  const accion = estado === 'aprobada' ? 'aprobada' : 'rechazada'
  return `Tu solicitud de ${tipoSolicitudLabel(tipo).toLowerCase()} fue ${accion}.`
}

/** Turnos del empleado que caen dentro de `[fechaDesde, fechaHasta]` de la
 * solicitud — lo que una aprobación cancela. Se usa tanto para el preview en
 * la cola de aprobación como para la cancelación real (`solicitudRepository.aprobar`). */
export function turnosAfectados(
  turnos: TurnoAsignado[],
  solicitud: Pick<Solicitud, 'staffId' | 'fechaDesde' | 'fechaHasta'>,
): TurnoAsignado[] {
  return turnos.filter(
    (turno) =>
      turno.staffId === solicitud.staffId &&
      turno.fecha >= solicitud.fechaDesde &&
      turno.fecha <= solicitud.fechaHasta,
  )
}
