import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { staffRepository } from '../data/staffRepository'
import type { StaffFormValues } from '../domain/types'

export function useUpdateStaff(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffId, input }: { staffId: string; input: StaffFormValues }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return staffRepository.update(restauranteId, staffId, input)
    },
    onSuccess: () => {
      toast.success('Datos del colaborador actualizados.')
      queryClient.invalidateQueries({ queryKey: ['staff', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos guardar los cambios. Probá de nuevo.')
    },
  })
}
