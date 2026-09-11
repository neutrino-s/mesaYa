import { z } from 'zod'

import { TIPO_SOLICITUD_OPTIONS } from './solicitudRules'

const tipoValues = TIPO_SOLICITUD_OPTIONS.map((option) => option.value) as [
  (typeof TIPO_SOLICITUD_OPTIONS)[number]['value'],
  ...(typeof TIPO_SOLICITUD_OPTIONS)[number]['value'][],
]

export const solicitudSchema = z
  .object({
    tipo: z.enum(tipoValues, { message: 'Elegí un tipo de solicitud.' }),
    fechaDesde: z.string().min(1, 'Elegí una fecha.'),
    fechaHasta: z.string().min(1, 'Elegí una fecha.'),
    motivo: z.string().trim().min(1, 'Contá brevemente el motivo.'),
  })
  .refine((solicitud) => solicitud.fechaDesde <= solicitud.fechaHasta, {
    message: 'La fecha de inicio debe ser anterior (o igual) a la de fin.',
    path: ['fechaHasta'],
  })

export type SolicitudFormSchema = z.infer<typeof solicitudSchema>
