import { z } from 'zod'

import { AREA_OPTIONS } from './cuadranteRules'

const areaValues = AREA_OPTIONS.map((option) => option.value) as [
  (typeof AREA_OPTIONS)[number]['value'],
  ...(typeof AREA_OPTIONS)[number]['value'][],
]

export const turnoAsignadoSchema = z
  .object({
    staffId: z.string().min(1, 'Elegí un empleado.'),
    fecha: z.string().min(1, 'Elegí una fecha.'),
    horaInicio: z.string().min(1, 'Ingresá la hora de inicio.'),
    horaFin: z.string().min(1, 'Ingresá la hora de fin.'),
    area: z.enum(areaValues, { message: 'Elegí un área.' }),
    notas: z.string().trim(),
  })
  .refine((turno) => turno.horaInicio < turno.horaFin, {
    message: 'La hora de inicio debe ser anterior a la de fin.',
    path: ['horaFin'],
  })

export type TurnoAsignadoFormSchema = z.infer<typeof turnoAsignadoSchema>
