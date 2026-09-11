import type { TipoNegocio } from '@/types/restaurante'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  initials: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/** Datos para dar de alta un restaurante nuevo: crea la cuenta de Firebase
 * Auth del dueño y, junto con ella, el restaurante y su primer miembro de
 * staff (rol `administrador`). */
export interface RegisterRestaurantInput {
  nombreRestaurante: string
  tipoNegocio: TipoNegocio
  sucursales: number
  direccion: string
  telefono: string
  nombreAdmin: string
  telefonoContacto: string
  email: string
  password: string
}
