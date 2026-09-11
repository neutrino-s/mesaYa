# CLAUDE.md — Restaurant Manager (Prototipo)

Este archivo define las reglas de stack, estilo y librerías del proyecto.
Claude Code debe seguir estas convenciones en TODO el código que genere, sin excepciones,
salvo que se le indique explícitamente lo contrario en el prompt puntual.

---

## 1. Stack técnico (decisiones cerradas, no cambiar)

- **Framework**: React 19 + Vite (SPA, sin SSR en esta etapa de prototipo)
- **Lenguaje**: TypeScript (siempre, no usar `.jsx`, todo `.tsx`)
- **Backend**: Firebase
  - Firestore como base de datos principal (tiempo real con `onSnapshot`)
  - Firebase Auth (email/password + posible login con Google para staff)
  - Firebase Storage (imágenes de platos, logo del restaurante, fotos de publicaciones)
  - Cloud Functions solo si hace falta lógica server-side (ej: validar pago antes de confirmar pedido)
- **Routing**: React Router v6
- **Gestión de estado global**: Zustand (liviano, evitar Redux)
- **Formularios**: React Hook Form + Zod (validación de schemas)
- **Fetching/cache de datos de Firestore**: TanStack Query (React Query) envolviendo los listeners cuando aplique
- **Pagos**: SDK de Mercado Pago (Checkout Pro o Checkout API, a confirmar)

No introducir librerías fuera de esta lista sin justificar el motivo antes de instalar.

---

## 2. Estilos

- **Tailwind CSS** como base de estilado. No usar CSS-in-JS ni styled-components.
- **shadcn/ui** para componentes de UI (botones, modales, tablas, dropdowns, tabs, dialogs, toasts, forms).
  - Instalar componentes vía CLI de shadcn a medida que se necesiten, no copiar todo el kit de una.
  - Los componentes de shadcn van en `src/components/ui/` y NO se editan a mano salvo ajustes de theme.
- **tailwind-merge** + **clsx** (o el helper `cn()` que trae shadcn) para componer clases condicionales.
- **Framer Motion** (`motion`) para microinteracciones: hover en cards, transición de modales, aparición de toasts, transición entre pasos del pedido. Usar con moderación — sutil, no vistoso.

### Paleta y tono visual
Buscamos "moderno pero discreto", profesional, no genérico de bootstrap ni sobrecargado de color:

- **Neutros como base**: escala de grises/slate (Tailwind `slate` o `zinc`) para fondos, bordes, texto secundario.
- **Un solo color de acento** (a definir con el branding del restaurante, pero por defecto usar algo tipo `emerald` o `indigo` oscuro) — usarlo SOLO para acciones primarias (botón "Confirmar pedido", estados activos, links importantes). No pintar todo con el color de marca.
- **Bordes redondeados moderados**: `rounded-lg` / `rounded-xl` como estándar. Evitar `rounded-full` salvo en avatares/badges.
- **Sombras sutiles**: `shadow-sm` en cards, `shadow-md` solo en elementos flotantes (modales, dropdowns). Nunca sombras exageradas.
- **Espaciado generoso**: preferir `p-6`, `gap-4/6` en vez de layouts apretados. El aire en el diseño es lo que lo hace ver "profesional".
- **Tipografía**: **Caprasimo** para títulos/headings (`h1`-`h6`, vía la clase utilitaria `font-heading`) y **Figtree** para el texto de cuerpo (fuente por defecto, `font-sans`). Ambas cargadas vía `@fontsource` (`@fontsource/caprasimo`, `@fontsource/figtree`), importadas en `main.tsx`. Caprasimo es un display font de un solo peso (400) — no combinar con `font-semibold`/`font-bold`. Texto de cuerpo en `text-sm`/`text-base` con buen contraste pero sin negro puro (`text-slate-700/800` en vez de `text-black`).

### Modo oscuro
Dejar preparado con `dark:` de Tailwind desde el inicio (el panel de cocina probablemente se use en un entorno con poca luz).

---

## 3. Iconos

- **lucide-react** como única librería de íconos. No mezclar con react-icons ni font-awesome.
- Tamaño estándar `size={18}` o `size={20}` en botones e inputs; `size={16}` en badges/tags pequeños.
- Los íconos siempre acompañan texto en acciones importantes (no íconos huérfanos sin label, salvo en toolbars muy compactas con `title`/tooltip).

---

## 4. Librerías específicas por funcionalidad

| Funcionalidad | Librería sugerida |
|---|---|
| Generación de código QR por mesa | `qrcode.react` |
| Gráficos de métricas de pedidos | `recharts` |
| Tablas de datos (staff, stock, pedidos) | `@tanstack/react-table` + componentes de shadcn/ui table |
| Notificaciones/toasts | `sonner` (integra bien con shadcn) |
| Drag & drop (armado de menú, orden de categorías) | `@dnd-kit/core` |
| Fechas | `date-fns` |
| Subida/preview de imágenes (platos, publicaciones) | input nativo + preview con `URL.createObjectURL`, subida a Firebase Storage |

---

## 5. Arquitectura (Clean Architecture adaptada a React)

El proyecto sigue separación por capas dentro de cada feature. No es Clean Architecture "pura" de backend
(no hay entities/use-cases en el sentido estricto), sino una adaptación práctica para frontend con Firebase.
El objetivo: la UI nunca habla directo con Firestore, y la lógica de negocio no depende de React.

Cada feature (`src/features/orders/`, por ejemplo) se organiza en estas capas:

```
features/orders/
  domain/
    types.ts          -> interfaces/tipos del dominio (Order, OrderItem, OrderStatus)
    orderRules.ts      -> lógica de negocio pura, sin React ni Firebase (ej: calcular total, validar transición de estado)
  data/
    orderRepository.ts -> ÚNICO lugar que importa Firestore para este feature (getDocs, onSnapshot, addDoc, etc.)
  hooks/
    useOrders.ts        -> hook que consume orderRepository + expone estado a los componentes (vía React Query o listeners)
    useCreateOrder.ts
  components/
    OrderCard.tsx
    OrderList.tsx
    OrderStatusBadge.tsx
  pages/
    OrdersPage.tsx       -> arma el layout de la pantalla usando components + hooks. No tiene lógica de negocio propia.
```

Reglas concretas:

1. **`components/` y `pages/` nunca importan Firebase directamente.** Solo consumen hooks (`useOrders`, `useCreateOrder`, etc.).
2. **`data/` es la única capa que conoce Firestore.** Si mañana cambiamos de backend, en teoría solo se reescribe esta capa.
3. **`domain/`** no importa React ni Firebase — son funciones puras testeables (ej: `calcularTotalPedido(items)`, `puedeCancelarPedido(status)`).
4. Los **hooks** son el puente: llaman a `data/`, aplican reglas de `domain/` si hace falta, y devuelven algo listo para pintar en la UI (loading, error, data).
5. Tipos compartidos entre features (ej: `User`, `Restaurant`) van en `src/types/`, no duplicados en cada `domain/`.

Al pedir una feature nueva a Claude Code, especificar explícitamente que respete esta separación
(ej: "creá el feature de stock siguiendo la arquitectura por capas del CLAUDE.md").

---

## 5.1 Lazy loading de componentes

- **Rutas**: todas las páginas se cargan con `React.lazy()` + `Suspense`, nunca con imports estáticos directos en el router. Esto separa el bundle del panel admin del bundle de la app del comensal (son experiencias distintas, ver sección 7 — no tiene sentido que el comensal descargue el código del CRUD de staff).

```tsx
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'));

<Route
  path="/admin/orders"
  element={
    <Suspense fallback={<PageSkeleton />}>
      <OrdersPage />
    </Suspense>
  }
/>
```

- **Componentes pesados dentro de una página** (ej: gráficos de métricas con `recharts`, el editor de imágenes de publicaciones) también van con `lazy()` si no son visibles en el primer render (ej: están en una tab secundaria o un modal que no siempre se abre).
- **Nunca** hacer lazy loading de componentes chicos o de uso inmediato (botones, inputs, cards livianas) — el overhead de la carga async no vale la pena y solo genera parpadeos.
- El `fallback` de cada `Suspense` debe ser un skeleton coherente con el layout real (no un spinner genérico centrado), usando los componentes `Skeleton` de shadcn/ui.
- Regla práctica: si el chunk de un componente no supera ~15-20kb, probablemente no vale la pena hacerlo lazy.

---

## 5.2 Modelo de datos (Firestore)

El esquema completo de la base de datos vive en `docs/database-schema.md` — es la fuente de verdad
para nombres de colecciones, campos, tipos y relaciones. Antes de generar código que lea o escriba
en Firestore (repositorios en `data/`, tipos en `domain/types.ts`), consultar la sección correspondiente
de ese documento en vez de inferir o inventar la estructura.

Cada colección tiene un estado marcado (🟢 Definido / 🟡 En diseño / 🔴 Pendiente). No generar código
para una entidad 🔴 o 🟡 sin confirmar primero que el diseño está cerrado — avisar y preguntar en vez
de asumir una estructura por default.

Al pedir una feature que toca Firestore, referenciar la sección puntual del esquema
(ej: "creá el repositorio de mesas siguiendo `docs/database-schema.md#mesa`"), no asumir que
Claude Code va a elegir sola la sección correcta dentro de un documento largo.

---

## 6. Estructura de carpetas esperada

```
docs/
  database-schema.md  -> esquema completo de Firestore (ver sección 5.2)
src/
  components/
    ui/              -> componentes shadcn (no tocar a mano)
    shared/          -> componentes propios reutilizables (Navbar, Sidebar, EmptyState, etc)
  features/
    menu/
    staff/
    tables/          -> mesas y salones
    orders/
    stock/
    posts/           -> publicaciones
    metrics/
  lib/
    firebase.ts      -> init de firebase
    utils.ts         -> cn() y helpers
  stores/            -> stores de zustand
  hooks/
  routes/
  types/
```

Cada feature (`menu`, `staff`, `tables`, etc.) tiene sus propios componentes, hooks y tipos adentro de su carpeta. Evitar un `components/` gigante y desordenado.

---

## 6.1 Convenciones de componentes

- Componentes funcionales con TypeScript, props tipadas explícitamente con `interface Props {}`.
- Nombrar archivos en PascalCase para componentes (`OrderCard.tsx`), camelCase para hooks (`useOrders.ts`).
- Toda pantalla de listado (staff, mesas, stock) sigue el mismo patrón visual: header con título + acción primaria a la derecha, filtros/búsqueda debajo, tabla o grid de cards, estados de loading con skeletons (no spinners genéricos) y estados vacíos con ilustración/mensaje + CTA.
- Los modales de "crear/editar" usan el mismo Dialog de shadcn con el mismo layout de footer (Cancelar a la izquierda en outline, acción primaria a la derecha).

---

## 7. Dos superficies distintas de la app

Recordar que este proyecto tiene dos experiencias con necesidades de diseño distintas:

1. **Panel admin/staff** (`/admin/...`): denso en datos, sidebar de navegación, tablas, gráficos. Prioriza eficiencia visual.
2. **App del comensal** (`/mesa/:id`): mobile-first estricto, muy poca fricción, tipografía grande y legible, botones grandes tap-friendly (mínimo 44px de alto), sin sidebar ni menús complejos. El flujo es: ver menú → armar pedido → pagar → confirmación → estado del pedido en vivo.

No reutilizar el mismo Layout/Navbar entre ambas superficies.

---

## 8. Al generar código nuevo, Claude Code debe:

1. Revisar si ya existe un componente de shadcn/ui que resuelva la necesidad antes de crear uno propio.
2. Usar Tailwind + `cn()`, nunca estilos inline salvo casos puntuales de valores dinámicos (ej: `width` calculado).
3. Tipar todo con TypeScript, incluyendo los documentos de Firestore (crear interfaces en `types/`).
4. Mantener el acento de color consistente y no introducir colores nuevos sin que se indique.
5. Priorizar componentes accesibles (shadcn/Radix ya lo resuelve en gran parte — no romper el manejo de foco/aria que traen por defecto).