/**
 * Seed de pedidos de prueba — ver `docs/database-schema.md#pedido--comanda`.
 *
 * Genera pedidos realistas para las mesas ya cargadas de un restaurante,
 * usando su carta real (secciones activas, productos con nombre y precio
 * cargado, no agotados) — respeta los grupos de opciones obligatorios de
 * cada plato y su flag `permiteComentarios`. La lógica de "cómo se arma un
 * pedido" vive en `scripts/lib/pedidoGenerator.ts` (puro, sin Firestore).
 *
 * Genera pedidos en los seis estados posibles de la máquina de estados
 * (`pendiente`, `en_preparacion`, `listo`, `entregado`, `pagado`,
 * `cancelado`), ponderado hacia los "en cocina" (`ESTADOS_EN_COCINA`) para
 * seguir poblando bien el tablero en vivo por defecto — ver
 * `ESTADOS_POSIBLES_PONDERADOS` en `scripts/lib/pedidoGenerator.ts`. Cada
 * pedido trae además `historialEstados`: el timeline completo de
 * transiciones que atravesó, con un timestamp plausible por cada una (ver
 * `docs/database-schema.md#pedido--comanda`).
 *
 * Escribe directo con el Admin SDK (bypasea `firestore.rules`), como
 * cualquier script de seed — no pasa por ninguna Cloud Function ni por la
 * app (ver decisión correspondiente en el log de `docs/database-schema.md`).
 *
 * ── Uso ──────────────────────────────────────────────────────────────────
 *   npm run seed:pedidos -- --restaurante <restauranteId> [opciones]
 *   npm run seed:pedidos -- --listar-restaurantes
 *
 * ── Credenciales ─────────────────────────────────────────────────────────
 *   1. Firebase Console > Configuración del proyecto > Cuentas de servicio
 *      > "Generar nueva clave privada" (descarga un .json).
 *   2. Indicá esa clave con UNA de estas dos formas:
 *        --service-account "C:\ruta\a\esa-clave.json"
 *      o (para no repetirlo en cada corrida):
 *        PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\ruta\a\esa-clave.json"
 *        bash:       export GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/esa-clave.json
 *
 * ── Opciones ─────────────────────────────────────────────────────────────
 *   --restaurante <id>        Requerido (salvo con --listar-restaurantes). Id del doc en /restaurantes.
 *   --service-account <path>  Ruta a la clave de la cuenta de servicio (ver arriba).
 *   --project <id>            Project id de Firebase (default: lee .firebaserc).
 *   --pedidos-max <n>         Máximo de pedidos por mesa (default: 2, mínimo 1 por mesa).
 *   --items-max <n>           Máximo de items por pedido (default: 4).
 *   --seed <n>                Semilla para que la corrida sea reproducible.
 *   --limit-mesas <n>         Solo procesa las primeras N mesas (para probar antes de correr todo).
 *   --clear                   Antes de generar, borra los pedidos existentes del restaurante.
 *   --dry-run                 No escribe nada en Firestore: imprime un resumen y guarda el detalle en scripts/output/.
 *   --listar-restaurantes     Lista los restaurantes disponibles (id + nombre) y termina.
 *   --help                    Muestra esta ayuda.
 */
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { Firestore } from 'firebase-admin/firestore'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { chunk, createRng } from './lib/random.js'
import {
  generarPedidosParaMesas,
  type GrupoOpcionesSeed,
  type MesaSeed,
  type PedidoSeed,
  type ProductoSeed,
  type StaffSeed,
} from './lib/pedidoGenerator.js'

// ── CLI args ────────────────────────────────────────────────────────────

interface Args {
  restaurante?: string
  project?: string
  serviceAccount?: string
  pedidosMax: number
  itemsMax: number
  seed?: number
  limitMesas?: number
  clear: boolean
  dryRun: boolean
  listarRestaurantes: boolean
  help: boolean
}

function parseArgs(argv: string[]): Args {
  const raw: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) {
      raw[key] = next
      i++
    } else {
      raw[key] = true
    }
  }
  const str = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : undefined)
  const num = (key: string, fallback: number) => (raw[key] !== undefined ? Number(raw[key]) : fallback)

  return {
    restaurante: str('restaurante'),
    project: str('project'),
    serviceAccount: str('service-account'),
    pedidosMax: Math.max(1, num('pedidos-max', 2)),
    itemsMax: Math.max(1, num('items-max', 4)),
    seed: raw.seed !== undefined ? Number(raw.seed) : undefined,
    limitMesas: raw['limit-mesas'] !== undefined ? Number(raw['limit-mesas']) : undefined,
    clear: Boolean(raw.clear),
    dryRun: Boolean(raw['dry-run']),
    listarRestaurantes: Boolean(raw['listar-restaurantes']),
    help: Boolean(raw.help),
  }
}

function imprimirAyuda() {
  // El comentario de cabecera de este archivo ES la ayuda — se imprime tal cual.
  const contenido = readFileSync(new URL(import.meta.url), 'utf-8')
  const bloque = contenido.slice(contenido.indexOf('/**') + 3, contenido.indexOf('*/'))
  console.log(
    bloque
      .split('\n')
      .map((linea) => linea.replace(/^\s*\* ?/, ''))
      .join('\n')
      .trim(),
  )
}

// ── Admin SDK init ──────────────────────────────────────────────────────

function defaultProjectId(): string | undefined {
  try {
    const rc = JSON.parse(readFileSync(resolve(process.cwd(), '.firebaserc'), 'utf-8'))
    return rc.projects?.default
  } catch {
    return undefined
  }
}

function initAdmin(args: Args): Firestore {
  if (getApps().length === 0) {
    const projectId = args.project ?? defaultProjectId()
    if (args.serviceAccount) {
      const keyData = JSON.parse(readFileSync(resolve(args.serviceAccount), 'utf-8'))
      initializeApp({ credential: cert(keyData), projectId: projectId ?? keyData.project_id })
    } else {
      initializeApp({ credential: applicationDefault(), projectId })
    }
  }
  return getFirestore()
}

// ── Lectura de datos reales del restaurante ─────────────────────────────

function normalizarGrupos(data: unknown): GrupoOpcionesSeed[] {
  if (!Array.isArray(data)) return []
  return data as GrupoOpcionesSeed[]
}

async function leerMesas(db: Firestore, restauranteId: string): Promise<MesaSeed[]> {
  const salonesSnap = await db.collection('restaurantes').doc(restauranteId).collection('salones').get()
  const mesas: MesaSeed[] = []

  for (const salonDoc of salonesSnap.docs) {
    if (salonDoc.data().activo === false) continue
    const mesasSnap = await salonDoc.ref.collection('mesas').get()
    for (const mesaDoc of mesasSnap.docs) {
      const mesa = mesaDoc.data()
      // "banos" es decorativa: no acepta pedidos (ver docs/database-schema.md#mesa).
      if (mesa.forma === 'banos') continue
      mesas.push({
        id: mesaDoc.id,
        salonId: salonDoc.id,
        numero: String(mesa.numero ?? ''),
        qrToken: mesa.qrToken ?? '',
      })
    }
  }
  return mesas
}

async function leerProductosDisponibles(db: Firestore, restauranteId: string): Promise<ProductoSeed[]> {
  const seccionesSnap = await db.collection('restaurantes').doc(restauranteId).collection('cartaSecciones').get()
  const seccionesActivas = new Set(seccionesSnap.docs.filter((d) => d.data().activo !== false).map((d) => d.id))

  const productosSnap = await db.collection('restaurantes').doc(restauranteId).collection('cartaProductos').get()
  return productosSnap.docs
    .map((doc): ProductoSeed => {
      const data = doc.data()
      return {
        id: doc.id,
        seccionId: data.seccionId,
        nombre: data.nombre ?? '',
        precio: data.precio ?? null,
        agotado: data.agotado ?? false,
        gruposOpciones: normalizarGrupos(data.gruposOpciones),
        permiteComentarios: data.permiteComentarios ?? false,
      }
    })
    .filter((p) => seccionesActivas.has(p.seccionId) && p.nombre !== '' && p.precio !== null && !p.agotado)
}

async function leerMozosActivos(db: Firestore, restauranteId: string): Promise<StaffSeed[]> {
  const staffSnap = await db.collection('restaurantes').doc(restauranteId).collection('staff').get()
  return staffSnap.docs
    .filter((d) => d.data().rol === 'mozo' && d.data().estado === 'activo')
    .map((d) => ({ id: d.id }))
}

// ── Escritura ────────────────────────────────────────────────────────────

async function borrarPedidosExistentes(db: Firestore, restauranteId: string): Promise<number> {
  const coleccion = db.collection('restaurantes').doc(restauranteId).collection('pedidos')
  const existentesSnap = await coleccion.get()
  for (const grupo of chunk(existentesSnap.docs, 400)) {
    const batch = db.batch()
    for (const doc of grupo) batch.delete(doc.ref)
    await batch.commit()
  }
  return existentesSnap.size
}

async function escribirPedidos(db: Firestore, restauranteId: string, pedidos: PedidoSeed[]): Promise<void> {
  const coleccion = db.collection('restaurantes').doc(restauranteId).collection('pedidos')
  for (const grupo of chunk(pedidos, 400)) {
    const batch = db.batch()
    for (const pedido of grupo) {
      const { createdAtMs, updatedAtMs, historialEstados, ...resto } = pedido
      batch.set(coleccion.doc(), {
        restauranteId,
        ...resto,
        historialEstados: historialEstados.map((paso) => ({
          estado: paso.estado,
          en: Timestamp.fromMillis(paso.enMs),
        })),
        createdAt: Timestamp.fromMillis(createdAtMs),
        updatedAt: Timestamp.fromMillis(updatedAtMs),
      })
    }
    await batch.commit()
  }
}

async function marcarMesasOcupadas(db: Firestore, restauranteId: string, mesas: MesaSeed[]): Promise<void> {
  for (const grupo of chunk(mesas, 400)) {
    const batch = db.batch()
    for (const mesa of grupo) {
      const ref = db
        .collection('restaurantes')
        .doc(restauranteId)
        .collection('salones')
        .doc(mesa.salonId)
        .collection('mesas')
        .doc(mesa.id)
      batch.update(ref, { estado: 'ocupada', updatedAt: FieldValue.serverTimestamp() })
    }
    await batch.commit()
  }
}

// ── Resumen / dry-run ────────────────────────────────────────────────────

function imprimirResumen(pedidos: PedidoSeed[], mesasConPedido: Set<string>) {
  const totalItems = pedidos.reduce((t, p) => t + p.items.length, 0)
  const totalRevenueEnCocina = pedidos.reduce((t, p) => t + p.total, 0)
  const porEstado = new Map<string, number>()
  const porOrigen = new Map<string, number>()
  for (const p of pedidos) {
    porEstado.set(p.estado, (porEstado.get(p.estado) ?? 0) + 1)
    porOrigen.set(p.origen, (porOrigen.get(p.origen) ?? 0) + 1)
  }

  console.log('\nResumen de la generación:')
  console.log(`  Mesas con pedidos: ${mesasConPedido.size}`)
  console.log(`  Pedidos generados: ${pedidos.length}`)
  console.log(`  Items en total:    ${totalItems}`)
  console.log(`  Total ($) en cocina: ${totalRevenueEnCocina.toLocaleString('es-AR')}`)
  console.log('  Por estado:', Object.fromEntries(porEstado))
  console.log('  Por origen:', Object.fromEntries(porOrigen))
}

function guardarDryRunJson(pedidos: PedidoSeed[]) {
  const outDir = resolve(process.cwd(), 'scripts/output')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outFile = resolve(outDir, 'pedidos-dry-run.json')

  const serializable = pedidos.map((p) => ({
    ...p,
    historialEstados: p.historialEstados.map((paso) => ({
      estado: paso.estado,
      en: new Date(paso.enMs).toISOString(),
    })),
    createdAt: new Date(p.createdAtMs).toISOString(),
    updatedAt: new Date(p.updatedAtMs).toISOString(),
    createdAtMs: undefined,
    updatedAtMs: undefined,
  }))
  writeFileSync(outFile, JSON.stringify(serializable, null, 2), 'utf-8')
  console.log(`\nDry-run: no se escribió nada en Firestore. Detalle completo en ${outFile}`)
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) return imprimirAyuda()

  const db = initAdmin(args)

  if (args.listarRestaurantes) {
    const snap = await db.collection('restaurantes').get()
    if (snap.empty) {
      console.log('No hay restaurantes en este proyecto.')
      return
    }
    console.log('Restaurantes disponibles:')
    for (const doc of snap.docs) {
      console.log(`  ${doc.id}  —  ${doc.data().nombre ?? '(sin nombre)'}`)
    }
    return
  }

  if (!args.restaurante) {
    console.error('Falta --restaurante <id>. Usá --listar-restaurantes para ver los disponibles, o --help.')
    process.exitCode = 1
    return
  }

  const restauranteId = args.restaurante
  const restauranteSnap = await db.collection('restaurantes').doc(restauranteId).get()
  if (!restauranteSnap.exists) {
    console.error(`No existe el restaurante "${restauranteId}". Usá --listar-restaurantes para ver los disponibles.`)
    process.exitCode = 1
    return
  }
  console.log(`Restaurante: ${restauranteSnap.data()?.nombre ?? restauranteId}`)

  const [mesas, productos, mozos] = await Promise.all([
    leerMesas(db, restauranteId),
    leerProductosDisponibles(db, restauranteId),
    leerMozosActivos(db, restauranteId),
  ])

  if (mesas.length === 0) {
    console.error('No hay mesas para pedir (fuera de "baños") en este restaurante. Nada para generar.')
    process.exitCode = 1
    return
  }
  if (productos.length === 0) {
    console.error(
      'No hay platos disponibles para pedir (con nombre, precio cargado, no agotados, en una sección activa). Nada para generar.',
    )
    process.exitCode = 1
    return
  }

  const mesasAUsar = args.limitMesas ? mesas.slice(0, args.limitMesas) : mesas
  console.log(
    `Mesas: ${mesasAUsar.length}/${mesas.length}  ·  Platos disponibles: ${productos.length}  ·  Mozos activos: ${mozos.length}`,
  )

  if (args.clear) {
    if (args.dryRun) {
      console.log('(--clear con --dry-run: no se borra nada, solo se simula la generación)')
    } else {
      const borrados = await borrarPedidosExistentes(db, restauranteId)
      console.log(`--clear: se borraron ${borrados} pedidos existentes de este restaurante.`)
    }
  }

  const rng = createRng(args.seed)
  const pedidos = generarPedidosParaMesas(mesasAUsar, productos, mozos, rng, {
    pedidosMax: args.pedidosMax,
    itemsMax: args.itemsMax,
    minutosAtrasMin: 5,
    minutosAtrasMax: 90,
    ahoraMs: Date.now(),
  })
  const mesasConPedido = new Set(pedidos.map((p) => p.mesaId))

  imprimirResumen(pedidos, mesasConPedido)

  if (args.dryRun) {
    guardarDryRunJson(pedidos)
    return
  }

  await escribirPedidos(db, restauranteId, pedidos)
  await marcarMesasOcupadas(
    db,
    restauranteId,
    mesasAUsar.filter((m) => mesasConPedido.has(m.id)),
  )

  console.log(`\nListo: ${pedidos.length} pedidos creados en ${mesasConPedido.size} mesas.`)
}

// El Admin SDK a veces resuelve el fallo de credenciales fuera de la cadena
// de promesas de `main()` (lookup de metadata en background) — sin esto,
// esos casos salían como un stack trace crudo de Node en vez de un mensaje
// claro con exit code 1.
process.on('unhandledRejection', (error) => {
  console.error('\nFalló la generación de pedidos de prueba:')
  console.error(error)
  process.exit(1)
})

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error('\nFalló la generación de pedidos de prueba:')
    console.error(error)
    process.exit(1)
  })
