import { z } from 'zod'

// Mismo patrón y mismos mensajes que la validación del panel Flutter
// (features/auth/ui/login_controller.dart), para que el ingreso se sienta
// igual en las dos plataformas.
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu correo electrónico.')
    .regex(emailPattern, 'Revisá el correo, parece incompleto.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu correo electrónico.')
    .regex(emailPattern, 'Revisá el correo, parece incompleto.'),
})
