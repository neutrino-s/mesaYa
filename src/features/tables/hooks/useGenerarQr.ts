import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { mesaRepository } from '../data/mesaRepository'
import { mesasDeSalonKey } from './useMesasDeSalon'

interface GenerarQrInput {
  mesaId: string
  /** Token que se reemplaza, si ya había uno (regenerar). `null` cuando se
   * genera por primera vez. */
  qrTokenAnterior: string | null
}

export function useGenerarQr(restauranteId: string | null, salonId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mesaId, qrTokenAnterior }: GenerarQrInput) => {
      if (!restauranteId || !salonId) throw new Error('No se pudo identificar el salón.')
      return mesaRepository.generarQr(restauranteId, salonId, mesaId, qrTokenAnterior)
    },
    onSuccess: (_data, { qrTokenAnterior }) => {
      toast.success(qrTokenAnterior ? 'Código QR regenerado.' : 'Código QR generado.')
      queryClient.invalidateQueries({ queryKey: mesasDeSalonKey(restauranteId, salonId) })
    },
    onError: () => {
      toast.error('No pudimos generar el código QR. Probá de nuevo.')
    },
  })
}
