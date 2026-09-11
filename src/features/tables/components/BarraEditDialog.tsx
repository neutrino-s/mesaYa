import { Plus, QrCode, RotateCw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStaffList } from '@/features/staff/hooks/useStaffList'

import { MozoMultiSelect } from './MozoMultiSelect'
import { QrViewDialog } from './QrViewDialog'
import { useGenerarQr } from '../hooks/useGenerarQr'
import { useSetMozosAsignados } from '../hooks/useSetMozosAsignados'
import type { MesaLayoutItem } from '../domain/mesaLayoutRules'

interface BarraEditDialogProps {
  /** Ya ordenadas ascendente por `seccion`; `[]` si no hay ninguna Barra
   * en edición (el diálogo queda cerrado). */
  secciones: MesaLayoutItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateCapacidad: (localId: string, capacidad: number) => void
  onAddSeccion: () => void
  onDeleteSeccion: (localId: string) => void
  onRotate: () => void
  onDeleteGrupo: () => void
  restauranteId: string | null
  salonId: string | null
  /** `mesaId` -> `qrToken` de las mesas ya persistidas (ver
   * `SalonCanvasPage`) — cada sección es un doc `Mesa` completo, con su
   * propio código QR. */
  qrTokenByMesaId: Map<string, string>
  /** `mesaId` -> mozos asignados, misma idea que `qrTokenByMesaId` — cada
   * sección tiene su propia asignación (puede ser más de un mozo). */
  mozoIdsByMesaId: Map<string, string[]>
  /** Refresca el snapshot de mesas tras generar/regenerar/eliminar el QR o
   * cambiar los mozos asignados de alguna sección (mismo
   * `onMesaOperationalChange` de `MesaEditDialog`). */
  onMesaChanged: () => void
}

/** Edición de una Barra ya colocada: a diferencia de `MesaEditDialog`, cada
 * acción (agregar/quitar sección, cambiar capacidad, rotar) se aplica de
 * inmediato al estado local del lienzo — no hay un "Guardar" propio del
 * diálogo, el guardado real en Firestore sigue siendo el botón global
 * "Guardar diseño". Sin React Hook Form: es una lista de longitud
 * variable, no encaja en un único schema fijo.
 *
 * El código QR y los mozos asignados, en cambio, son campos operativos de
 * cada sección (cada una es un doc `Mesa` propio) — se escriben directo
 * contra Firestore, igual que en `MesaEditDialog`. */
export function BarraEditDialog({
  secciones,
  open,
  onOpenChange,
  onUpdateCapacidad,
  onAddSeccion,
  onDeleteSeccion,
  onRotate,
  onDeleteGrupo,
  restauranteId,
  salonId,
  qrTokenByMesaId,
  mozoIdsByMesaId,
  onMesaChanged,
}: BarraEditDialogProps) {
  const soloUnaSeccion = secciones.length <= 1
  const { data: staff } = useStaffList(restauranteId)
  const generarQr = useGenerarQr(restauranteId, salonId)
  const setMozosAsignados = useSetMozosAsignados(restauranteId, salonId)
  const [viewingSeccion, setViewingSeccion] = useState<MesaLayoutItem | null>(null)
  const viewingQrToken = viewingSeccion?.mesaId ? (qrTokenByMesaId.get(viewingSeccion.mesaId) ?? '') : ''

  const mozos = (staff ?? []).filter((s) => s.rol === 'mozo' && s.estado === 'activo')

  function handleGenerarQr(seccion: MesaLayoutItem) {
    if (!seccion.mesaId) return
    generarQr.mutate({ mesaId: seccion.mesaId, qrTokenAnterior: null }, { onSuccess: onMesaChanged })
  }

  function handleMozosChange(mesaId: string, mozoIds: string[]) {
    setMozosAsignados.mutate({ mesaId, mozoIds }, { onSuccess: onMesaChanged })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Barra</DialogTitle>
          <DialogDescription>
            Cada sección tiene su propio código QR y sus propios mozos asignados —
            varios comensales pueden pedir desde distintas secciones de la misma barra.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {secciones.map((seccion) => {
            const qrToken = seccion.mesaId ? (qrTokenByMesaId.get(seccion.mesaId) ?? '') : ''
            const mozoIds = seccion.mesaId ? (mozoIdsByMesaId.get(seccion.mesaId) ?? []) : []
            const qrTitle = !seccion.mesaId
              ? 'Guardá el diseño para poder generar el código QR'
              : qrToken
                ? 'Ver / imprimir código QR'
                : 'Generar código QR'

            return (
              <div key={seccion.localId} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
                <div className="flex flex-col gap-2">
                  <Label>Sección {seccion.numero}</Label>
                  <div className="flex h-13 w-20 items-center justify-center rounded-md border border-input bg-muted/40 text-sm text-muted-foreground">
                    N.º {seccion.numero}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor={`capacidad-${seccion.localId}`}>Capacidad</Label>
                  <Input
                    id={`capacidad-${seccion.localId}`}
                    type="number"
                    min={1}
                    value={seccion.capacidad}
                    onChange={(event) =>
                      onUpdateCapacidad(seccion.localId, Number(event.target.value) || 1)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={qrToken ? 'size-13 shrink-0 border-primary p-0 text-primary' : 'size-13 shrink-0 p-0'}
                  title={qrTitle}
                  disabled={!seccion.mesaId || generarQr.isPending}
                  onClick={() => (qrToken ? setViewingSeccion(seccion) : handleGenerarQr(seccion))}
                >
                  <QrCode className="size-[18px]" />
                </Button>
                <MozoMultiSelect
                  variant="compact"
                  mozos={mozos}
                  selectedIds={mozoIds}
                  onChange={(ids) => seccion.mesaId && handleMozosChange(seccion.mesaId, ids)}
                  disabled={!seccion.mesaId || setMozosAsignados.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="size-13 shrink-0 p-0 text-destructive hover:text-destructive"
                  disabled={soloUnaSeccion}
                  onClick={() => onDeleteSeccion(seccion.localId)}
                >
                  <Trash2 className="size-[18px]" />
                </Button>
              </div>
            )
          })}

          <Button type="button" variant="outline" onClick={onAddSeccion}>
            <Plus className="size-[18px]" />
            Agregar sección
          </Button>
        </div>

        <DialogFooter className="mt-2 sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onRotate}>
              <RotateCw className="size-[18px]" />
              Rotar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDeleteGrupo}
            >
              <Trash2 className="size-[18px]" />
              Eliminar barra
            </Button>
          </div>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>

      {viewingSeccion?.mesaId && viewingQrToken ? (
        <QrViewDialog
          open={viewingSeccion !== null}
          onOpenChange={(nextOpen) => !nextOpen && setViewingSeccion(null)}
          restauranteId={restauranteId}
          salonId={salonId}
          mesaId={viewingSeccion.mesaId}
          numero={viewingSeccion.numero}
          qrToken={viewingQrToken}
          onChanged={onMesaChanged}
        />
      ) : null}
    </Dialog>
  )
}
