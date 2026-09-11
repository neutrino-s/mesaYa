import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthAnimatedOutlet } from '@/components/shared/AuthAnimatedOutlet'
import { PanelLayout } from '@/components/shared/PanelLayout'
import { useAuthStore } from '@/stores/authStore'

import { paths } from './paths'

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({
    default: m.LoginPage,
  })),
)
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  })),
)
const SplashPage = lazy(() =>
  import('@/features/auth/pages/SplashPage').then((m) => ({
    default: m.SplashPage,
  })),
)
const HomePage = lazy(() =>
  import('@/features/home/pages/HomePage').then((m) => ({
    default: m.HomePage,
  })),
)
const StaffPage = lazy(() =>
  import('@/features/staff/pages/StaffPage').then((m) => ({
    default: m.StaffPage,
  })),
)
const CartaPage = lazy(() =>
  import('@/features/menu/pages/CartaPage').then((m) => ({
    default: m.CartaPage,
  })),
)
const SalonPage = lazy(() =>
  import('@/features/tables/pages/SalonPage').then((m) => ({
    default: m.SalonPage,
  })),
)
const SalonCanvasPage = lazy(() =>
  import('@/features/tables/pages/SalonCanvasPage').then((m) => ({
    default: m.SalonCanvasPage,
  })),
)
const PedidosPage = lazy(() =>
  import('@/features/orders/pages/PedidosPage').then((m) => ({
    default: m.PedidosPage,
  })),
)
const MesasPage = lazy(() =>
  import('@/features/orders/pages/MesasPage').then((m) => ({
    default: m.MesasPage,
  })),
)
const MenusPage = lazy(() =>
  import('@/features/menu/pages/MenusPage').then((m) => ({
    default: m.MenusPage,
  })),
)
const StockPage = lazy(() =>
  import('@/features/stock/pages/StockPage').then((m) => ({
    default: m.StockPage,
  })),
)
const TurnosPage = lazy(() =>
  import('@/features/turnos/pages/TurnosPage').then((m) => ({
    default: m.TurnosPage,
  })),
)
const PromocionesPage = lazy(() =>
  import('@/features/posts/pages/PromocionesPage').then((m) => ({
    default: m.PromocionesPage,
  })),
)
const ReportesPage = lazy(() =>
  import('@/features/metrics/pages/ReportesPage').then((m) => ({
    default: m.ReportesPage,
  })),
)
const ConfiguracionPage = lazy(() =>
  import('@/features/settings/pages/ConfiguracionPage').then((m) => ({
    default: m.ConfiguracionPage,
  })),
)
const PerfilPage = lazy(() =>
  import('@/features/settings/pages/PerfilPage').then((m) => ({
    default: m.PerfilPage,
  })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
      Cargando…
    </div>
  )
}

/** Guarda el `/panel`: sin sesión, redirige a `/login`. Mientras Firebase
 * todavía no resolvió el estado inicial, no redirige a ningún lado para no
 * mandar a un usuario con sesión válida al login por un instante. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)

  if (status === 'loading') return <RouteFallback />
  if (status === 'signedOut') return <Navigate to={paths.login} replace />
  return children
}

/** Punto de entrada: manda a `/panel` con sesión, a `/login` sin ella. */
function RootRedirect() {
  const status = useAuthStore((state) => state.status)

  if (status === 'loading') return <RouteFallback />
  return (
    <Navigate to={status === 'signedIn' ? paths.panel : paths.login} replace />
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<AuthAnimatedOutlet />}>
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.register} element={<RegisterPage />} />
        </Route>
        <Route
          path={paths.splash}
          element={
            <ProtectedRoute>
              <SplashPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <PanelLayout />
            </ProtectedRoute>
          }
        >
          <Route path={paths.panel} element={<HomePage />} />
          <Route path={paths.panelPedidos} element={<PedidosPage />} />
          <Route path={paths.panelMesas} element={<MesasPage />} />
          <Route path={paths.panelStaff} element={<StaffPage />} />
          <Route path={paths.panelCarta} element={<CartaPage />} />
          <Route path={paths.panelMenus} element={<MenusPage />} />
          <Route path={paths.panelSalon} element={<SalonPage />} />
          <Route path={paths.panelSalonLienzo} element={<SalonCanvasPage />} />
          <Route path={paths.panelStock} element={<StockPage />} />
          <Route path={paths.panelTurnos} element={<TurnosPage />} />
          <Route path={paths.panelPromociones} element={<PromocionesPage />} />
          <Route path={paths.panelReportes} element={<ReportesPage />} />
          <Route path={paths.panelConfiguracion} element={<ConfiguracionPage />} />
          <Route path={paths.panelPerfil} element={<PerfilPage />} />
        </Route>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  )
}
