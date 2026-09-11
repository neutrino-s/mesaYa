import { z } from 'zod'

// Todos los campos son opcionales (pedido explícito: se puede cargar un
// plato parcial e ir completándolo). `precio` queda como string en el form
// (mismo patrón que `capacidad` en `mesaEditSchema.ts`) y se convierte a
// `number | null` recién al guardar (ver `parsePrecioInput` en
// `cartaRules.ts`). El input aplica máscara AR mientras se tipea
// (`maskPrecioInput`), así que en este punto siempre llega ya agrupado por
// miles con punto y decimales con coma (ej. "12.505,55").
export const cartaProductoSchema = z.object({
  nombre: z.string().trim().max(120, 'El nombre es muy largo.'),
  descripcion: z.string().trim().max(280, 'La descripción es muy larga.'),
  precio: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(value), 'Ingresá un precio válido.'),
})

export type CartaProductoFormSchema = z.infer<typeof cartaProductoSchema>
