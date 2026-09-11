import { z } from 'zod'

import { DIA_OPTIONS } from './turnosRules'

const diaValues = DIA_OPTIONS.map((option) => option.value) as [
  (typeof DIA_OPTIONS)[number]['value'],
  ...(typeof DIA_OPTIONS)[number]['value'][],
]

// Comparación lexicográfica válida porque `<input type="time">` siempre
// devuelve `HH:mm` con cero a la izquierda (24hs).
const turnoHorarioSchema = z
  .object({
    habilitado: z.boolean(),
    horaInicio: z.string(),
    horaFin: z.string(),
  })
  .refine(
    (turno) => !turno.habilitado || (turno.horaInicio !== '' && turno.horaFin !== '' && turno.horaInicio < turno.horaFin),
    { message: 'Completá un horario de inicio y fin válido (inicio antes que fin).', path: ['horaFin'] },
  )

export const horariosSchema = z.object({
  aperturaGeneral: z.string().min(1, 'Ingresá el horario de apertura.'),
  cierreGeneral: z.string().min(1, 'Ingresá el horario de cierre.'),
  diasLaborales: z.array(z.enum(diaValues)).min(1, 'Elegí al menos un día laboral.'),
  turnos: z.object({
    manana: turnoHorarioSchema,
    tarde: turnoHorarioSchema,
    noche: turnoHorarioSchema,
  }),
})

export type HorariosFormSchema = z.infer<typeof horariosSchema>
