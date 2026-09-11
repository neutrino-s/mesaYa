import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Salon } from '@/types/salon'

import { salonSchema, type SalonFormSchema } from '../domain/salonSchema'
import { useCreateSalon } from '../hooks/useCreateSalon'
import { useUpdateSalon } from '../hooks/useUpdateSalon'

const EMPTY_VALUES: SalonFormSchema = {
  nombre: '',
  descripcion: '',
}

interface SalonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  /** Salón a editar; `null`/`undefined` da de alta uno nuevo. */
  salon?: Salon | null
}

export function SalonFormDialog({
  open,
  onOpenChange,
  restauranteId,
  salon,
}: SalonFormDialogProps) {
  const isEditing = Boolean(salon)
  const createSalon = useCreateSalon(restauranteId)
  const updateSalon = useUpdateSalon(restauranteId)
  const submitting = createSalon.isPending || updateSalon.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalonFormSchema>({
    resolver: zodResolver(salonSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    reset(
      salon
        ? { nombre: salon.nombre, descripcion: salon.descripcion }
        : EMPTY_VALUES,
    )
  }, [open, salon, reset])

  async function onSubmit(values: SalonFormSchema) {
    if (isEditing && salon) {
      await updateSalon.mutateAsync({ salonId: salon.id, input: values })
    } else {
      await createSalon.mutateAsync(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar salón' : 'Nuevo salón'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualizá el nombre y la descripción del salón.'
              : 'Cargá los datos para dar de alta un nuevo salón.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              aria-invalid={Boolean(errors.nombre)}
              {...register('nombre')}
            />
            {errors.nombre ? (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              aria-invalid={Boolean(errors.descripcion)}
              {...register('descripcion')}
            />
            {errors.descripcion ? (
              <p className="text-xs text-destructive">{errors.descripcion.message}</p>
            ) : null}
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEditing ? (
                'Guardar cambios'
              ) : (
                'Agregar salón'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
