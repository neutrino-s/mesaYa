import { ArrowLeft, Minus, Plus, ShoppingCart, UtensilsCrossed, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CartaProducto } from '@/types/cartaProducto'
import type { CartaSeccion } from '@/types/cartaSeccion'

import {
  actualizarCantidadCarrito,
  agregarAlCarrito,
  contarItemsCarrito,
  calcularTotalCarrito,
  quitarDelCarrito,
  type CarritoPreviewItem,
} from '../domain/cartaPreviewRules'
import { formatPrecio } from '../domain/cartaRules'
import { CartaPreviewCarritoView } from './CartaPreviewCarritoView'
import { CartaPreviewOpcionesDialog } from './CartaPreviewOpcionesDialog'
import { CartaProductoEtiquetaBadge } from './CartaProductoEtiquetaBadge'

interface CartaPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteNombre: string | null
  secciones: CartaSeccion[]
  productosPorSeccion: Map<string, CartaProducto[]>
}

/** Un producto sin ningún dato cargado no tiene sentido mostrárselo a un
 * comensal — la previsualización lo omite en silencio. */
function tieneContenido(producto: CartaProducto): boolean {
  return Boolean(producto.nombre || producto.descripcion || producto.precio !== null || producto.imagenUrl)
}

interface PreviewProductoProps {
  producto: CartaProducto
  cantidadSinOpciones: number
  onAgregarSimple: () => void
  onCantidadSimpleChange: (cantidad: number) => void
  onConfigurar: () => void
}

function PreviewProducto({
  producto,
  cantidadSinOpciones,
  onAgregarSimple,
  onCantidadSimpleChange,
  onConfigurar,
}: PreviewProductoProps) {
  const precio = formatPrecio(producto.precio)
  const requiereConfigurador = producto.gruposOpciones.length > 0 || producto.permiteComentarios
  const puedeAgregarse = !producto.agotado

  return (
    <div className={cn('flex gap-3', producto.agotado && 'opacity-50')}>
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60 text-muted-foreground">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt="" className="size-full object-cover" />
        ) : (
          <UtensilsCrossed size={22} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-heading text-base text-foreground">
            {producto.nombre || <span className="text-muted-foreground italic">Sin nombre</span>}
          </h4>
          {producto.agotado ? (
            <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
              Agotado
            </span>
          ) : null}
          {producto.etiquetas.map((etiqueta) => (
            <CartaProductoEtiquetaBadge key={etiqueta} etiqueta={etiqueta} />
          ))}
        </div>
        {producto.descripcion ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{producto.descripcion}</p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2">
          {precio ? <span className="text-sm font-semibold text-foreground">{precio}</span> : <span />}

          {puedeAgregarse ? (
            requiereConfigurador ? (
              <button
                type="button"
                onClick={onConfigurar}
                className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={14} />
                Agregar
              </button>
            ) : cantidadSinOpciones === 0 ? (
              <button
                type="button"
                onClick={onAgregarSimple}
                aria-label="Agregar al pedido"
                className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCantidadSimpleChange(cantidadSinOpciones - 1)}
                  aria-label="Restar cantidad"
                  className="flex size-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted/60"
                >
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center text-sm font-semibold text-foreground">
                  {cantidadSinOpciones}
                </span>
                <button
                  type="button"
                  onClick={() => onCantidadSimpleChange(cantidadSinOpciones + 1)}
                  aria-label="Sumar cantidad"
                  className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus size={14} />
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Simula la carta tal como la vería un comensal al escanear el QR de la
 * mesa (CLAUDE.md §7: app del comensal — mobile-first, tipografía grande,
 * sin sidebar). Todavía no existe esa app (`/mesa/:id`, ver
 * `docs/database-schema.md#código-qr`); esto es una previsualización dentro
 * del panel admin, no la pantalla real del comensal.
 *
 * Incluye un carrito de compra 100% simulado (agregar/quitar platos, elegir
 * sus grupos de opciones, ver el total) para que el administrador pruebe
 * cómo queda la carta — nada de esto escribe en Firestore ni crea un
 * `Pedido` real: es puramente estado local de este componente. */
export function CartaPreviewDialog({
  open,
  onOpenChange,
  restauranteNombre,
  secciones,
  productosPorSeccion,
}: CartaPreviewDialogProps) {
  const [vista, setVista] = useState<'carta' | 'carrito'>('carta')
  const [carrito, setCarrito] = useState<CarritoPreviewItem[]>([])
  const [productoAConfigurar, setProductoAConfigurar] = useState<CartaProducto | null>(null)

  const seccionesActivas = secciones.filter((seccion) => seccion.activo)
  const hayContenido = seccionesActivas.some((seccion) =>
    (productosPorSeccion.get(seccion.id) ?? []).some(tieneContenido),
  )
  const totalItems = contarItemsCarrito(carrito)
  const totalCarrito = calcularTotalCarrito(carrito)

  function cantidadSinOpciones(productoId: string): number {
    return carrito.find((item) => item.productoId === productoId && item.detalle.length === 0)?.cantidad ?? 0
  }

  function handleAgregarSimple(producto: CartaProducto) {
    setCarrito((actual) =>
      agregarAlCarrito(actual, {
        productoId: producto.id,
        productoNombre: producto.nombre || 'Plato sin nombre',
        imagenUrl: producto.imagenUrl,
        cantidad: 1,
        precioUnitario: producto.precio ?? 0,
        detalle: [],
        comentario: '',
      }),
    )
  }

  function handleCantidadSimpleChange(producto: CartaProducto, cantidad: number) {
    const item = carrito.find((item) => item.productoId === producto.id && item.detalle.length === 0)
    if (!item) return
    setCarrito((actual) => actualizarCantidadCarrito(actual, item.id, cantidad))
  }

  function handleConfirmarDesdeOpciones(item: Omit<CarritoPreviewItem, 'id'>) {
    setCarrito((actual) => agregarAlCarrito(actual, item))
  }

  function handleConfirmarPedido() {
    toast.info('Esto es una simulación: no se creó ningún pedido real ni se guardó nada en la base de datos.')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setVista('carta')
    onOpenChange(nextOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="max-w-[380px] gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Previsualización de la carta</DialogTitle>

          <div className="flex max-h-[80dvh] flex-col">
            <div className="relative shrink-0 bg-primary px-5 py-6 text-center text-primary-foreground">
              <DialogClose className="absolute top-4 right-4 rounded-full bg-black/10 p-1.5 text-primary-foreground outline-none transition-colors hover:bg-black/20">
                <X size={18} />
                <span className="sr-only">Cerrar</span>
              </DialogClose>
              {vista === 'carrito' ? (
                <button
                  type="button"
                  onClick={() => setVista('carta')}
                  className="absolute top-4 left-4 rounded-full bg-black/10 p-1.5 text-primary-foreground outline-none transition-colors hover:bg-black/20"
                >
                  <ArrowLeft size={18} />
                  <span className="sr-only">Volver a la carta</span>
                </button>
              ) : null}
              <span className="font-heading text-xl">{restauranteNombre ?? 'Tu restaurante'}</span>
              <p className="mt-1 text-xs opacity-80">
                {vista === 'carta' ? 'Así ven la carta tus comensales' : 'Tu pedido'}
              </p>
            </div>

            <div className="rounded-none bg-secondary/60 px-4 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
              Modo prueba — nada de esto se guarda ni afecta pedidos reales
            </div>

            {vista === 'carrito' ? (
              <CartaPreviewCarritoView
                carrito={carrito}
                onCantidadChange={(itemId, cantidad) =>
                  setCarrito((actual) => actualizarCantidadCarrito(actual, itemId, cantidad))
                }
                onQuitar={(itemId) => setCarrito((actual) => quitarDelCarrito(actual, itemId))}
                onConfirmar={handleConfirmarPedido}
              />
            ) : (
              <div className="flex-1 overflow-y-auto bg-background px-4 py-5">
                {!hayContenido ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Todavía no hay platos para mostrarle a tus comensales.
                  </p>
                ) : (
                  seccionesActivas.map((seccion) => {
                    const productos = (productosPorSeccion.get(seccion.id) ?? []).filter(tieneContenido)
                    if (productos.length === 0) return null

                    return (
                      <section key={seccion.id} className="mb-6 last:mb-0">
                        <h3 className="mb-3 font-heading text-lg text-foreground">{seccion.nombre}</h3>
                        <div className="flex flex-col gap-4">
                          {productos.map((producto) => (
                            <PreviewProducto
                              key={producto.id}
                              producto={producto}
                              cantidadSinOpciones={cantidadSinOpciones(producto.id)}
                              onAgregarSimple={() => handleAgregarSimple(producto)}
                              onCantidadSimpleChange={(cantidad) =>
                                handleCantidadSimpleChange(producto, cantidad)
                              }
                              onConfigurar={() => setProductoAConfigurar(producto)}
                            />
                          ))}
                        </div>
                      </section>
                    )
                  })
                )}
              </div>
            )}

            {vista === 'carta' && totalItems > 0 ? (
              <button
                type="button"
                onClick={() => setVista('carrito')}
                className="flex shrink-0 items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart size={18} />
                  Ver pedido ({totalItems})
                </span>
                <span className="text-sm font-semibold">{formatPrecio(totalCarrito)}</span>
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {productoAConfigurar ? (
        <CartaPreviewOpcionesDialog
          key={productoAConfigurar.id}
          open={Boolean(productoAConfigurar)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setProductoAConfigurar(null)
          }}
          producto={productoAConfigurar}
          onConfirm={handleConfirmarDesdeOpciones}
        />
      ) : null}
    </>
  )
}
