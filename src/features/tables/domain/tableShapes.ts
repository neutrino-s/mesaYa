import type { FormaMesa } from '@/types/mesa'

export const BARRA_SECTION_WIDTH = 90
export const BARRA_HEIGHT = 50
export const BARRA_DEFAULT_SECCIONES = 2

/** Tamaño estándar (px) por forma en el lienzo — sin resize/rotación
 * individual (ver Log de decisiones en `docs/database-schema.md#mesa`;
 * la Barra es la única excepción, rota entre horizontal/vertical). */
export const SHAPE_SIZES: Record<FormaMesa, { width: number; height: number }> = {
  cuadrada: { width: 80, height: 80 },
  rectangular: { width: 120, height: 80 },
  redonda: { width: 90, height: 90 },
  banos: { width: 80, height: 80 },
  // Tamaño usado solo para el preview de arrastre desde la paleta (antes de
  // que exista una cantidad real de secciones) — ver `PaletteDragPreview`.
  // El tamaño real de una Barra ya colocada lo calcula `PlacedBarra` en
  // base a su cantidad de secciones.
  barra: { width: BARRA_SECTION_WIDTH * BARRA_DEFAULT_SECCIONES, height: BARRA_HEIGHT },
}

/** Capacidad sugerida al soltar una mesa nueva desde la paleta (o al
 * agregar una sección a una Barra); editable después desde
 * `MesaEditDialog`/`BarraEditDialog`. */
export const SHAPE_DEFAULT_CAPACIDAD: Record<FormaMesa, number> = {
  cuadrada: 4,
  rectangular: 6,
  redonda: 4,
  banos: 0, // no se usa: Baños no tiene capacidad
  barra: 4,
}

export const SHAPE_LABELS: Record<FormaMesa, string> = {
  cuadrada: 'Mesa',
  rectangular: 'Mesa',
  redonda: 'Mesa',
  banos: 'Baños',
  barra: 'Barra',
}

export const SHAPE_OPTIONS: FormaMesa[] = ['cuadrada', 'rectangular', 'redonda', 'banos', 'barra']
