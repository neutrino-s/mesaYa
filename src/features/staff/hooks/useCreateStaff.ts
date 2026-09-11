import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FirebaseError } from 'firebase/app'
import { toast } from 'sonner'

import { staffRepository } from '../data/staffRepository'
import type { StaffFormValues } from '../domain/types'

function createStaffErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError && err.code === 'functions/already-exists') {
    return 'Ya existe una cuenta con ese correo electrónico.'
  }
  return 'No pudimos agregar al colaborador. Probá de nuevo.'
}

/** Alta de un nuevo colaborador. El listener de `useStaffList` refleja el
 * alta solo; acá alcanza con invalidar por si la pantalla se vuelve a
 * montar antes de que llegue el primer snapshot. */
export function useCreateStaff(restauranteId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: StaffFormValues) => {
      if (!restauranteId) throw new Error('No se pudo identificar el restaurante.')
      return staffRepository.create(restauranteId, input)
    },
    onSuccess: () => {
      toast.success('Colaborador agregado.')
      queryClient.invalidateQueries({ queryKey: ['staff', 'list', restauranteId] })
    },
    onError: (err) => {
      toast.error(createStaffErrorMessage(err))
    },
  })
}
