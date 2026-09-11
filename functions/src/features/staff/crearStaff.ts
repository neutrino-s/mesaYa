import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'
import { adminAuth, db } from '../../lib/admin'
import { staffIndexRef, staffRef } from '../../lib/firestoreRefs'
import { crearStaffRequestSchema } from './types'
import type { CrearStaffResponse } from './types'

/**
 * Callable que da de alta a un colaborador del staff: crea su cuenta de
 * Firebase Auth con una contraseña provisoria (el email del form es su
 * usuario de login) y el doc en `restaurantes/{restauranteId}/staff/{uid}`,
 * con `debeCambiarPassword: true` — la interfaz lo bloquea con un modal
 * hasta que la cambie en su primer login. Solo el admin activo del
 * restaurante puede invocarla; el cliente nunca crea staff (salvo su propia
 * autoalta al registrarse) ni cuentas de Auth ajenas directamente.
 */
export const crearStaff = onCall(async (request: CallableRequest<unknown>): Promise<CrearStaffResponse> => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debés iniciar sesión para dar de alta un colaborador.')
  }

  const parsed = crearStaffRequestSchema.safeParse(request.data)
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Revisá los datos del colaborador: falta algo o hay un formato inválido.')
  }
  const { restauranteId, nombre, email, telefono, direccion, rol, turno, password } = parsed.data

  const callerSnap = await staffRef(restauranteId, request.auth.uid).get()
  const callerStaff = callerSnap.exists ? callerSnap.data() : undefined
  if (!callerStaff || callerStaff.estado !== 'activo' || callerStaff.rol !== 'administrador') {
    throw new HttpsError('permission-denied', 'Solo un administrador activo del restaurante puede dar de alta colaboradores.')
  }

  let uid: string
  try {
    const userRecord = await adminAuth.createUser({ email, password, displayName: nombre })
    uid = userRecord.uid
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya existe una cuenta con ese correo electrónico.')
    }
    if (code === 'auth/invalid-password') {
      throw new HttpsError('invalid-argument', 'La contraseña provisoria no es válida.')
    }
    throw new HttpsError('internal', 'No pudimos crear la cuenta del colaborador.')
  }

  try {
    const batch = db.batch()
    batch.set(staffRef(restauranteId, uid), {
      id: uid,
      restauranteId,
      nombre,
      email,
      telefono,
      direccion,
      rol,
      turno,
      estado: 'activo',
      authUid: uid,
      debeCambiarPassword: true,
      createdAt: FieldValue.serverTimestamp(),
    })
    batch.set(staffIndexRef(uid), { restauranteId })
    await batch.commit()
  } catch {
    await adminAuth.deleteUser(uid).catch(() => {})
    throw new HttpsError('internal', 'No pudimos guardar los datos del colaborador.')
  }

  return { staffId: uid }
})
