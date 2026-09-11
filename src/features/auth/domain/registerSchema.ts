import { z } from 'zod'

import { TIPO_NEGOCIO_OPTIONS } from '@/types/restaurante'

// Mismo patrón de correo que `loginSchema`, para que los mensajes se lean
// igual en toda la app.
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const phonePattern = /^[0-9+\-\s()]{6,}$/

const tipoNegocioValues = TIPO_NEGOCIO_OPTIONS.map((option) => option.value) as [
  (typeof TIPO_NEGOCIO_OPTIONS)[number]['value'],
  ...(typeof TIPO_NEGOCIO_OPTIONS)[number]['value'][],
]

export const registerSchema = z
  .object({
    nombreRestaurante: z
      .string()
      .trim()
      .min(1, 'Ingresá el nombre de tu restaurante.'),
    tipoNegocio: z.enum(tipoNegocioValues, {
      message: 'Elegí el tipo de negocio.',
    }),
    sucursales: z
      .string()
      .trim()
      .min(1, 'Ingresá la cantidad de sucursales.')
      .regex(/^\d+$/, 'Ingresá solo números.'),
    direccion: z
      .string()
      .trim()
      .min(1, 'Ingresá la dirección del restaurante.'),
    telefono: z
      .string()
      .trim()
      .min(1, 'Ingresá el teléfono del restaurante.')
      .regex(phonePattern, 'Revisá el teléfono, parece incompleto.'),
    nombreAdmin: z.string().trim().min(1, 'Ingresá tu nombre completo.'),
    telefonoContacto: z
      .string()
      .trim()
      .min(1, 'Ingresá un teléfono de contacto.')
      .regex(phonePattern, 'Revisá el teléfono, parece incompleto.'),
    email: z
      .string()
      .trim()
      .min(1, 'Ingresá tu correo electrónico.')
      .regex(emailPattern, 'Revisá el correo, parece incompleto.'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Repetí la contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
