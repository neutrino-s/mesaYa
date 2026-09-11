import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Mesa } from '@/types/mesa'

import { mesaRepository } from '../data/mesaRepository'
import { diffLayout, type MesaLayoutItem } from '../domain/mesaLayoutRules'
import { mesasDeSalonKey } from './useMesasDeSalon'

interface SaveSalonLayoutInput {
  original: Mesa[]
  current: MesaLayoutItem[]
}

export function useSaveSalonLayout(restauranteId: string | null, salonId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ original, current }: SaveSalonLayoutInput) => {
      if (!restauranteId || !salonId) throw new Error('No se pudo identificar el salón.')
      return mesaRepository.saveLayout(restauranteId, salonId, diffLayout(original, current))
    },
    onSuccess: () => {
      toast.success('Diseño guardado.')
      queryClient.invalidateQueries({ queryKey: mesasDeSalonKey(restauranteId, salonId) })
    },
    onError: () => {
      toast.error('No pudimos guardar el diseño. Probá de nuevo.')
    },
  })
}
