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
import type { CartaSeccion } from '@/types/cartaSeccion'

import { cartaSeccionSchema, type CartaSeccionFormSchema } from '../domain/cartaSeccionSchema'
import { useCreateCartaSeccion } from '../hooks/useCreateCartaSeccion'
import { useUpdateCartaSeccion } from '../hooks/useUpdateCartaSeccion'

const EMPTY_VALUES: CartaSeccionFormSchema = { nombre: '' }

interface CartaSeccionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  /** Sección a editar; `null`/`undefined` da de alta una nueva. */
  seccion?: CartaSeccion | null
}

export function CartaSeccionFormDialog({
  open,
  onOpenChange,
  restauranteId,
  seccion,
}: CartaSeccionFormDialogProps) {
  const isEditing = Boolean(seccion)
  const createSeccion = useCreateCartaSeccion(restauranteId)
  const updateSeccion = useUpdateCartaSeccion(restauranteId)
  const submitting = createSeccion.isPending || updateSeccion.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CartaSeccionFormSchema>({
    resolver: zodResolver(cartaSeccionSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    reset(seccion ? { nombre: seccion.nombre } : EMPTY_VALUES)
  }, [open, seccion, reset])

  async function onSubmit(values: CartaSeccionFormSchema) {
    if (isEditing && seccion) {
      await updateSeccion.mutateAsync({ seccionId: seccion.id, input: values })
    } else {
      await createSeccion.mutateAsync(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar sección' : 'Nueva sección'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualizá el nombre de la sección.'
              : 'Ej. Entradas, Platos principales, Bebidas, Vinos.'}
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
                'Agregar sección'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
