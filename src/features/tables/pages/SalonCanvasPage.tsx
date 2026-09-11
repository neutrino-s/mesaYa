import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { ArrowLeft, Loader2, RotateCcw, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import { paths } from '@/routes/paths'
import type { FormaMesa, Mesa } from '@/types/mesa'

import { BarraEditDialog } from '../components/BarraEditDialog'
import { CANVAS_DROPPABLE_ID, CanvasDropArea } from '../components/CanvasDropArea'
import { MesaEditDialog } from '../components/MesaEditDialog'
import { PaletteDragPreview } from '../components/PaletteDragPreview'
import { PlacedBarra } from '../components/PlacedBarra'
import { PlacedMesa } from '../components/PlacedMesa'
import { ShapePalette } from '../components/ShapePalette'
import {
  diffLayout,
  generateGrupoId,
  generateLocalId,
  groupCurrentByGrupoId,
  mesaToLayoutItem,
  nextNumero,
  type MesaLayoutItem,
} from '../domain/mesaLayoutRules'
import { BARRA_DEFAULT_SECCIONES, SHAPE_DEFAULT_CAPACIDAD } from '../domain/tableShapes'
import { useMesasDeSalon } from '../hooks/useMesasDeSalon'
import { useSalon } from '../hooks/useSalon'
import { useSaveSalonLayout } from '../hooks/useSaveSalonLayout'

export function SalonCanvasPage() {
  const { salonId } = useParams<{ salonId: string }>()
  const navigate = useNavigate()
  const { restauranteId } = useMyRestauranteId()

  const { data: salon } = useSalon(restauranteId, salonId ?? null)
  const mesasQuery = useMesasDeSalon(restauranteId, salonId ?? null)
  const saveLayout = useSaveSalonLayout(restauranteId, salonId ?? null)

  const [original, setOriginal] = useState<Mesa[] | null>(null)
  const [current, setCurrent] = useState<MesaLayoutItem[]>([])
  const [editingItem, setEditingItem] = useState<MesaLayoutItem | null>(null)
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null)
  const [activePaletteForma, setActivePaletteForma] = useState<FormaMesa | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)

  // Se inicializa una sola vez con lo que ya hay en Firestore — no se
  // re-sincroniza en cada refetch para no pisar ediciones en curso (ver
  // `useMesasDeSalon`). Ajuste de estado durante el render (no en un
  // efecto): en cuanto `original` deja de ser `null` esta condición no
  // vuelve a dispararse.
  if (mesasQuery.data && original === null) {
    setOriginal(mesasQuery.data)
    setCurrent(mesasQuery.data.map(mesaToLayoutItem))
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    if (activeId.startsWith('palette-')) {
      setActivePaletteForma(activeId.replace('palette-', '') as FormaMesa)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePaletteForma(null)
    const { active, over, delta } = event
    const activeId = String(active.id)

    if (activeId.startsWith('palette-')) {
      if (over?.id !== CANVAS_DROPPABLE_ID) return
      const canvasEl = canvasRef.current
      const activeRect = active.rect.current.translated
      if (!canvasEl || !activeRect) return

      const canvasRect = canvasEl.getBoundingClientRect()
      const forma = activeId.replace('palette-', '') as FormaMesa
      const posicion = {
        x: Math.max(0, Math.round(activeRect.left - canvasRect.left)),
        y: Math.max(0, Math.round(activeRect.top - canvasRect.top)),
      }

      if (forma === 'barra') {
        // Todas las secciones nacen con la misma posición/rotación
        // ("mirroring" continuo, ver mesaLayoutRules.ts) y un grupoId común.
        const grupoId = generateGrupoId()
        const numeros = current.map((item) => item.numero)
        const nuevasSecciones: MesaLayoutItem[] = []
        for (let seccion = 1; seccion <= BARRA_DEFAULT_SECCIONES; seccion++) {
          const numero = nextNumero(numeros)
          numeros.push(numero)
          nuevasSecciones.push({
            localId: generateLocalId(),
            mesaId: null,
            numero,
            capacidad: SHAPE_DEFAULT_CAPACIDAD.barra,
            forma: 'barra',
            posicion,
            rotacion: 0,
            grupoId,
            seccion,
          })
        }
        setCurrent((prev) => [...prev, ...nuevasSecciones])
        return
      }

      const newItem: MesaLayoutItem = {
        localId: generateLocalId(),
        mesaId: null,
        numero: forma === 'banos' ? '' : nextNumero(current.map((item) => item.numero)),
        capacidad: SHAPE_DEFAULT_CAPACIDAD[forma],
        forma,
        posicion,
        rotacion: 0,
        grupoId: null,
        seccion: null,
      }
      setCurrent((prev) => [...prev, newItem])
      return
    }

    if (activeId.startsWith('grupo-')) {
      const grupoId = activeId.replace('grupo-', '')
      setCurrent((prev) =>
        prev.map((item) =>
          item.grupoId === grupoId
            ? {
                ...item,
                posicion: {
                  x: Math.max(0, item.posicion.x + delta.x),
                  y: Math.max(0, item.posicion.y + delta.y),
                },
              }
            : item,
        ),
      )
      return
    }

    setCurrent((prev) =>
      prev.map((item) =>
        item.localId === activeId
          ? {
              ...item,
              posicion: {
                x: Math.max(0, item.posicion.x + delta.x),
                y: Math.max(0, item.posicion.y + delta.y),
              },
            }
          : item,
      ),
    )
  }

  function handleSaveItemEdit(localId: string, changes: { numero: string; capacidad: number }) {
    setCurrent((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...changes } : item)),
    )
  }

  function handleDeleteItem(localId: string) {
    setCurrent((prev) => prev.filter((item) => item.localId !== localId))
    setEditingItem(null)
  }

  function handleUpdateSeccionCapacidad(localId: string, capacidad: number) {
    setCurrent((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, capacidad } : item)),
    )
  }

  function handleAddSeccion(grupoId: string) {
    setCurrent((prev) => {
      const delGrupo = prev.filter((item) => item.grupoId === grupoId)
      const referencia = delGrupo[0]
      if (!referencia) return prev

      const maxSeccion = delGrupo.reduce((max, item) => Math.max(max, item.seccion ?? 0), 0)
      const numero = nextNumero(prev.map((item) => item.numero))
      const nuevaSeccion: MesaLayoutItem = {
        localId: generateLocalId(),
        mesaId: null,
        numero,
        capacidad: SHAPE_DEFAULT_CAPACIDAD.barra,
        forma: 'barra',
        posicion: referencia.posicion,
        rotacion: referencia.rotacion,
        grupoId,
        seccion: maxSeccion + 1,
      }
      return [...prev, nuevaSeccion]
    })
  }

  function handleDeleteSeccion(localId: string) {
    setCurrent((prev) => prev.filter((item) => item.localId !== localId))
  }

  function handleRotateGrupo(grupoId: string) {
    setCurrent((prev) =>
      prev.map((item) =>
        item.grupoId === grupoId
          ? { ...item, rotacion: item.rotacion === 0 ? 90 : 0 }
          : item,
      ),
    )
  }

  function handleDeleteGrupo(grupoId: string) {
    setCurrent((prev) => prev.filter((item) => item.grupoId !== grupoId))
    setEditingGrupoId(null)
  }

  function handleDiscard() {
    if (!original) return
    setCurrent(original.map(mesaToLayoutItem))
  }

  async function handleSave() {
    if (!original) return
    await saveLayout.mutateAsync({ original, current })
    const { data: fresh } = await mesasQuery.refetch()
    if (fresh) {
      setOriginal(fresh)
      setCurrent(fresh.map(mesaToLayoutItem))
    }
  }

  /** Refresca el snapshot de mesas tras generar un código QR o cambiar el
   * mozo asignado (campos operativos que `MesaEditDialog` escribe directo a
   * Firestore, fuera de "Guardar diseño"). A diferencia de `handleSave`, no
   * toca `current` — no hay que pisar el layout en edición por un cambio
   * que no es de layout. */
  async function handleRefreshMesas() {
    const { data: fresh } = await mesasQuery.refetch()
    if (fresh) setOriginal(fresh)
  }

  const diff = original ? diffLayout(original, current) : null
  const hasChanges = Boolean(
    diff && (diff.toCreate.length > 0 || diff.toUpdate.length > 0 || diff.toDelete.length > 0),
  )
  const isLoading = mesasQuery.isPending || original === null
  const { sueltas, grupos } = groupCurrentByGrupoId(current)
  const grupoEnEdicion = grupos.find((grupo) => grupo.grupoId === editingGrupoId)

  // Mesa persistida (con `qrToken`/`mozoIds`) detrás del `MesaLayoutItem`
  // en edición — esos campos son del ciclo operativo, no viven en el layout
  // local (ver `MesaEditDialog`).
  const editingMesa = editingItem?.mesaId
    ? (original?.find((mesa) => mesa.id === editingItem.mesaId) ?? null)
    : null
  const qrTokenByMesaId = new Map(
    (original ?? []).filter((mesa) => mesa.qrToken).map((mesa) => [mesa.id, mesa.qrToken]),
  )
  const mozoIdsByMesaId = new Map((original ?? []).map((mesa) => [mesa.id, mesa.mozoIds]))

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="size-11 shrink-0 p-0"
            onClick={() => navigate(paths.panelSalon)}
          >
            <ArrowLeft className="size-[18px]" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl text-foreground">
              {salon?.nombre ?? 'Salón'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Arrastrá elementos desde la paleta para armar el salón.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDiscard} disabled={!hasChanges || saveLayout.isPending}>
            <RotateCcw className="size-[18px]" />
            Descartar cambios
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveLayout.isPending}>
            {saveLayout.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Save className="size-[18px]" />
                Guardar diseño
              </>
            )}
          </Button>
        </div>
      </header>

      {isLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActivePaletteForma(null)}
        >
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            <ShapePalette />
            <CanvasDropArea onCanvasNode={(node) => { canvasRef.current = node }}>
              {sueltas.map((item) => (
                <PlacedMesa
                  key={item.localId}
                  item={item}
                  onClick={setEditingItem}
                  hasQr={item.mesaId ? qrTokenByMesaId.has(item.mesaId) : false}
                />
              ))}
              {grupos.map((grupo) => (
                <PlacedBarra
                  key={grupo.grupoId}
                  grupoId={grupo.grupoId}
                  secciones={grupo.secciones}
                  onClick={setEditingGrupoId}
                  qrTokenByMesaId={qrTokenByMesaId}
                />
              ))}
            </CanvasDropArea>
          </div>
          <DragOverlay dropAnimation={null}>
            {activePaletteForma ? <PaletteDragPreview forma={activePaletteForma} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <MesaEditDialog
        item={editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleSaveItemEdit}
        onDelete={handleDeleteItem}
        restauranteId={restauranteId}
        salonId={salonId ?? null}
        mesa={editingMesa}
        onMesaOperationalChange={handleRefreshMesas}
      />

      <BarraEditDialog
        secciones={grupoEnEdicion?.secciones ?? []}
        open={grupoEnEdicion !== undefined}
        onOpenChange={(open) => !open && setEditingGrupoId(null)}
        onUpdateCapacidad={handleUpdateSeccionCapacidad}
        onAddSeccion={() => editingGrupoId && handleAddSeccion(editingGrupoId)}
        onDeleteSeccion={handleDeleteSeccion}
        onRotate={() => editingGrupoId && handleRotateGrupo(editingGrupoId)}
        onDeleteGrupo={() => editingGrupoId && handleDeleteGrupo(editingGrupoId)}
        restauranteId={restauranteId}
        salonId={salonId ?? null}
        qrTokenByMesaId={qrTokenByMesaId}
        mozoIdsByMesaId={mozoIdsByMesaId}
        onMesaChanged={handleRefreshMesas}
      />
    </div>
  )
}
