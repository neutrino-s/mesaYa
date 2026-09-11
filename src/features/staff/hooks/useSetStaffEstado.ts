import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { staffRepository } from '../data/staffRepository'
import type { EstadoStaff } from '@/types/staff'

export function useSetStaffEstado(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffId, estado }: { staffId: string; estado: EstadoStaff }) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return staffRepository.setEstado(restauranteId, staffId, estado)
    },
    onSuccess: (_data, { estado }) => {
      toast.success(estado === 'activo' ? 'Colaborador reactivado.' : 'Colaborador dado de baja.')
      queryClient.invalidateQueries({ queryKey: ['staff', 'list', restauranteId] })
    },
    onError: () => {
      toast.error('No pudimos actualizar el estado. Probá de nuevo.')
    },
  })
}
