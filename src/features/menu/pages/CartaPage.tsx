import { BookOpen, Eye, Plus } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'
import { useMyRestauranteId } from '@/features/staff/hooks/useMyRestauranteId'
import type { CartaProducto } from '@/types/cartaProducto'
import type { CartaSeccion } from '@/types/cartaSeccion'

import { CartaModoSelector } from '../components/CartaModoSelector'
import { CartaPreviewDialog } from '../components/CartaPreviewDialog'
import { CartaProductoFormDialog } from '../components/CartaProductoFormDialog'
import { CartaSeccionCard } from '../components/CartaSeccionCard'
import { CartaSeccionFormDialog } from '../components/CartaSeccionFormDialog'
import { agruparPorSeccion } from '../domain/cartaRules'
import { useCartaProductosList } from '../hooks/useCartaProductosList'
import { useCartaSeccionesList } from '../hooks/useCartaSeccionesList'
import { useDeleteCartaProducto } from '../hooks/useDeleteCartaProducto'
import { useSetCartaProductoAgotado } from '../hooks/useSetCartaProductoAgotado'
import { useSetCartaSeccionActivo } from '../hooks/useSetCartaSeccionActivo'

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-48 rounded-xl" />
      ))}
    </div>
  )
}

export function CartaPage() {
  const { restauranteId, isLoading: isLoadingRestaurante } = useMyRestauranteId()
  const { restaurante } = useMyRestaurante()
  const { data: secciones, isPending: isPendingSecciones } = useCartaSeccionesList(restauranteId)
  const { data: productos, isPending: isPendingProductos } = useCartaProductosList(restauranteId)
  const setSeccionActivo = useSetCartaSeccionActivo(restauranteId)
  const deleteProducto = useDeleteCartaProducto(restauranteId)
  const setProductoAgotado = useSetCartaProductoAgotado(restauranteId)

  const [seccionDialogOpen, setSeccionDialogOpen] = useState(false)
  const [editingSeccion, setEditingSeccion] = useState<CartaSeccion | null>(null)

  const [productoDialogOpen, setProductoDialogOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<CartaProducto | null>(null)
  const [targetSeccionId, setTargetSeccionId] = useState<string | null>(null)
  // Se incrementa en cada apertura para remontar `CartaProductoFormDialog`
  // (prop `key`) y así arrancar siempre con el estado local limpio, sin
  // necesitar un efecto que lo resetee.
  const [productoDialogKey, setProductoDialogKey] = useState(0)

  // Ninguno de los dos se persiste: "sin carta" se deriva de `hasSecciones`
  // (no hay todavía una entidad "Carta" en el modelo, ver
  // docs/database-schema.md#carta---sección). `modoManualIniciado` solo
  // recuerda, dentro de esta sesión, que el usuario ya eligió "Carga
  // manual" — así el editor queda visible mientras arma la primera
  // sección, antes de que `hasSecciones` pase a ser cierto.
  const [mostrarSelectorModo, setMostrarSelectorModo] = useState(false)
  const [modoManualIniciado, setModoManualIniciado] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)

  const isLoading = isLoadingRestaurante || isPendingSecciones || isPendingProductos
  const hasSecciones = (secciones?.length ?? 0) > 0
  const mostrarEditor = hasSecciones || modoManualIniciado
  const productosPorSeccion = agruparPorSeccion(productos ?? [])

  function handleNuevaSeccion() {
    setEditingSeccion(null)
    setSeccionDialogOpen(true)
  }

  function handleEditSeccion(seccion: CartaSeccion) {
    setEditingSeccion(seccion)
    setSeccionDialogOpen(true)
  }

  function handleToggleActivo(seccion: CartaSeccion) {
    setSeccionActivo.mutate({ seccionId: seccion.id, activo: !seccion.activo })
  }

  function handleAddProducto(seccion: CartaSeccion) {
    setEditingProducto(null)
    setTargetSeccionId(seccion.id)
    setProductoDialogKey((key) => key + 1)
    setProductoDialogOpen(true)
  }

  function handleEditProducto(producto: CartaProducto) {
    setEditingProducto(producto)
    setTargetSeccionId(producto.seccionId)
    setProductoDialogKey((key) => key + 1)
    setProductoDialogOpen(true)
  }

  function handleDeleteProducto(producto: CartaProducto) {
    deleteProducto.mutate(producto.id)
  }

  function handleToggleAgotadoProducto(producto: CartaProducto) {
    setProductoAgotado.mutate({ productoId: producto.id, agotado: !producto.agotado })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Carta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Armá las secciones y los platos de tu restaurante.
          </p>
        </div>
        {mostrarEditor ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} className="sm:w-auto">
              <Eye className="size-[18px]" />
              Previsualización
            </Button>
            <Button onClick={handleNuevaSeccion} className="sm:w-auto">
              <Plus className="size-[18px]" />
              Nueva sección
            </Button>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <ListSkeleton />
      ) : !mostrarEditor ? (
        mostrarSelectorModo ? (
          <CartaModoSelector onSelectManual={() => setModoManualIniciado(true)} />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Todavía no hay carta creada"
            description="Creá tu carta para empezar a cargar las secciones y los platos de tu restaurante."
            action={
              <Button onClick={() => setMostrarSelectorModo(true)}>
                <Plus className="size-[18px]" />
                Crear carta
              </Button>
            }
          />
        )
      ) : !hasSecciones ? (
        <EmptyState
          icon={BookOpen}
          title="Todavía no hay secciones"
          description="Agregá la primera con el botón «Nueva sección» para empezar a cargar la carta."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {secciones!.map((seccion) => (
            <CartaSeccionCard
              key={seccion.id}
              seccion={seccion}
              productos={productosPorSeccion.get(seccion.id) ?? []}
              onEdit={handleEditSeccion}
              onToggleActivo={handleToggleActivo}
              onAddProducto={handleAddProducto}
              onEditProducto={handleEditProducto}
              onDeleteProducto={handleDeleteProducto}
              onToggleAgotadoProducto={handleToggleAgotadoProducto}
            />
          ))}
        </div>
      )}

      <CartaSeccionFormDialog
        open={seccionDialogOpen}
        onOpenChange={setSeccionDialogOpen}
        restauranteId={restauranteId}
        seccion={editingSeccion}
      />

      <CartaProductoFormDialog
        key={productoDialogKey}
        open={productoDialogOpen}
        onOpenChange={setProductoDialogOpen}
        restauranteId={restauranteId}
        seccionId={targetSeccionId}
        producto={editingProducto}
      />

      <CartaPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        restauranteNombre={restaurante?.nombre ?? null}
        secciones={secciones ?? []}
        productosPorSeccion={productosPorSeccion}
      />
    </div>
  )
}
