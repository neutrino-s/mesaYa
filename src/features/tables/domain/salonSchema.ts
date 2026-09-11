import { z } from 'zod'

// Mismo patrón que `staffSchema.ts`.
export const salonSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingresá el nombre del salón.'),
  descripcion: z.string().trim().max(280, 'La descripción es muy larga.'),
})

export type SalonFormSchema = z.infer<typeof salonSchema>
