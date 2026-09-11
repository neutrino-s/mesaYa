import { Minus, Plus, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CartaProducto, CartaProductoGrupoOpciones } from '@/types/cartaProducto'

import { formatPrecio } from '../domain/cartaRules'
import {
  alternarOpcion,
  calcularPrecioAdicional,
  describirSeleccion,
  todosLosObligatoriosCompletos,
  type CarritoPreviewItem,
  type CarritoPreviewSeleccion,
} from '../domain/cartaPreviewRules'

interface CartaPreviewOpcionesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: CartaProducto
  onConfirm: (item: Omit<CarritoPreviewItem, 'id'>) => void
}

interface GruposOpcionesSeleccionablesProps {
  grupos: CartaProductoGrupoOpciones[]
  seleccion: CarritoPreviewSeleccion
  onToggle: (grupo: CartaProductoGrupoOpciones, opcionId: string) => void
  nivel?: number
}

function GruposOpcionesSeleccionables({
  grupos,
  seleccion,
  onToggle,
  nivel = 0,
}: GruposOpcionesSeleccionablesProps) {
  return (
    <div className={cn('flex flex-col gap-4', nivel > 0 && 'mt-2 border-l-2 border-border pl-3')}>
      {grupos.map((grupo) => {
        const elegidas = seleccion[grupo.id] ?? []

        return (
          <div key={grupo.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{grupo.nombre || 'Opciones'}</span>
              {grupo.obligatorio ? (
                <span className="text-xs font-medium text-primary">Obligatorio</span>
              ) : null}
            </div>

            <div className="flex flex-col">
              {grupo.opciones.map((opcion) => {
                const elegida = elegidas.includes(opcion.id)

                return (
                  <div key={opcion.id}>
                    <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-2.5 text-sm text-foreground">
                        {grupo.seleccionMultiple ? (
                          <Checkbox
                            checked={elegida}
                            onCheckedChange={() => onToggle(grupo, opcion.id)}
                          />
                        ) : (
                          <input
                            type="radio"
                            name={`grupo-${grupo.id}`}
                            checked={elegida}
                            onChange={() => onToggle(grupo, opcion.id)}
                            className="size-5 accent-primary"
                          />
                        )}
                        {opcion.nombre || 'Opción'}
                      </span>
                      {opcion.precioAdicional > 0 ? (
                        <span className="shrink-0 text-sm text-muted-foreground">
                          +{formatPrecio(opcion.precioAdicional)}
                        </span>
                      ) : null}
                    </label>

                    {elegida && opcion.subgrupos.length > 0 ? (
                      <GruposOpcionesSeleccionables
                        grupos={opcion.subgrupos}
                        seleccion={seleccion}
                        onToggle={onToggle}
                        nivel={nivel + 1}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Sheet de "personalizá tu pedido" que se abre al agregar al carrito (en la
 * previsualización) un plato con grupos de opciones. Es 100% local: arma un
 * `CarritoPreviewItem` y se lo pasa a `onConfirm`, nunca escribe en
 * Firestore — ver `CartaPreviewDialog`. */
export function CartaPreviewOpcionesDialog({
  open,
  onOpenChange,
  producto,
  onConfirm,
}: CartaPreviewOpcionesDialogProps) {
  const [seleccion, setSeleccion] = useState<CarritoPreviewSeleccion>({})
  const [cantidad, setCantidad] = useState(1)
  const [comentario, setComentario] = useState('')

  const precioBase = producto.precio ?? 0
  const precioAdicional = calcularPrecioAdicional(producto.gruposOpciones, seleccion)
  const precioUnitario = precioBase + precioAdicional
  const puedeAgregar = todosLosObligatoriosCompletos(producto.gruposOpciones, seleccion)

  function handleToggle(grupo: CartaProductoGrupoOpciones, opcionId: string) {
    setSeleccion((actual) => alternarOpcion(actual, grupo, opcionId))
  }

  function handleConfirm() {
    onConfirm({
      productoId: producto.id,
      productoNombre: producto.nombre || 'Plato sin nombre',
      imagenUrl: producto.imagenUrl,
      cantidad,
      precioUnitario,
      detalle: describirSeleccion(producto.gruposOpciones, seleccion),
      comentario: comentario.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Personalizar {producto.nombre || 'plato'}</DialogTitle>

        <div className="flex max-h-[70dvh] flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60 text-muted-foreground">
              {producto.imagenUrl ? (
                <img src={producto.imagenUrl} alt="" className="size-full object-cover" />
              ) : (
                <UtensilsCrossed size={20} />
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <h4 className="truncate font-heading text-base text-foreground">
                {producto.nombre || 'Plato sin nombre'}
              </h4>
              {precioBase > 0 ? (
                <span className="text-sm text-muted-foreground">{formatPrecio(precioBase)}</span>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <GruposOpcionesSeleccionables
              grupos={producto.gruposOpciones}
              seleccion={seleccion}
              onToggle={handleToggle}
            />

            {producto.permiteComentarios ? (
              <div className={cn('flex flex-col gap-1.5', producto.gruposOpciones.length > 0 && 'mt-4')}>
                <Label htmlFor="comentario-plato" className="text-sm font-semibold text-foreground">
                  ¿Alguna aclaración?
                </Label>
                <Textarea
                  id="comentario-plato"
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  placeholder='Ej. "sin sal"'
                  maxLength={200}
                  className="min-h-16"
                />
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Cantidad</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
                  aria-label="Restar cantidad"
                  className="flex size-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted/60"
                >
                  <Minus size={16} />
                </button>
                <span className="w-4 text-center text-sm font-semibold text-foreground">{cantidad}</span>
                <button
                  type="button"
                  onClick={() => setCantidad((actual) => actual + 1)}
                  aria-label="Sumar cantidad"
                  className="flex size-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted/60"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <Button type="button" onClick={handleConfirm} disabled={!puedeAgregar}>
              Agregar · {formatPrecio(precioUnitario * cantidad)}
            </Button>
            {!puedeAgregar ? (
              <p className="text-center text-xs text-destructive">
                Elegí una opción de cada grupo obligatorio para continuar.
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
