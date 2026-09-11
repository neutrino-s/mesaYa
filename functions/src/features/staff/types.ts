import { z } from 'zod'

export const crearStaffRequestSchema = z.object({
  restauranteId: z.string().min(1),
  nombre: z.string().min(1),
  email: z.string().min(1),
  telefono: z.string().min(1),
  direccion: z.string().min(1),
  rol: z.enum(['administrador', 'mozo', 'cocinero', 'bartender', 'recepcionista', 'cajero', 'encargado']),
  turno: z.enum(['mañana', 'tarde', 'noche', 'rotativo']),
  password: z.string().min(6),
})

export type CrearStaffRequest = z.infer<typeof crearStaffRequestSchema>

export interface CrearStaffResponse {
  staffId: string
}
