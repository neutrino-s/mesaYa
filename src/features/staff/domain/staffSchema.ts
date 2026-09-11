import { z } from 'zod'

import { ROL_OPTIONS, TURNO_OPTIONS } from './staffRules'

// Mismo patrón de correo/teléfono que el resto de la app (ver `registerSchema`
// en el feature de auth), duplicado acá para no acoplar un feature al otro.
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const phonePattern = /^[0-9+\-\s()]{6,}$/

const rolValues = ROL_OPTIONS.map((option) => option.value) as [
  (typeof ROL_OPTIONS)[number]['value'],
  ...(typeof ROL_OPTIONS)[number]['value'][],
]

const turnoValues = TURNO_OPTIONS.map((option) => option.value) as [
  (typeof TURNO_OPTIONS)[number]['value'],
  ...(typeof TURNO_OPTIONS)[number]['value'][],
]

export const staffSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingresá el nombre completo.'),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá el correo electrónico.')
    .regex(emailPattern, 'Revisá el correo, parece incompleto.'),
  telefono: z
    .string()
    .trim()
    .min(1, 'Ingresá un teléfono de contacto.')
    .regex(phonePattern, 'Revisá el teléfono, parece incompleto.'),
  direccion: z.string().trim().min(1, 'Ingresá la dirección.'),
  rol: z.enum(rolValues, { message: 'Elegí un rol.' }),
  turno: z.enum(turnoValues, { message: 'Elegí un turno.' }),
  // Vacío = sin tope cargado (mismo criterio que `capacidad` en `MesaEditDialog`).
  horasSemanalesContrato: z
    .string()
    .trim()
    .regex(/^$|^[1-9]\d*(\.\d+)?$/, 'Ingresá un número mayor a 0, o dejalo vacío.'),
})

export type StaffFormSchema = z.infer<typeof staffSchema>

// El email del colaborador es también su usuario de login (Firebase Auth es
// email/password): el alta pide además una contraseña provisoria, que la
// interfaz lo va a obligar a cambiar en su primer ingreso.
export const staffCreateSchema = staffSchema
  .extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Repetí la contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type StaffCreateFormSchema = z.infer<typeof staffCreateSchema>
