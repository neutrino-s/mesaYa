import { z } from 'zod'

// Mismo patrón que `salonSchema.ts`.
export const cartaSeccionSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingresá el nombre de la sección.'),
})

export type CartaSeccionFormSchema = z.infer<typeof cartaSeccionSchema>
