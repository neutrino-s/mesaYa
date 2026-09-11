import { z } from 'zod'

export const liberarMesaRequestSchema = z.object({
  restauranteId: z.string().min(1),
  salonId: z.string().min(1),
  mesaId: z.string().min(1),
  staffId: z.string().min(1),
})

export type LiberarMesaRequest = z.infer<typeof liberarMesaRequestSchema>

export interface LiberarMesaResponse {
  restauranteId: string
  mesaId: string
}

export interface RegistrarPrimeraCompraParams {
  restauranteId: string
  salonId: string
  mesaId: string
  pedidoId: string
}
