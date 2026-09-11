import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { CuadrantesTab } from '../components/CuadrantesTab'
import { FichajeTab } from '../components/FichajeTab'
import { HorarioLocalForm } from '../components/HorarioLocalForm'
import { SolicitudesTab } from '../components/SolicitudesTab'

// `recharts` es pesado y no aporta nada al primer render de las otras
// pestañas — lazy() acá, no en el resto de Jornadas (ver CLAUDE.md §5.1).
const MetricasTab = lazy(() =>
  import('../components/MetricasTab').then((m) => ({ default: m.MetricasTab })),
)

function MetricasTabFallback() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64 rounded-full" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

/** "Jornadas": horario del local (ya existía) + cuadrantes de personal +
 * fichaje + solicitudes + métricas (nuevos), las cinco fases del módulo
 * completo. */
const TAB_VALUES = ['horario', 'cuadrantes', 'fichaje', 'solicitudes', 'metricas'] as const

export function TurnosPage() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  // Permite llegar directo a una pestaña puntual (ej. desde la campana de
  // notificaciones a "Solicitudes") sin controlar el `Tabs` — solo se lee
  // una vez al montar la página.
  const initialTab = (TAB_VALUES as readonly string[]).includes(tabParam ?? '') ? tabParam! : 'cuadrantes'

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl text-foreground">Jornadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Horario del local, cuadrante de turnos, fichaje, solicitudes y métricas del equipo.
        </p>
      </header>

      <Tabs defaultValue={initialTab} className="flex flex-col gap-6">
        <TabsList>
          <TabsTrigger value="horario">Horario del local</TabsTrigger>
          <TabsTrigger value="cuadrantes">Cuadrantes</TabsTrigger>
          <TabsTrigger value="fichaje">Fichaje</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="horario">
          <HorarioLocalForm />
        </TabsContent>
        <TabsContent value="cuadrantes">
          <CuadrantesTab />
        </TabsContent>
        <TabsContent value="fichaje">
          <FichajeTab />
        </TabsContent>
        <TabsContent value="solicitudes">
          <SolicitudesTab />
        </TabsContent>
        <TabsContent value="metricas">
          <Suspense fallback={<MetricasTabFallback />}>
            <MetricasTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
