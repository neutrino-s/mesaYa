import type { Staff } from '../../../types/staff'

/**
 * Un staff puede quedar como mozo actual de una mesa solo si es un mozo
 * activo del mismo restaurante al que pertenece la mesa.
 */
export function esMozoAsignable(staff: Staff | undefined, restauranteId: string): boolean {
  return staff !== undefined && staff.rol === 'mozo' && staff.estado === 'activo' && staff.restauranteId === restauranteId
}
