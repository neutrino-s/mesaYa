/**
 * Smoke test del generador puro (`pedidoGenerator.ts`), sin Firestore.
 * No es un framework de test (el proyecto no tiene uno instalado) — son
 * asserts que tiran si algo se rompe. Correr con `npm run selftest:pedidos`
 * después de tocar `pedidoGenerator.ts` o el shape de `gruposOpciones`.
 */
import assert from 'node:assert/strict'
import { createRng } from './random.js'
import {
  generarCasosQA,
  generarPedidosParaMesas,
  type GrupoOpcionesSeed,
  type MesaSeed,
  type PedidoEstado,
  type ProductoSeed,
  type StaffSeed,
} from './pedidoGenerator.js'

/** Mismo mirror que `TRANSICIONES_VALIDAS` en
 * `src/features/orders/domain/pedidoRules.ts` — se usa para validar que
 * `historialEstados` solo avanza por transiciones realmente válidas. */
const TRANSICIONES_VALIDAS: Record<PedidoEstado, PedidoEstado[]> = {
  pendiente: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: ['pagado'],
  pagado: [],
  cancelado: [],
}

const TODOS_LOS_ESTADOS: readonly PedidoEstado[] = [
  'pendiente',
  'en_preparacion',
  'listo',
  'entregado',
  'pagado',
  'cancelado',
]

const grupoSalsaObligatorio: GrupoOpcionesSeed = {
  id: 'grp_salsa',
  nombre: 'Salsa',
  obligatorio: true,
  seleccionMultiple: false,
  opciones: [
    { id: 'op_bolo', nombre: 'Bolognesa', precioAdicional: 0, subgrupos: [] },
    { id: 'op_4q', nombre: '4 quesos', precioAdicional: 800, subgrupos: [] },
  ],
}

const grupoAderezoAnidado: GrupoOpcionesSeed = {
  id: 'grp_aderezo',
  nombre: 'Aderezo',
  obligatorio: false,
  seleccionMultiple: true,
  opciones: [
    { id: 'op_oliva', nombre: 'Aceite de oliva', precioAdicional: 0, subgrupos: [] },
    { id: 'op_limon', nombre: 'Limón', precioAdicional: 0, subgrupos: [] },
  ],
}

const grupoGuarnicionOpcional: GrupoOpcionesSeed = {
  id: 'grp_guarnicion',
  nombre: 'Guarnición',
  obligatorio: false,
  seleccionMultiple: false,
  opciones: [
    { id: 'op_pure', nombre: 'Puré de papas', precioAdicional: 0, subgrupos: [] },
    { id: 'op_ensalada', nombre: 'Ensalada', precioAdicional: 0, subgrupos: [grupoAderezoAnidado] },
  ],
}

const productos: ProductoSeed[] = [
  {
    id: 'prod_gnocchi',
    seccionId: 'sec_principales',
    nombre: 'Gnocchi de la casa',
    precio: 12000,
    agotado: false,
    gruposOpciones: [grupoSalsaObligatorio, grupoGuarnicionOpcional],
    permiteComentarios: true,
  },
  {
    id: 'prod_empanadas',
    seccionId: 'sec_entradas',
    nombre: 'Empanadas de carne',
    precio: 6500,
    agotado: false,
    gruposOpciones: [],
    permiteComentarios: true,
  },
  {
    id: 'prod_agua',
    seccionId: 'sec_bebidas',
    nombre: 'Agua mineral',
    precio: 3000,
    agotado: false,
    gruposOpciones: [],
    permiteComentarios: false,
  },
]

const mesas: MesaSeed[] = Array.from({ length: 12 }, (_, i) => ({
  id: `mesa_${i + 1}`,
  salonId: 'salon_principal',
  numero: String(i + 1),
  qrToken: i % 3 === 0 ? '' : `qr-${i + 1}`,
}))

const mozos: StaffSeed[] = [{ id: 'staff_lucia' }, { id: 'staff_juan' }]

const opts = { pedidosMax: 2, itemsMax: 4, minutosAtrasMin: 5, minutosAtrasMax: 90, ahoraMs: Date.now() }

const estadosVistos = new Set<PedidoEstado>()

// Corre con varias semillas para no depender de una tirada particular.
for (const seed of [1, 2, 3, 42, 12345]) {
  const rng = createRng(seed)
  const pedidos = generarPedidosParaMesas(mesas, productos, mozos, rng, opts)

  assert.ok(pedidos.length >= mesas.length, 'al menos 1 pedido por mesa')
  assert.ok(pedidos.length <= mesas.length * opts.pedidosMax, 'no más de pedidosMax por mesa')

  for (const pedido of pedidos) {
    estadosVistos.add(pedido.estado)
    assert.ok(TODOS_LOS_ESTADOS.includes(pedido.estado), `"${pedido.estado}" debe ser un PedidoEstado válido`)
    assert.ok(
      pedido.items.length >= 1 && pedido.items.length <= Math.min(opts.itemsMax, productos.length),
      'cantidad de items dentro de rango (nunca más que productos distintos disponibles)',
    )

    // Nunca dos líneas del mismo producto: un plato repetido se refleja en
    // `cantidad`, no en dos items separados (bug reportado en el tablero).
    const productoIds = pedido.items.map((item) => item.productoId)
    assert.equal(new Set(productoIds).size, productoIds.length, 'no hay productoId repetido entre los items')

    assert.equal(pedido.subtotal, pedido.total, 'subtotal === total (sin descuentos/propina todavía)')
    assert.ok(pedido.createdAtMs <= opts.ahoraMs, 'createdAt no puede ser futuro')
    assert.ok(
      pedido.updatedAtMs >= pedido.createdAtMs && pedido.updatedAtMs <= opts.ahoraMs,
      'updatedAt entre createdAt y ahora',
    )
    // El pedido debe "verse" generado el día de la corrida del script.
    assert.equal(
      new Date(pedido.createdAtMs).toDateString(),
      new Date(opts.ahoraMs).toDateString(),
      'createdAt debe ser la fecha de hoy (día de la corrida del script)',
    )
    if (pedido.estado === 'pendiente') {
      assert.equal(pedido.updatedAtMs, pedido.createdAtMs, 'pendiente: todavía no pasó nada desde que se creó')
    }

    // `motivoCancelacion` obligatorio si y solo si el estado es `cancelado`
    // — mismo invariante que documenta `docs/database-schema.md#pedido--comanda`.
    if (pedido.estado === 'cancelado') {
      assert.ok(pedido.motivoCancelacion && pedido.motivoCancelacion.trim() !== '', 'cancelado requiere motivo')
    } else {
      assert.equal(pedido.motivoCancelacion, null, 'motivoCancelacion es null fuera de "cancelado"')
    }

    // `historialEstados`: arranca en "pendiente" @ createdAt, termina en el
    // estado final @ updatedAt, nunca retrocede en el tiempo, y cada paso es
    // una transición realmente válida de la máquina de estados.
    const historial = pedido.historialEstados
    assert.ok(historial.length >= 1, 'historialEstados nunca está vacío')
    assert.equal(historial[0].estado, 'pendiente', 'el historial siempre arranca en "pendiente"')
    assert.equal(historial[0].enMs, pedido.createdAtMs, 'la primera entrada coincide con createdAt')
    assert.equal(historial[historial.length - 1].estado, pedido.estado, 'la última entrada es el estado actual')
    assert.equal(historial[historial.length - 1].enMs, pedido.updatedAtMs, 'la última entrada coincide con updatedAt')
    for (let i = 1; i < historial.length; i++) {
      assert.ok(historial[i].enMs >= historial[i - 1].enMs, 'los timestamps del historial nunca retroceden')
      assert.ok(historial[i].enMs <= opts.ahoraMs, 'ninguna entrada del historial puede ser futura')
      assert.ok(
        TRANSICIONES_VALIDAS[historial[i - 1].estado].includes(historial[i].estado),
        `"${historial[i - 1].estado}" -> "${historial[i].estado}" no es una transición válida`,
      )
    }

    const totalCalculado = pedido.items.reduce((t, item) => t + item.precioUnitario * item.cantidad, 0)
    assert.equal(pedido.total, totalCalculado, 'total = suma de precioUnitario*cantidad de los items')

    for (const item of pedido.items) {
      const producto = productos.find((p) => p.id === item.productoId)!
      assert.ok(item.precioUnitario >= (producto.precio ?? 0), 'precioUnitario nunca es menor al precio base')
      if (!producto.permiteComentarios) {
        assert.equal(item.comentario, '', 'no hay comentario si el plato no lo permite')
      }

      // El grupo "Salsa" es obligatorio en gnocchi: si el item es un
      // gnocchi, siempre debe aparecer en el detalle.
      if (producto.id === 'prod_gnocchi') {
        const tieneSalsa = item.detalle.some((g) => g.grupoNombre === 'Salsa' && g.opciones.length > 0)
        assert.ok(tieneSalsa, 'el grupo obligatorio "Salsa" siempre debe tener una opción elegida')
      }
    }
  }

}

// Con 5 semillas y ~12 mesas por semilla (1-2 pedidos c/u) hay volumen de
// sobra para esperar que, sumando todas las corridas, aparezcan los 6
// estados — si nunca aparece alguno, `ESTADOS_POSIBLES_PONDERADOS` está mal armado.
for (const estado of TODOS_LOS_ESTADOS) {
  assert.ok(estadosVistos.has(estado), `el estado "${estado}" nunca apareció en ninguna semilla probada`)
}

// ── "Hoy" incluso corriendo pegado a la medianoche ──────────────────────────
// Fuerza `ahoraMs` a 00:10 de un día fijo: con el margen de solo 10 minutos
// desde las 00:00, la duración deseada (hasta 90min para "pendiente", o la
// suma del historial para el resto) casi siempre excede ese margen, así que
// esto ejercita de verdad la compresión — no solo de casualidad, como pasaría
// corriendo con la hora real del día.
{
  const ahoraCercaDeMedianocheMs = new Date(2026, 5, 15, 0, 10, 0).getTime()
  const inicioDeEseDiaMs = new Date(2026, 5, 15, 0, 0, 0).getTime()
  const optsMedianoche = { ...opts, ahoraMs: ahoraCercaDeMedianocheMs }

  for (const seed of [1, 2, 3, 42, 12345]) {
    const rng = createRng(seed)
    const pedidos = generarPedidosParaMesas(mesas, productos, mozos, rng, optsMedianoche)
    for (const pedido of pedidos) {
      assert.ok(pedido.createdAtMs >= inicioDeEseDiaMs, 'medianoche: createdAt nunca antes de las 00:00 de hoy')
      assert.ok(pedido.updatedAtMs <= ahoraCercaDeMedianocheMs, 'medianoche: updatedAt nunca en el futuro')
      assert.equal(
        new Date(pedido.createdAtMs).toDateString(),
        new Date(ahoraCercaDeMedianocheMs).toDateString(),
        'medianoche: createdAt sigue siendo el día de la corrida',
      )
      const historial = pedido.historialEstados
      for (let i = 1; i < historial.length; i++) {
        assert.ok(historial[i].enMs >= historial[i - 1].enMs, 'medianoche: el historial comprimido no retrocede')
      }
    }
  }
}

// ── generarCasosQA: cantidad EXACTA por estado (set de pruebas de QA) ──────

const ESTADOS_QA: readonly PedidoEstado[] = ['pendiente', 'en_preparacion', 'listo', 'entregado']
const CANTIDAD_POR_ESTADO_QA = 50

for (const seed of [1, 2, 3, 42, 12345]) {
  const rng = createRng(seed)
  const casosQA = generarCasosQA(mesas, productos, mozos, rng, {
    estados: ESTADOS_QA,
    cantidadPorEstado: CANTIDAD_POR_ESTADO_QA,
    itemsMax: opts.itemsMax,
    minutosAtrasMin: opts.minutosAtrasMin,
    minutosAtrasMax: opts.minutosAtrasMax,
    ahoraMs: opts.ahoraMs,
  })

  assert.equal(casosQA.length, ESTADOS_QA.length * CANTIDAD_POR_ESTADO_QA, 'un pedido por cada (estado, repetición) pedidos')

  const conteoPorEstado = new Map<PedidoEstado, number>()
  for (const pedido of casosQA) {
    conteoPorEstado.set(pedido.estado, (conteoPorEstado.get(pedido.estado) ?? 0) + 1)

    // Nunca dos líneas del mismo producto — misma regla de agrupación que
    // el modo random (ver arriba).
    const productoIds = pedido.items.map((item) => item.productoId)
    assert.equal(new Set(productoIds).size, productoIds.length, 'QA: no hay productoId repetido entre los items')

    // El historial siempre pasa por todos los estados intermedios en orden,
    // nunca "salta" directo al estado final — ej. un pedido "listo" trae
    // también `pendiente` y `en_preparacion` en su historial.
    const historial = pedido.historialEstados
    const indiceFinal = ESTADOS_QA.indexOf(pedido.estado)
    assert.equal(historial.length, indiceFinal + 1, `QA "${pedido.estado}": el historial debe tener un paso por cada estado hasta el final`)
    for (let i = 0; i < historial.length; i++) {
      assert.equal(historial[i].estado, ESTADOS_QA[i], `QA "${pedido.estado}": paso ${i} del historial debe ser "${ESTADOS_QA[i]}"`)
      if (i > 0) assert.ok(historial[i].enMs > historial[i - 1].enMs, 'QA: cada paso del historial es estrictamente posterior al anterior')
    }
    assert.ok(historial[historial.length - 1].enMs <= opts.ahoraMs, 'QA: ninguna entrada del historial puede ser futura')
    assert.equal(pedido.motivoCancelacion, null, 'QA: estos 4 estados nunca requieren motivoCancelacion')
    assert.equal(
      new Date(pedido.createdAtMs).toDateString(),
      new Date(opts.ahoraMs).toDateString(),
      'QA: createdAt debe ser la fecha de hoy (día de la corrida del script)',
    )
  }

  for (const estado of ESTADOS_QA) {
    assert.equal(conteoPorEstado.get(estado), CANTIDAD_POR_ESTADO_QA, `QA: deben ser exactamente ${CANTIDAD_POR_ESTADO_QA} pedidos en "${estado}"`)
  }
}

console.log('OK: pedidoGenerator.selftest.ts — todas las aserciones pasaron.')
