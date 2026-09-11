import { zodResolver } from '@hookform/resolvers/zod'
import { QrCode, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { useStaffList } from '@/features/staff/hooks/useStaffList'
import type { Mesa } from '@/types/mesa'

import { MozoMultiSelect } from './MozoMultiSelect'
import { QrViewDialog } from './QrViewDialog'
import { useGenerarQr } from '../hooks/useGenerarQr'
import { useSetMozosAsignados } from '../hooks/useSetMozosAsignados'
import type { MesaLayoutItem } from '../domain/mesaLayoutRules'

// `capacidad` queda como string en el form (mismo patrón que `sucursales`
// en `registerSchema.ts`) para no pelear con el tipado de RHF+zod al
// coercionar números; se convierte a `number` recién en `onSubmit`.
const mesaEditSchema = z.object({
  numero: z.string().trim().min(1, 'Ingresá el número de mesa.'),
  capacidad: z
    .string()
    .trim()
    .min(1, 'Ingresá la capacidad.')
    .regex(/^[1-9]\d*$/, 'Ingresá un número entero mayor a 0.'),
})

type MesaEditFormValues = z.infer<typeof mesaEditSchema>

interface MesaEditDialogProps {
  item: MesaLayoutItem | null
  onOpenChange: (open: boolean) => void
  onSave: (localId: string, changes: { numero: string; capacidad: number }) => void
  onDelete: (localId: string) => void
  restauranteId: string | null
  salonId: string | null
  /** Mesa persistida en Firestore correspondiente a `item` (`null` si
   * todavía no se guardó el diseño, o no se encontró). El código QR y el
   * mozo asignado son campos del ciclo operativo — solo tienen sentido
   * sobre una mesa que ya existe. */
  mesa: Mesa | null
  /** Refresca el snapshot de mesas del lienzo tras generar el QR o
   * cambiar el mozo asignado (campos que se escriben directo a Firestore,
   * fuera del flujo de "Guardar diseño"). */
  onMesaOperationalChange: () => void
}

/** Edición rápida de una mesa ya colocada: número/capacidad solo actualizan
 * el estado local del lienzo (el guardado real lo hace "Guardar diseño" de
 * `SalonCanvasPage`). El código QR y el mozo asignado, en cambio, son
 * campos operativos — se escriben directo a Firestore al tocarlos, no
 * esperan al submit del form. */
export function MesaEditDialog({
  item,
  onOpenChange,
  onSave,
  onDelete,
  restauranteId,
  salonId,
  mesa,
  onMesaOperationalChange,
}: MesaEditDialogProps) {
  const [qrViewOpen, setQrViewOpen] = useState(false)
  const { data: staff } = useStaffList(restauranteId)
  const generarQr = useGenerarQr(restauranteId, salonId)
  const setMozosAsignados = useSetMozosAsignados(restauranteId, salonId)

  const mozos = (staff ?? []).filter((s) => s.rol === 'mozo' && s.estado === 'activo')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MesaEditFormValues>({
    resolver: zodResolver(mesaEditSchema),
    defaultValues: { numero: '', capacidad: '1' },
  })

  useEffect(() => {
    if (item) reset({ numero: item.numero, capacidad: String(item.capacidad) })
  }, [item, reset])

  function onSubmit(values: MesaEditFormValues) {
    if (!item) return
    onSave(item.localId, { numero: values.numero, capacidad: Number(values.capacidad) })
    onOpenChange(false)
  }

  function handleGenerarQr() {
    if (!mesa) return
    generarQr.mutate({ mesaId: mesa.id, qrTokenAnterior: null }, { onSuccess: onMesaOperationalChange })
  }

  function handleMozosChange(mozoIds: string[]) {
    if (!mesa) return
    setMozosAsignados.mutate({ mesaId: mesa.id, mozoIds }, { onSuccess: onMesaOperationalChange })
  }

  const esBanos = item?.forma === 'banos'

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esBanos ? 'Editar Baños' : 'Editar mesa'}</DialogTitle>
          <DialogDescription>
            {esBanos
              ? 'Elemento decorativo, sin número ni capacidad ni código QR.'
              : 'Los cambios se aplican al diseño en edición — recordá "Guardar diseño" al terminar.'}
          </DialogDescription>
        </DialogHeader>

        {esBanos ? (
          <DialogFooter className="mt-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => item && onDelete(item.localId)}
            >
              <Trash2 className="size-[18px]" />
              Eliminar
            </Button>
          </DialogFooter>
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  aria-invalid={Boolean(errors.numero)}
                  {...register('numero')}
                />
                {errors.numero ? (
                  <p className="text-xs text-destructive">{errors.numero.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="capacidad">Capacidad</Label>
                <Input
                  id="capacidad"
                  type="number"
                  min={1}
                  aria-invalid={Boolean(errors.capacidad)}
                  {...register('capacidad')}
                />
                {errors.capacidad ? (
                  <p className="text-xs text-destructive">{errors.capacidad.message}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <Label>Código QR</Label>
              {!mesa ? (
                <p className="text-xs text-muted-foreground">
                  Guardá el diseño para poder generar el código QR.
                </p>
              ) : mesa.qrToken ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <QrCode size={18} className="text-primary" />
                    Código QR generado
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setQrViewOpen(true)}>
                    Ver / Imprimir
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerarQr}
                  disabled={generarQr.isPending}
                  className="self-start"
                >
                  <QrCode size={18} />
                  Generar código QR
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Mozos asignados</Label>
              {!mesa ? (
                <p className="text-xs text-muted-foreground">
                  Guardá el diseño para poder asignar mozos.
                </p>
              ) : (
                <MozoMultiSelect
                  mozos={mozos}
                  selectedIds={mesa.mozoIds}
                  onChange={handleMozosChange}
                  disabled={setMozosAsignados.isPending}
                />
              )}
            </div>

            <DialogFooter className="mt-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => item && onDelete(item.localId)}
              >
                <Trash2 className="size-[18px]" />
                Eliminar mesa
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>

      {mesa?.qrToken ? (
        <QrViewDialog
          open={qrViewOpen}
          onOpenChange={setQrViewOpen}
          restauranteId={restauranteId}
          salonId={salonId}
          mesaId={mesa.id}
          numero={mesa.numero}
          qrToken={mesa.qrToken}
          onChanged={onMesaOperationalChange}
        />
      ) : null}
    </Dialog>
  )
}
