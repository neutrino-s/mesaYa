// Lógica pura del lienzo de mesas: sin React ni Firebase, se prueba sola.

import type { FormaMesa, Mesa } from '@/types/mesa'

/** Ítem del lienzo en edición. `mesaId: null` = mesa nueva, todavía no
 * guardada; `localId` es la key estable en React y en dnd-kit, siempre
 * presente (para mesas ya guardadas, se genera al cargar el layout).
 *
 * `grupoId`/`seccion` agrupan las secciones de una Barra (cada sección es
 * un `MesaLayoutItem` completo, con su propio `numero`/`capacidad`). El
 * grupo mantiene "mirroring" continuo de `posicion`/`rotacion`: las tres
 * quedan siempre idénticas en todas las secciones del grupo (al crear, al
 * arrastrar, al rotar) — así no hace falta un concepto de "sección ancla"
 * ni reasignarla al borrar una sección cualquiera. */
export interface MesaLayoutItem {
  localId: string
  mesaId: string | null
  numero: string
  capacidad: number
  forma: FormaMesa
  posicion: { x: number; y: number }
  rotacion: 0 | 90
  grupoId: string | null
  seccion: number | null
}

export function generateLocalId(): string {
  return crypto.randomUUID()
}

export function generateQrToken(): string {
  return crypto.randomUUID()
}

export function generateGrupoId(): string {
  return crypto.randomUUID()
}

export function mesaToLayoutItem(mesa: Mesa): MesaLayoutItem {
  return {
    localId: generateLocalId(),
    mesaId: mesa.id,
    numero: mesa.numero,
    capacidad: mesa.capacidad,
    forma: mesa.forma,
    posicion: mesa.posicion,
    rotacion: mesa.rotacion,
    grupoId: mesa.grupoId,
    seccion: mesa.seccion,
  }
}

/** Próximo número sugerido al soltar una mesa nueva: el máximo de los
 * números ya usados (locales + guardados) que parsean como entero, + 1. Si
 * ninguno parsea, arranca en `'1'`. Baños usa `numero: ''`, que nunca
 * parsea — no contamina la secuencia. */
export function nextNumero(existentes: string[]): string {
  const maxActual = existentes.reduce((max, numero) => {
    const parsed = Number.parseInt(numero, 10)
    return Number.isFinite(parsed) && parsed > max ? parsed : max
  }, 0)
  return String(maxActual + 1)
}

export interface MesaLayoutChanges {
  numero?: string
  capacidad?: number
  forma?: FormaMesa
  posicion?: { x: number; y: number }
  rotacion?: 0 | 90
  grupoId?: string | null
  seccion?: number | null
}

export interface MesaLayoutDiff {
  toCreate: MesaLayoutItem[]
  toUpdate: Array<{ mesaId: string; changes: MesaLayoutChanges }>
  toDelete: Mesa[]
}

function posicionIgual(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return a.x === b.x && a.y === b.y
}

/** Compara el layout original (lo que hay en Firestore) contra el estado
 * local en edición y arma las tres listas que necesita `saveLayout` para
 * escribir un único `writeBatch`. */
export function diffLayout(original: Mesa[], current: MesaLayoutItem[]): MesaLayoutDiff {
  const originalById = new Map(original.map((mesa) => [mesa.id, mesa]))
  const currentMesaIds = new Set(current.map((item) => item.mesaId).filter((id): id is string => id !== null))

  const toCreate = current.filter((item) => item.mesaId === null)

  const toUpdate: MesaLayoutDiff['toUpdate'] = []
  for (const item of current) {
    if (item.mesaId === null) continue
    const mesaOriginal = originalById.get(item.mesaId)
    if (!mesaOriginal) continue

    const changes: MesaLayoutChanges = {}
    if (item.numero !== mesaOriginal.numero) changes.numero = item.numero
    if (item.capacidad !== mesaOriginal.capacidad) changes.capacidad = item.capacidad
    if (item.forma !== mesaOriginal.forma) changes.forma = item.forma
    if (!posicionIgual(item.posicion, mesaOriginal.posicion)) changes.posicion = item.posicion
    if (item.rotacion !== mesaOriginal.rotacion) changes.rotacion = item.rotacion
    if (item.grupoId !== mesaOriginal.grupoId) changes.grupoId = item.grupoId
    if (item.seccion !== mesaOriginal.seccion) changes.seccion = item.seccion

    if (Object.keys(changes).length > 0) {
      toUpdate.push({ mesaId: item.mesaId, changes })
    }
  }

  const toDelete = original.filter((mesa) => !currentMesaIds.has(mesa.id))

  return { toCreate, toUpdate, toDelete }
}

export interface BarraGroup {
  grupoId: string
  /** Ordenadas ascendente por `seccion`. */
  secciones: MesaLayoutItem[]
}

/** Separa el layout en edición entre ítems sueltos (mesas y baños, sin
 * `grupoId`) y grupos de Barra, para que `SalonCanvasPage` renderice cada
 * uno con el componente que corresponde. */
export function groupCurrentByGrupoId(current: MesaLayoutItem[]): {
  sueltas: MesaLayoutItem[]
  grupos: BarraGroup[]
} {
  const porGrupo = new Map<string, MesaLayoutItem[]>()
  const sueltas: MesaLayoutItem[] = []

  for (const item of current) {
    if (item.grupoId === null) {
      sueltas.push(item)
      continue
    }
    porGrupo.set(item.grupoId, [...(porGrupo.get(item.grupoId) ?? []), item])
  }

  const grupos = [...porGrupo.entries()].map(([grupoId, secciones]) => ({
    grupoId,
    secciones: [...secciones].sort((a, b) => (a.seccion ?? 0) - (b.seccion ?? 0)),
  }))

  return { sueltas, grupos }
}
