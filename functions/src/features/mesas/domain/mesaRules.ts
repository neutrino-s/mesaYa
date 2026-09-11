import type { EstadoMesa } from '../../../types/mesa'
import type { RolStaff, Staff } from '../../../types/staff'

/** Un walk-in solo puede iniciar sobre una mesa libre. */
export function puedeIniciarWalkIn(estado: EstadoMesa): boolean {
  return estado === 'libre'
}

/** Solo se libera una mesa que está ocupada. */
export function puedeLiberarMesa(estado: EstadoMesa): boolean {
  return estado === 'ocupada'
}

const ROLES_QUE_PUEDEN_LIBERAR_MESA: readonly RolStaff[] = ['mozo', 'administrador']

/**
 * El staff que libera la mesa debe ser quien dice ser (su `authUid` debe
 * coincidir con el caller autenticado — el `staffId` viaja en el payload
 * pero no alcanza por sí solo para autorizar), estar activo, pertenecer al
 * restaurante de la mesa y tener rol mozo o administrador.
 */
export function esStaffAutorizadoParaLiberarMesa(
  staff: Staff | undefined,
  restauranteId: string,
  callerAuthUid: string,
): boolean {
  return (
    staff !== undefined &&
    staff.authUid === callerAuthUid &&
    staff.estado === 'activo' &&
    staff.restauranteId === restauranteId &&
    ROLES_QUE_PUEDEN_LIBERAR_MESA.includes(staff.rol)
  )
}
