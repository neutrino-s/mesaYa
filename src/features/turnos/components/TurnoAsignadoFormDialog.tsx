import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
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
import type { Staff } from '@/types/staff'
import type { TurnoAsignado } from '@/types/turnoAsignado'

import {
  AREA_OPTIONS,
  areaSugeridaPorRol,
  detectarDescansoInsuficiente,
  detectarSolapamiento,
  EXCESO_HORAS_DIARIO_MAX,
  fechaId,
  horasDeTurno,
} from '../domain/cuadranteRules'
import { turnoAsignadoSchema, type TurnoAsignadoFormSchema } from '../domain/cuadranteSchema'
import { useCreateTurnoAsignado } from '../hooks/useCreateTurnoAsignado'
import { useDeleteTurnoAsignado } from '../hooks/useDeleteTurnoAsignado'
import { useUpdateTurnoAsignado } from '../hooks/useUpdateTurnoAsignado'

interface TurnoAsignadoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  /** Personal activo asignable — ya filtrado por la pantalla. */
  staff: Staff[]
  /** Turnos del rango visible, para validar solapamiento/descanso contra el
   * resto del cuadrante del mismo empleado. */
  turnos: TurnoAsignado[]
  /** Turno a editar; `null`/`undefined` da de alta uno nuevo. */
  turno?: TurnoAsignado | null
  /** Prellenado al crear desde una celda puntual del cuadrante. */
  valoresIniciales?: { staffId?: string; fecha?: string } | null
}

function emptyValues(valoresIniciales?: { staffId?: string; fecha?: string } | null): TurnoAsignadoFormSchema {
  return {
    staffId: valoresIniciales?.staffId ?? '',
    fecha: valoresIniciales?.fecha ?? fechaId(new Date()),
    horaInicio: '',
    horaFin: '',
    area: 'salon',
    notas: '',
  }
}

export function TurnoAsignadoFormDialog({
  open,
  onOpenChange,
  restauranteId,
  staff,
  turnos,
  turno,
  valoresIniciales,
}: TurnoAsignadoFormDialogProps) {
  const isEditing = Boolean(turno)
  const createTurno = useCreateTurnoAsignado(restauranteId)
  const updateTurno = useUpdateTurnoAsignado(restauranteId)
  const deleteTurno = useDeleteTurnoAsignado(restauranteId)
  const submitting = createTurno.isPending || updateTurno.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TurnoAsignadoFormSchema>({
    resolver: zodResolver(turnoAsignadoSchema),
    defaultValues: emptyValues(valoresIniciales),
  })

  useEffect(() => {
    if (!open) return
    reset(
      turno
        ? {
            staffId: turno.staffId,
            fecha: turno.fecha,
            horaInicio: turno.horaInicio,
            horaFin: turno.horaFin,
            area: turno.area,
            notas: turno.notas,
          }
        : emptyValues(valoresIniciales),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo re-inicializar al abrir/cambiar de turno
  }, [open, turno])

  const staffId = useWatch({ control, name: 'staffId' })
  const fecha = useWatch({ control, name: 'fecha' })
  const horaInicio = useWatch({ control, name: 'horaInicio' })
  const horaFin = useWatch({ control, name: 'horaFin' })

  const turnosDelEmpleado = useMemo(
    () => turnos.filter((t) => t.staffId === staffId),
    [turnos, staffId],
  )

  const candidato = useMemo(
    () => ({ id: turno?.id, fecha, horaInicio, horaFin }),
    [turno?.id, fecha, horaInicio, horaFin],
  )

  const horarioCompleto = Boolean(staffId && fecha && horaInicio && horaFin && horaInicio < horaFin)

  const solapamiento = horarioCompleto ? detectarSolapamiento(turnosDelEmpleado, candidato) : null
  const descansoInsuficiente = horarioCompleto && !solapamiento
    ? detectarDescansoInsuficiente(turnosDelEmpleado, candidato)
    : null
  const excesoHoras = horarioCompleto && horasDeTurno(candidato) > EXCESO_HORAS_DIARIO_MAX

  async function onSubmit(values: TurnoAsignadoFormSchema) {
    const conflicto = detectarSolapamiento(
      turnos.filter((t) => t.staffId === values.staffId),
      { id: turno?.id, fecha: values.fecha, horaInicio: values.horaInicio, horaFin: values.horaFin },
    )
    if (conflicto) return // el banner ya lo muestra; no se guarda un solapamiento.

    const rol = staff.find((member) => member.id === values.staffId)?.rol ?? turno?.rol
    if (!rol) return

    if (isEditing && turno) {
      await updateTurno.mutateAsync({ turnoId: turno.id, rol, input: values })
    } else {
      await createTurno.mutateAsync({ rol, input: values })
    }
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!turno) return
    await deleteTurno.mutateAsync(turno.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar turno' : 'Nuevo turno'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualizá el turno asignado.'
              : 'Asigná un turno a un empleado del equipo.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="staffId">Empleado</Label>
            <Controller
              name="staffId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    if (!isEditing) {
                      const rol = staff.find((member) => member.id === value)?.rol
                      if (rol) setValue('area', areaSugeridaPorRol(rol))
                    }
                  }}
                >
                  <SelectTrigger id="staffId" aria-invalid={Boolean(errors.staffId)}>
                    <SelectValue placeholder="Elegí un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.staffId ? <p className="text-xs text-destructive">{errors.staffId.message}</p> : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              aria-invalid={Boolean(errors.fecha)}
              {...register('fecha')}
            />
            {errors.fecha ? <p className="text-xs text-destructive">{errors.fecha.message}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="horaInicio">Hora de inicio</Label>
              <Input
                id="horaInicio"
                type="time"
                aria-invalid={Boolean(errors.horaInicio)}
                {...register('horaInicio')}
              />
              {errors.horaInicio ? (
                <p className="text-xs text-destructive">{errors.horaInicio.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="horaFin">Hora de fin</Label>
              <Input
                id="horaFin"
                type="time"
                aria-invalid={Boolean(errors.horaFin)}
                {...register('horaFin')}
              />
              {errors.horaFin ? <p className="text-xs text-destructive">{errors.horaFin.message}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="area">Área</Label>
            <Controller
              name="area"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="area" aria-invalid={Boolean(errors.area)}>
                    <SelectValue placeholder="Elegí un área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" rows={2} {...register('notas')} />
          </div>

          {solapamiento ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Se superpone con el turno de {solapamiento.horaInicio}–{solapamiento.horaFin} que este
                empleado ya tiene ese día. Ajustá el horario para poder guardar.
              </span>
            </div>
          ) : null}

          {!solapamiento && descansoInsuficiente ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Quedan solo {descansoInsuficiente.horasDescanso.toFixed(1)} hs de descanso respecto del
                turno de {descansoInsuficiente.turno.fecha}. Se puede guardar igual, pero revisá si es
                intencional.
              </span>
            </div>
          ) : null}

          {excesoHoras ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>Este turno supera las {EXCESO_HORAS_DIARIO_MAX} horas.</span>
            </div>
          ) : null}

          <DialogFooter className="mt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteTurno.isPending}
                className="text-left text-sm font-semibold text-destructive hover:underline disabled:opacity-60 sm:mr-auto"
              >
                Eliminar turno
              </button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || Boolean(solapamiento)}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : isEditing ? 'Guardar cambios' : 'Agregar turno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
