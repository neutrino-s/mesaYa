import { Loader2, Printer, RefreshCw, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'

import { useEliminarQr } from '../hooks/useEliminarQr'
import { useGenerarQr } from '../hooks/useGenerarQr'

interface QrViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restauranteId: string | null
  salonId: string | null
  mesaId: string
  numero: string
  qrToken: string
  /** Refresca el snapshot de mesas del lienzo tras regenerar o eliminar el
   * código (mismo `onMesaOperationalChange` de `MesaEditDialog`). */
  onChanged: () => void
}

/** Ver/imprimir el código QR de una mesa, y desde acá mismo regenerarlo
 * (por un código extraviado/dañado) o eliminarlo. Único lugar que agrupa
 * estas tres acciones — tanto `MesaEditDialog` como `BarraEditDialog` lo
 * reutilizan en vez de repetir la lógica por cada sección.
 *
 * La impresión usa `window.print()` — la regla global en `index.css`
 * (`@media print { #root, ... }`) deja visible únicamente el contenido de
 * este modal (Radix lo porta fuera de `#root`); acá solo hace falta ocultar
 * los botones con `print:hidden`. */
export function QrViewDialog({
  open,
  onOpenChange,
  restauranteId,
  salonId,
  mesaId,
  numero,
  qrToken,
  onChanged,
}: QrViewDialogProps) {
  const { restaurante } = useMyRestaurante()
  const generarQr = useGenerarQr(restauranteId, salonId)
  const eliminarQr = useEliminarQr(restauranteId, salonId)
  const url = `${window.location.origin}/mesa/${qrToken}`

  function handleRegenerar() {
    generarQr.mutate({ mesaId, qrTokenAnterior: qrToken }, { onSuccess: onChanged })
  }

  function handleEliminar() {
    eliminarQr.mutate(
      { mesaId, qrToken },
      {
        onSuccess: () => {
          onChanged()
          onOpenChange(false)
        },
      },
    )
  }

  const busy = generarQr.isPending || eliminarQr.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="print:hidden">
          <DialogTitle>Código QR — Mesa {numero}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2 text-center">
          {restaurante ? (
            <span className="font-heading text-base text-foreground">{restaurante.nombre}</span>
          ) : null}
          <span className="font-heading text-lg text-foreground">Mesa {numero}</span>
          <div className="rounded-xl border border-border bg-white p-4">
            <QRCodeSVG value={url} size={200} />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2.5 print:hidden">
          <Button
            type="button"
            variant="outline"
            className="mr-auto text-destructive hover:text-destructive"
            onClick={handleEliminar}
            disabled={busy}
          >
            <Trash2 className="size-[18px]" />
            Eliminar
          </Button>
          <Button type="button" variant="outline" onClick={handleRegenerar} disabled={busy}>
            {generarQr.isPending ? (
              <Loader2 className="size-[18px] animate-spin" />
            ) : (
              <RefreshCw className="size-[18px]" />
            )}
            Regenerar
          </Button>
          <Button type="button" onClick={() => window.print()} disabled={busy}>
            <Printer className="size-[18px]" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
