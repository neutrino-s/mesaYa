import { QrCode, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMyRestaurante } from '@/features/restaurant/hooks/useMyRestaurante'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/authStore'

import { StatCard } from '../components/StatCard'

export function HomePage() {
  const user = useAuthStore((state) => state.user)
  const { restaurante } = useMyRestaurante()

  const firstName = user?.displayName?.split(' ')[0]

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 pt-8 pb-6 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl text-foreground sm:text-3xl">
          Hola{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Así está tu turno hoy en {restaurante?.nombre ?? 'tu restaurante'}.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos hoy" sub="Próximamente" />
        <StatCard label="Mesas activas" sub="Próximamente" />
        <StatCard label="Ingresos hoy" sub="Próximamente" />
        <StatCard label="Stock bajo" sub="Próximamente" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-foreground">Pedidos en vivo</h2>
            <Badge className="rounded-full border border-accent/40 bg-accent/10 text-accent">
              Tiempo real
            </Badge>
          </div>
          <EmptyState
            icon={ShoppingBag}
            title="Todavía no hay pedidos para mostrar"
            description="El tablero de pedidos en tiempo real va a estar disponible próximamente."
            className="py-10"
          />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg text-foreground">Códigos QR de mesas</h2>
          <EmptyState
            icon={QrCode}
            title="Todavía no hay mesas"
            description="Los códigos QR van a estar disponibles cuando actives Salón & Mesas."
            className="py-8"
          />
          <Button variant="outline" size="sm" asChild>
            <Link to={paths.panelSalon}>Generar QR nueva mesa</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
