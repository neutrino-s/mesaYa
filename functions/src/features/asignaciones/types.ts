import { z } from 'zod'

export const asignarMozoAMesaRequestSchema = z.object({
  restauranteId: z.string().min(1),
  salonId: z.string().min(1),
  mesaId: z.string().min(1),
  // Sin `.min(1)` en el array: una mesa puede tener más de un mozo a la
  // vez, y una lista vacía es "desasignar a todos" (caso válido).
  mozoIds: z.array(z.string().min(1)),
})

export type AsignarMozoAMesaRequest = z.infer<typeof asignarMozoAMesaRequestSchema>

export interface AsignarMozoAMesaResponse {
  restauranteId: string
  mesaId: string
  mozoIds: string[]
}
