import { format } from 'date-fns'
import { AlertTriangle, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPrecio } from '@/features/menu/domain/cartaRules'

import { detalleDeItem, ESTADO_LABELS, horaInicioEstadoActual, observacionesDePedido } from '../domain/pedidoBoardRules'
import type { MesaPedidosGrupo } from '../domain/pedidoBoardRules'
import { precioTotalItem } from '../domain/pedidoRules'

interface MesaPedidosDialogProps {
  /** `null` cierra el diálogo. */
  grupo: MesaPedidosGrupo | null
  mozoNombre: string | null
  onOpenChange: (open: boolean) => void
}

/** Detalle completo de una mesa activa: número de mesa, mozo y monto total
 * arriba (mismo resumen que `MesaPedidosCard`), y debajo un listado con
 * cada pedido en curso — solo los que existen, ver `agruparPedidosPorMesa`
 * — mostrando su estado actual, la hora en que entró a ese estado y qué
 * pidió el comensal con su costo. Abierto desde `MesaPedidosCard`. */
export function MesaPedidosDialog({ grupo, mozoNombre, onOpenChange }: MesaPedidosDialogProps) {
  return (
    <Dialog open={grupo !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {grupo && (
          <>
            <DialogHeader>
              <DialogTitle>Mesa {grupo.mesaNumero}</DialogTitle>
              <div className="flex items-center justify-between gap-2">
                <DialogDescription className="flex items-center gap-1.5">
                  <User size={14} />
                  {mozoNombre ?? 'Sin mozo asignado'}
                </DialogDescription>
                <span className="text-sm font-medium text-foreground">{formatPrecio(grupo.montoTotal)}</span>
              </div>
            </DialogHeader>

            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
              {grupo.pedidos.map((pedido) => {
                const observaciones = observacionesDePedido(pedido)
                return (
                  <div key={pedido.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-accent/10 text-accent">{ESTADO_LABELS[pedido.estado]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(horaInicioEstadoActual(pedido).toDate(), 'HH:mm')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatPrecio(pedido.total)}</span>
                    </div>

                    <ul className="mt-3 flex flex-col gap-1.5 text-sm text-foreground">
                      {pedido.items.map((item) => {
                        const detalle = detalleDeItem(item)
                        return (
                          <li key={item.id} className="flex flex-col">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex gap-1.5">
                                <span className="text-muted-foreground">{item.cantidad}x</span>
                                {item.productoNombre}
                              </div>
                              <span className="shrink-0 text-muted-foreground">
                                {formatPrecio(precioTotalItem(item))}
                              </span>
                            </div>
                            {detalle && <p className="pl-5 text-xs text-muted-foreground">{detalle}</p>}
                          </li>
                        )
                      })}
                    </ul>

                    {observaciones.length > 0 && (
                      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>{observaciones.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
