import { collection, doc } from 'firebase/firestore'
import type { CollectionReference, DocumentReference } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { restauranteConverter } from '@/types/restaurante'
import type { Restaurante } from '@/types/restaurante'
import { salonConverter } from '@/types/salon'
import type { Salon } from '@/types/salon'
import { mesaConverter } from '@/types/mesa'
import type { Mesa } from '@/types/mesa'
import { cartaSeccionConverter } from '@/types/cartaSeccion'
import type { CartaSeccion } from '@/types/cartaSeccion'
import { cartaProductoConverter } from '@/types/cartaProducto'
import type { CartaProducto } from '@/types/cartaProducto'
import { staffConverter } from '@/types/staff'
import type { Staff } from '@/types/staff'
import { asignacionConverter } from '@/types/asignacion'
import type { Asignacion } from '@/types/asignacion'
import { qrCodeConverter } from '@/types/qrCode'
import type { QrCode } from '@/types/qrCode'
import { reservaConverter } from '@/types/reserva'
import type { Reserva } from '@/types/reserva'
import { pedidoConverter } from '@/types/pedido'
import type { Pedido } from '@/types/pedido'
import { turnoAsignadoConverter } from '@/types/turnoAsignado'
import type { TurnoAsignado } from '@/types/turnoAsignado'
import { fichajeConverter } from '@/types/fichaje'
import type { Fichaje } from '@/types/fichaje'
import { solicitudConverter } from '@/types/solicitud'
import type { Solicitud } from '@/types/solicitud'
import { notificacionConverter } from '@/types/notificacion'
import type { Notificacion } from '@/types/notificacion'

/**
 * Estructura de colecciones/subcolecciones en Firestore:
 *
 * restaurantes/{restauranteId}                                 -> Restaurante
 * restaurantes/{restauranteId}/salones/{salonId}                -> Salon
 * restaurantes/{restauranteId}/salones/{salonId}/mesas/{mesaId} -> Mesa
 * restaurantes/{restauranteId}/cartaSecciones/{seccionId}       -> CartaSeccion
 * restaurantes/{restauranteId}/cartaProductos/{productoId}      -> CartaProducto
 * restaurantes/{restauranteId}/asignaciones/{asignacionId}      -> Asignacion
 * restaurantes/{restauranteId}/reservas/{reservaId}             -> Reserva
 * restaurantes/{restauranteId}/pedidos/{pedidoId}               -> Pedido
 * restaurantes/{restauranteId}/turnosAsignados/{turnoId}        -> TurnoAsignado
 * restaurantes/{restauranteId}/fichajes/{fichajeId}              -> Fichaje
 * restaurantes/{restauranteId}/solicitudes/{solicitudId}         -> Solicitud
 * restaurantes/{restauranteId}/notificaciones/{notificacionId}   -> Notificacion
 * restaurantes/{restauranteId}/staff/{authUid}                  -> Staff (el id del doc es el uid de Firebase Auth)
 * staffIndex/{authUid}                                          -> { restauranteId } (ver types/staff.ts)
 * qrCodes/{qrToken}                                              -> QrCode
 *
 * Estas funciones son el único punto que arma las referencias tipadas
 * (con `withConverter`) hacia cada colección/subcolección. Las capas
 * `data/` de cada feature las usan en vez de llamar a `collection()`/`doc()`
 * directamente con strings sueltos.
 */

export function restaurantesRef(): CollectionReference<Restaurante> {
  return collection(db, 'restaurantes').withConverter(restauranteConverter)
}

export function restauranteRef(restauranteId: string): DocumentReference<Restaurante> {
  return doc(db, 'restaurantes', restauranteId).withConverter(restauranteConverter)
}

export function salonesRef(restauranteId: string): CollectionReference<Salon> {
  return collection(db, 'restaurantes', restauranteId, 'salones').withConverter(salonConverter)
}

export function salonRef(restauranteId: string, salonId: string): DocumentReference<Salon> {
  return doc(db, 'restaurantes', restauranteId, 'salones', salonId).withConverter(salonConverter)
}

export function mesasRef(restauranteId: string, salonId: string): CollectionReference<Mesa> {
  return collection(db, 'restaurantes', restauranteId, 'salones', salonId, 'mesas').withConverter(mesaConverter)
}

export function mesaRef(restauranteId: string, salonId: string, mesaId: string): DocumentReference<Mesa> {
  return doc(db, 'restaurantes', restauranteId, 'salones', salonId, 'mesas', mesaId).withConverter(mesaConverter)
}

export function cartaSeccionesRef(restauranteId: string): CollectionReference<CartaSeccion> {
  return collection(db, 'restaurantes', restauranteId, 'cartaSecciones').withConverter(cartaSeccionConverter)
}

export function cartaSeccionRef(restauranteId: string, seccionId: string): DocumentReference<CartaSeccion> {
  return doc(db, 'restaurantes', restauranteId, 'cartaSecciones', seccionId).withConverter(cartaSeccionConverter)
}

export function cartaProductosRef(restauranteId: string): CollectionReference<CartaProducto> {
  return collection(db, 'restaurantes', restauranteId, 'cartaProductos').withConverter(cartaProductoConverter)
}

export function cartaProductoRef(restauranteId: string, productoId: string): DocumentReference<CartaProducto> {
  return doc(db, 'restaurantes', restauranteId, 'cartaProductos', productoId).withConverter(cartaProductoConverter)
}

export function asignacionesRef(restauranteId: string): CollectionReference<Asignacion> {
  return collection(db, 'restaurantes', restauranteId, 'asignaciones').withConverter(asignacionConverter)
}

export function asignacionRef(restauranteId: string, asignacionId: string): DocumentReference<Asignacion> {
  return doc(db, 'restaurantes', restauranteId, 'asignaciones', asignacionId).withConverter(asignacionConverter)
}

export function reservasRef(restauranteId: string): CollectionReference<Reserva> {
  return collection(db, 'restaurantes', restauranteId, 'reservas').withConverter(reservaConverter)
}

export function reservaRef(restauranteId: string, reservaId: string): DocumentReference<Reserva> {
  return doc(db, 'restaurantes', restauranteId, 'reservas', reservaId).withConverter(reservaConverter)
}

export function pedidosRef(restauranteId: string): CollectionReference<Pedido> {
  return collection(db, 'restaurantes', restauranteId, 'pedidos').withConverter(pedidoConverter)
}

export function pedidoRef(restauranteId: string, pedidoId: string): DocumentReference<Pedido> {
  return doc(db, 'restaurantes', restauranteId, 'pedidos', pedidoId).withConverter(pedidoConverter)
}

export function turnosAsignadosRef(restauranteId: string): CollectionReference<TurnoAsignado> {
  return collection(db, 'restaurantes', restauranteId, 'turnosAsignados').withConverter(turnoAsignadoConverter)
}

export function turnoAsignadoRef(restauranteId: string, turnoId: string): DocumentReference<TurnoAsignado> {
  return doc(db, 'restaurantes', restauranteId, 'turnosAsignados', turnoId).withConverter(turnoAsignadoConverter)
}

export function fichajesRef(restauranteId: string): CollectionReference<Fichaje> {
  return collection(db, 'restaurantes', restauranteId, 'fichajes').withConverter(fichajeConverter)
}

export function fichajeRef(restauranteId: string, fichajeId: string): DocumentReference<Fichaje> {
  return doc(db, 'restaurantes', restauranteId, 'fichajes', fichajeId).withConverter(fichajeConverter)
}

export function solicitudesRef(restauranteId: string): CollectionReference<Solicitud> {
  return collection(db, 'restaurantes', restauranteId, 'solicitudes').withConverter(solicitudConverter)
}

export function solicitudRef(restauranteId: string, solicitudId: string): DocumentReference<Solicitud> {
  return doc(db, 'restaurantes', restauranteId, 'solicitudes', solicitudId).withConverter(solicitudConverter)
}

export function notificacionesRef(restauranteId: string): CollectionReference<Notificacion> {
  return collection(db, 'restaurantes', restauranteId, 'notificaciones').withConverter(notificacionConverter)
}

export function notificacionRef(restauranteId: string, notificacionId: string): DocumentReference<Notificacion> {
  return doc(db, 'restaurantes', restauranteId, 'notificaciones', notificacionId).withConverter(notificacionConverter)
}

export function staffColRef(restauranteId: string): CollectionReference<Staff> {
  return collection(db, 'restaurantes', restauranteId, 'staff').withConverter(staffConverter)
}

export function staffRef(restauranteId: string, staffId: string): DocumentReference<Staff> {
  return doc(db, 'restaurantes', restauranteId, 'staff', staffId).withConverter(staffConverter)
}

/** `staffIndex/{uid} -> { restauranteId }`: colección raíz auxiliar e
 * inmutable para resolver "a qué restaurante pertenezco" sin conocer el
 * `restauranteId` de antemano (ver nota en `types/staff.ts`). Sin converter:
 * es un único campo plano, no un documento de dominio. */
export function staffIndexRef(uid: string): DocumentReference<{ restauranteId: string }> {
  return doc(db, 'staffIndex', uid) as DocumentReference<{ restauranteId: string }>
}

export function qrCodesRef(): CollectionReference<QrCode> {
  return collection(db, 'qrCodes').withConverter(qrCodeConverter)
}

export function qrCodeRef(qrToken: string): DocumentReference<QrCode> {
  return doc(db, 'qrCodes', qrToken).withConverter(qrCodeConverter)
}
