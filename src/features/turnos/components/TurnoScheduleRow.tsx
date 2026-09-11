import { Controller } from 'react-hook-form'
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TurnoNombre } from '@/types/restaurante'

import type { HorariosFormSchema } from '../domain/horariosSchema'

interface TurnoScheduleRowProps {
  nombre: TurnoNombre
  label: string
  control: Control<HorariosFormSchema>
  register: UseFormRegister<HorariosFormSchema>
  errors: FieldErrors<HorariosFormSchema>
}

/** Una fila por turno (Mañana/Tarde/Noche): checkbox "Habilitado" + horario
 * desde/hasta, deshabilitado mientras el turno no esté habilitado. */
export function TurnoScheduleRow({ nombre, label, control, register, errors }: TurnoScheduleRowProps) {
  const errorMessage = errors.turnos?.[nombre]?.horaFin?.message

  return (
    <Controller
      name={`turnos.${nombre}.habilitado`}
      control={control}
      render={({ field }) => (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:gap-4">
          <label className="flex min-w-40 items-center gap-2 text-sm font-medium text-foreground">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            {label}
          </label>

          <div className="grid flex-1 grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`turno-${nombre}-inicio`} className="text-xs">
                Desde
              </Label>
              <Input
                id={`turno-${nombre}-inicio`}
                type="time"
                disabled={!field.value}
                {...register(`turnos.${nombre}.horaInicio`)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`turno-${nombre}-fin`} className="text-xs">
                Hasta
              </Label>
              <Input
                id={`turno-${nombre}-fin`}
                type="time"
                disabled={!field.value}
                {...register(`turnos.${nombre}.horaFin`)}
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="text-xs text-destructive sm:basis-full">{errorMessage}</p>
          ) : null}
        </div>
      )}
    />
  )
}
