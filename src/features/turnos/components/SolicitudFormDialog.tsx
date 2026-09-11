import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { fechaId } from '../domain/cuadranteRules'
import { TIPO_SOLICITUD_OPTIONS } from '../domain/solicitudRules'
import { solicitudSchema, type SolicitudFormSchema } from '../domain/solicitudSchema'
import { useCrearSolicitud } from '../hooks/useCrearSolicitud'

interface SolicitudFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  staffId: string | null
}

function emptyValues(): SolicitudFormSchema {
  const hoy = fechaId(new Date())
  return { tipo: 'dia_libre', fechaDesde: hoy, fechaHasta: hoy, motivo: '' }
}

/** Alta de una solicitud — siempre sobre uno mismo, cualquier rol. No
 * incluye "cambio de turno": eso se conversa en vivo con el encargado, no
 * queda modelado como pedido (ver `types/solicitud.ts`). */
export function SolicitudFormDialog({ open, onOpenChange, restauranteId, staffId }: SolicitudFormDialogProps) {
  const crearSolicitud = useCrearSolicitud(restauranteId, staffId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SolicitudFormSchema>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (open) reset(emptyValues())
  }, [open, reset])

  const tipo = useWatch({ control, name: 'tipo' })
  const fechaDesde = useWatch({ control, name: 'fechaDesde' })
  const esDiaLibre = tipo === 'dia_libre'

  useEffect(() => {
    if (esDiaLibre) setValue('fechaHasta', fechaDesde)
  }, [esDiaLibre, fechaDesde, setValue])

  async function onSubmit(values: SolicitudFormSchema) {
    await crearSolicitud.mutateAsync(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva solicitud</DialogTitle>
          <DialogDescription>
            Pedí un día libre, vacaciones o una licencia — tu encargado la revisa y vas a ver el resultado acá mismo.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo" aria-invalid={Boolean(errors.tipo)}>
                    <SelectValue placeholder="Elegí un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_SOLICITUD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fechaDesde">{esDiaLibre ? 'Fecha' : 'Desde'}</Label>
              <Input
                id="fechaDesde"
                type="date"
                aria-invalid={Boolean(errors.fechaDesde)}
                {...register('fechaDesde')}
              />
              {errors.fechaDesde ? (
                <p className="text-xs text-destructive">{errors.fechaDesde.message}</p>
              ) : null}
            </div>
            {!esDiaLibre ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="fechaHasta">Hasta</Label>
                <Input
                  id="fechaHasta"
                  type="date"
                  aria-invalid={Boolean(errors.fechaHasta)}
                  {...register('fechaHasta')}
                />
                {errors.fechaHasta ? (
                  <p className="text-xs text-destructive">{errors.fechaHasta.message}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea id="motivo" rows={3} aria-invalid={Boolean(errors.motivo)} {...register('motivo')} />
            {errors.motivo ? <p className="text-xs text-destructive">{errors.motivo.message}</p> : null}
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={crearSolicitud.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={crearSolicitud.isPending}>
              {crearSolicitud.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
