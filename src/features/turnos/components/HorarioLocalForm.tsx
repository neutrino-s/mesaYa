import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'
import { HORARIOS_VACIO } from '@/types/restaurante'

import { horariosSchema, type HorariosFormSchema } from '../domain/horariosSchema'
import { DIA_OPTIONS, TURNO_OPTIONS } from '../domain/turnosRules'
import { useUpdateHorarios } from '../hooks/useUpdateHorarios'
import { TurnoScheduleRow } from './TurnoScheduleRow'

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-xl" />
      ))}
    </div>
  )
}

/** Horarios de apertura/cierre del comercio, días laborales y turnos de
 * servicio (Mañana/Tarde/Noche) habilitados. A diferencia del resto del
 * panel, es un único registro por restaurante (no una lista) — se edita
 * directo en la pestaña, sin diálogo. */
export function HorarioLocalForm() {
  const { restaurante, isLoading } = useMyRestaurante()
  const updateHorarios = useUpdateHorarios(restaurante?.id ?? null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HorariosFormSchema>({
    resolver: zodResolver(horariosSchema),
    defaultValues: HORARIOS_VACIO,
  })

  useEffect(() => {
    if (restaurante) reset(restaurante.horarios)
  }, [restaurante, reset])

  async function onSubmit(values: HorariosFormSchema) {
    await updateHorarios.mutateAsync(values)
  }

  if (isLoading) return <FormSkeleton />

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg text-foreground">Horario del comercio</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="aperturaGeneral">Apertura</Label>
            <Input
              id="aperturaGeneral"
              type="time"
              aria-invalid={Boolean(errors.aperturaGeneral)}
              {...register('aperturaGeneral')}
            />
            {errors.aperturaGeneral ? (
              <p className="text-xs text-destructive">{errors.aperturaGeneral.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cierreGeneral">Cierre</Label>
            <Input
              id="cierreGeneral"
              type="time"
              aria-invalid={Boolean(errors.cierreGeneral)}
              {...register('cierreGeneral')}
            />
            {errors.cierreGeneral ? (
              <p className="text-xs text-destructive">{errors.cierreGeneral.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg text-foreground">Días laborales</h2>
        <Controller
          name="diasLaborales"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-4">
              {DIA_OPTIONS.map((dia) => {
                const checked = field.value.includes(dia.value)
                return (
                  <label
                    key={dia.value}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        field.onChange(
                          value
                            ? [...field.value, dia.value]
                            : field.value.filter((dia_) => dia_ !== dia.value),
                        )
                      }
                    />
                    {dia.label}
                  </label>
                )
              })}
            </div>
          )}
        />
        {errors.diasLaborales ? (
          <p className="text-xs text-destructive">{errors.diasLaborales.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg text-foreground">Turnos de servicio</h2>
        <div className="flex flex-col gap-3">
          {TURNO_OPTIONS.map((turno) => (
            <TurnoScheduleRow
              key={turno.value}
              nombre={turno.value}
              label={turno.label}
              control={control}
              register={register}
              errors={errors}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="self-end" disabled={updateHorarios.isPending}>
        {updateHorarios.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          'Guardar horarios'
        )}
      </Button>
    </form>
  )
}
