# Database Schema — Firestore

> Fuente de verdad del modelo de datos. Referenciado desde `CLAUDE.md`.
> Al implementar una feature, referenciá la sección puntual (ej. `docs/database-schema.md#pedidos`), no el documento completo.

**Leyenda de estado:** 🟢 Definido y estable · 🟡 En diseño, puede cambiar · 🔴 Pendiente

---

## Índice de entidades

| Entidad | Tipo | Estado |
|---|---|---|
| [Restaurante](#restaurante) | Colección raíz | 🟢 |
| [Staff](#staff) | Subcolección de Restaurante | 🟢 |
| [Salón](#salón) | Subcolección de Restaurante | 🟢 |
| [Mesa](#mesa) | Subcolección de Salón | 🟢 |
| [Código QR](#código-qr) | Colección raíz | 🟢 |
| [Asignación](#asignación) | Subcolección de Restaurante | 🟢 |
| [Carta - Sección](#carta---sección) | Subcolección de Restaurante | 🟢 |
| [Carta - Producto](#carta---producto) | Subcolección de Restaurante | 🟢 |
| [Pedido / Comanda](#pedido--comanda) | Colección raíz | 🟢 |
| [TurnoAsignado](#turnoasignado) | Subcolección de Restaurante | 🟢 |
| [Fichaje](#fichaje) | Subcolección de Restaurante | 🟢 |
| [Solicitud](#solicitud) | Subcolección de Restaurante | 🟢 |
| [Notificación](#notificación) | Subcolección de Restaurante | 🟢 |
| [Reserva](#reserva) | Colección raíz | 🔴 (`Pedido` ya está cerrado; quedan pendientes propios — ver abajo) |

---

## Restaurante

**Estado:** 🟢

`/restaurantes/{restauranteId}`

| Campo | Tipo | Notas |
|---|---|---|
| nombre | string | |
| direccion | string | |
| timezone | string | usado por Cloud Scheduler para reservas |
| horarios | `HorariosRestaurante` | apertura/cierre general, días laborales y turnos de servicio — ver detalle abajo |
| createdAt | timestamp | |

```json
{
  "nombre": "Don Mario",
  "direccion": "Av. Belgrano 1450, Burzaco",
  "timezone": "America/Argentina/Buenos_Aires",
  "horarios": {
    "aperturaGeneral": "08:00",
    "cierreGeneral": "23:30",
    "diasLaborales": ["martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
    "turnos": {
      "manana": { "habilitado": false, "horaInicio": "", "horaFin": "" },
      "tarde": { "habilitado": true, "horaInicio": "12:00", "horaFin": "16:00" },
      "noche": { "habilitado": true, "horaInicio": "20:00", "horaFin": "23:30" }
    }
  },
  "createdAt": "2026-01-10T12:00:00Z"
}
```

**`horarios.turnos`** tiene siempre las tres claves `manana`/`tarde`/`noche` (nunca se agregan ni se quitan turnos): cada una es `{ habilitado: boolean, horaInicio: string, horaFin: string }`, con horas en formato `HH:mm` (24hs). `horaInicio`/`horaFin` solo son significativas si `habilitado` es `true`. Se edita desde el panel en `/panel/turnos` ("Turnos", sección General del menú).

**Relaciones:** contiene `staff`, `salones`, `pedidos`, `reservas` como subcolecciones o colecciones filtradas por `restauranteId`.

---

## Staff

**Estado:** 🟢

`/restaurantes/{restauranteId}/staff/{staffId}`

| Campo | Tipo | Notas |
|---|---|---|
| nombre | string | |
| email | string | también es su usuario de login (Firebase Auth es 100% email/password, no hay username separado) |
| telefono | string | |
| direccion | string | |
| authUid | string | **el id del propio documento ES este uid** — ver más abajo |
| rol | `'administrador' \| 'mozo' \| 'cocinero' \| 'bartender' \| 'recepcionista' \| 'cajero' \| 'encargado'` | define permisos en Security Rules |
| turno | `'mañana' \| 'tarde' \| 'noche' \| 'rotativo'` | |
| estado | `'activo' \| 'inactivo'` | baja lógica, no se borra el doc |
| debeCambiarPassword | boolean | `true` mientras no cambió la contraseña provisoria que le asignó el admin al darlo de alta; la interfaz lo bloquea con un modal hasta que la cambia |
| horasSemanalesContrato | number \| null | tope contractual de horas semanales; `null` si no se cargó. Se edita desde "Editar colaborador" (no forma parte del alta) y lo usa `TurnoAsignado` para proyectar horas planificadas del cuadrante contra este límite — ver [TurnoAsignado](#turnoasignado) |
| createdAt | timestamp | |

```json
{
  "nombre": "Lucía Fernández",
  "email": "lucia@donmario.com",
  "telefono": "11 2345 6789",
  "direccion": "Av. Belgrano 1450, Burzaco",
  "authUid": "fA9x...",
  "rol": "mozo",
  "turno": "tarde",
  "estado": "activo",
  "debeCambiarPassword": true,
  "horasSemanalesContrato": 36,
  "createdAt": "2026-02-01T09:00:00Z"
}
```

**El id del documento es el uid de Firebase Auth, para todo el staff** (no solo el administrador): dar de alta a un colaborador crea su cuenta de Auth con una contraseña provisoria en el mismo paso (vía Cloud Function callable, con Admin SDK) y el doc de `staff` se guarda con ese mismo id. Esto resuelve "de qué restaurante es este usuario" con un `get()` directo en vez de una query, una vez que ya se sabe el `restauranteId` (por ejemplo, en Security Rules, que reciben `restauranteId` como segmento del path).

**Resolver "a qué restaurante pertenezco" sin conocer el `restauranteId` de antemano** (necesario al iniciar sesión, antes de tener contexto): se usa una colección raíz auxiliar e inmutable, `/staffIndex/{uid} -> { restauranteId: string }`, escrita atómicamente junto con cada doc de `staff` (mismo batch/transacción). El cliente resuelve su sesión con dos `get()` directos (`staffIndex/{uid}` → `restaurantes/{restauranteId}/staff/{uid}`), sin queries ni índices de collection group. Esta colección también preserva la regla de "no se puede dar de alta un segundo restaurante siendo ya staff de otro" — algo que dejaría de ser expresable en Security Rules si `staff` es subcolección y esa comprobación dependiera de una query arbitraria.

**Patrón de lectura:** el rol y el `restauranteId` se resuelven una sola vez al iniciar sesión y se cachean en React Query (`staleTime: Infinity`) — no se releen en cada acción.

---

## Salón

**Estado:** 🟢

`/restaurantes/{restauranteId}/salones/{salonId}`

| Campo | Tipo | Notas |
|---|---|---|
| nombre | string | |
| descripcion | string | texto libre, opcional |
| orden | number | orden de visualización en UI |
| activo | boolean | |

```json
{
  "nombre": "Salón principal",
  "descripcion": "Salón climatizado con vista a la calle",
  "orden": 1,
  "activo": true
}
```

**Por qué subcolección de Restaurante:** siempre se lista dentro del contexto de un restaurante; no hay caso de uso que necesite salones de múltiples restaurantes a la vez.

---

## Mesa

**Estado:** 🟢

`/restaurantes/{restauranteId}/salones/{salonId}/mesas/{mesaId}`

| Campo | Tipo | Notas |
|---|---|---|
| numero | number | |
| capacidad | number | |
| estado | `'libre' \| 'ocupada' \| 'reservada'` | ver transiciones abajo |
| qrToken | string | **vacío (`''`) hasta que se genera manualmente** desde "Editar mesa" (botón "Generar código QR") — ver [Código QR](#código-qr). Nunca se genera solo al crear la mesa. Permanentemente vacío para `forma === 'banos'`, que no acepta pedidos |
| forma | `'cuadrada' \| 'rectangular' \| 'redonda' \| 'banos' \| 'barra'` | define el tamaño estándar con el que se dibuja en el lienzo del salón (sin resize individual). `banos` es decorativa (sin QR/número/capacidad); `barra` es la única forma que rota y que admite varias secciones — ver `rotacion`/`grupoId`/`seccion` |
| posicion | `{ x: number; y: number }` | posición libre en píxeles dentro del lienzo del salón (sin grilla/snap) |
| rotacion | `0 \| 90` | solo relevante si `forma === 'barra'` (0 = horizontal, 90 = vertical); el resto de las formas siempre `0` |
| grupoId | string \| null | agrupa las secciones de una misma Barra (cada sección es un doc `Mesa` completo, con su propio `qrToken`); `null` para elementos sueltos |
| seccion | number \| null | índice 1-based dentro de `grupoId`; `null` si `grupoId` es `null` |
| mozoIds | string[] | refs a `staff` — los mozos que atienden la mesa ahora mismo (puede ser más de uno). Se asignan/desasignan desde el desplegable de "Editar mesa"/"Editar Barra", pero **el cliente nunca escribe este campo directo** — invoca la Cloud Function `asignarMozoAMesa`, que además mantiene el historial en [Asignación](#asignación); `firestore.rules` bloquea explícitamente cualquier `update` de mesa que toque `mozoIds` |
| restauranteId | string | **denormalizado**, para queries con `collectionGroup` |
| salonId | string | **denormalizado** |
| updatedAt | timestamp | |

```json
{
  "numero": 7,
  "capacidad": 4,
  "estado": "ocupada",
  "qrToken": "b3f8b0a2-...",
  "forma": "cuadrada",
  "posicion": { "x": 120, "y": 340 },
  "rotacion": 0,
  "grupoId": null,
  "seccion": null,
  "mozoIds": ["staff_lucia"],
  "restauranteId": "resto_donmario",
  "salonId": "salon_principal",
  "updatedAt": "2026-03-05T20:14:00Z"
}
```

**Transiciones de estado:**
- `libre → ocupada`: automática, al confirmarse el primer pedido con éxito (no acción manual del mozo).
- `ocupada → libre`: manual, mozo escanea el QR tras verificar que los comensales se fueron.
- `libre → reservada` / `reservada → ocupada`: automática vía Cloud Scheduler a la hora de la reserva.

**Por qué subcolección de Salón:** la UI admin navega salón por salón; anidar reduce lecturas a solo las mesas visibles.

**Por qué tiene `restauranteId` y `salonId` denormalizados** aunque ya están en el path: permite queries con `collectionGroup('mesas')` (ej. futura app mobile "todas mis mesas ocupadas") sin tener que parsear el path del documento.

**🔴 Pendiente / no implementado todavía** (documentado antes como si ya existiera, corregido acá): `cuentaSolicitada` (boolean), `pedidoActivoId` (denormalizado, ref a `pedidos`), `reservaActivaId` (denormalizado, ref a `reservas`). Van a hacer falta cuando se cierre `Pedido / Comanda`.

---

## Código QR

**Estado:** 🟢

`/qrCodes/{qrToken}` — **colección raíz**, el id del documento es el propio `qrToken`.

| Campo | Tipo | Notas |
|---|---|---|
| qrToken | string | igual al id del doc (denormalizado para no depender de `snapshot.id` en el converter) |
| restauranteId | string | |
| salonId | string | |
| mesaId | string | |

```json
{
  "qrToken": "b3f8b0a2-1c4e-4a9d-8f2a-7e6d5c4b3a21",
  "restauranteId": "resto_donmario",
  "salonId": "salon_principal",
  "mesaId": "mesa_7"
}
```

**Qué codifica el QR impreso:** `{origin}/mesa/{qrToken}` — la app del comensal todavía no existe (`/mesa/:id` está mencionada en CLAUDE.md §7 pero sin implementar), así que hoy esa URL no resuelve a nada real; queda como referencia para cuando se construya.

**Se genera a demanda**, no al crear la mesa: `mesaRepository.generarQr` escribe el `qrToken` en la mesa y este doc en un mismo `writeBatch`, disparado por el botón "Generar código QR" de `MesaEditDialog`. Se borra (junto con el de la mesa) si la mesa se elimina desde el lienzo.

**Por qué colección raíz separada** (y no derivar todo del `qrToken` embebido en `Mesa`): el comensal escanea sin sesión iniciada — necesita resolver `restauranteId/salonId/mesaId` con una lectura pública (`allow read: if true` en `firestore.rules`) sin poder hacer una query a `mesas` (no sabe en qué restaurante/salón buscar). El doc es la única forma de ir de "token en la URL" a "qué mesa es" sin exponer todas las mesas a lectura pública.

---

## Asignación

**Estado:** 🟢

`/restaurantes/{restauranteId}/asignaciones/{asignacionId}` — historial de
qué mozo atendió qué mesa y cuándo. **Un doc por par mozo↔mesa activo** (no
un array acá — el array de mozos actuales vive en `Mesa.mozoIds`; esta
colección es el historial que respalda a ese array).

| Campo | Tipo | Notas |
|---|---|---|
| mozoId | string | ref a `staff` — un solo mozo por doc |
| mesaId | string | |
| salonId | string | |
| inicio | timestamp | |
| fin | timestamp \| null | `null` mientras está activa |
| activa | boolean | |

```json
{
  "mozoId": "staff_lucia",
  "mesaId": "mesa_7",
  "salonId": "salon_principal",
  "inicio": "2026-03-05T20:00:00Z",
  "fin": null,
  "activa": true
}
```

**Escritura exclusiva de Cloud Functions (Admin SDK):** `firestore.rules`
tiene `allow write: if false` para esta colección — la crean/cierran
únicamente `asignarMozoAMesa` y `liberarMesa`
(`functions/src/features/...`), nunca el cliente directo.

**Cómo se mantiene sincronizada con `Mesa.mozoIds`:** `asignarMozoAMesa`
recibe la lista completa de mozos deseada para una mesa y, en una
transacción, la diffea contra las asignaciones activas actuales: cierra
(`fin`, `activa: false`) las que ya no corresponden, crea una por cada mozo
nuevo, deja intactas las que siguen vigentes, y recién ahí actualiza
`Mesa.mozoIds` — todo en el mismo paso atómico.

---

## Carta - Sección

**Estado:** 🟢

`/restaurantes/{restauranteId}/cartaSecciones/{seccionId}`

| Campo | Tipo | Notas |
|---|---|---|
| nombre | string | requerido (ej. "Entradas", "Bebidas", "Vinos") |
| orden | number | orden de visualización en UI |
| activo | boolean | baja lógica — **mismo patrón que `Salón`**: no hay borrado, solo dar de baja/reactivar |

```json
{
  "nombre": "Entradas",
  "orden": 0,
  "activo": true
}
```

**Por qué subcolección de Restaurante:** igual que `Salón`, siempre se lista en el contexto de un restaurante puntual.

---

## Carta - Producto

**Estado:** 🟢

`/restaurantes/{restauranteId}/cartaProductos/{productoId}`

| Campo | Tipo | Notas |
|---|---|---|
| seccionId | string | ref a `Carta - Sección` |
| nombre | string | **opcional** — `''` si no se cargó |
| descripcion | string | **opcional** |
| precio | number \| null | **opcional** |
| imagenUrl | string \| null | **opcional**, sube a Firebase Storage en `restaurantes/{restauranteId}/carta/{productoId}/imagen` |
| orden | number | orden dentro de la sección |
| agotado | boolean | marcado a demanda desde la tarjeta del plato ("Marcar agotado"); no borra el plato, solo lo saca de disponible |
| gruposOpciones | `GrupoOpciones[]` | grupos de opciones configurables del plato (salsas, guarniciones, adicionales, puntos de cocción); `[]` si no tiene ninguno — ver detalle abajo |
| permiteComentarios | boolean | si es `true`, el comensal ve un campo de texto libre para aclarar algo del plato (ej. "sin sal") al pedirlo; `false` por defecto |

```json
{
  "seccionId": "seccion_entradas",
  "nombre": "Empanadas de carne",
  "descripcion": "Docena, al horno",
  "precio": 6500,
  "imagenUrl": "https://firebasestorage.googleapis.com/...",
  "orden": 0,
  "agotado": false,
  "gruposOpciones": [],
  "permiteComentarios": false
}
```

**`gruposOpciones`** — array embebido en el propio documento del producto (no es subcolección ni colección aparte): cada elemento es un `GrupoOpciones`, y cada opción dentro de un grupo puede a su vez abrir sus propios `subgrupos` (mismo tipo, recursivo). Pensado para casos como "Salsa" (varias salsas a distinto precio), "Guarnición" (donde, por ejemplo, la opción "Ensalada" ofrece a su vez un grupo de aderezos) o "Punto de cocción" (lista fija de puntos que sí maneja el local — bife jugoso/a punto/bien cocido — marcado como `obligatorio` para forzar que el comensal elija uno antes de poder pedir el plato, en vez de escribirlo libremente y arriesgarse a pedir un punto que no se hace).

**`permiteComentarios`** es un campo aparte, independiente de `gruposOpciones`: habilita un campo de texto libre (sin opciones predefinidas) para aclaraciones que no entran en una lista cerrada, ej. "sin sal", "bien picante". Un mismo plato puede combinar ambos: un grupo obligatorio de "Punto de cocción" (para forzar una respuesta dentro de lo que el local ofrece) y además `permiteComentarios` habilitado (para una aclaración libre adicional).

```ts
interface GrupoOpciones {
  id: string
  nombre: string            // "Salsa", "Guarnición"
  obligatorio: boolean      // hay que elegir al menos una opción del grupo
  seleccionMultiple: boolean // false = elección única (radio), true = varias (checkbox)
  opciones: Opcion[]
}

interface Opcion {
  id: string
  nombre: string             // "Bolognesa", "Puré de papas", "Ensalada"
  precioAdicional: number    // se suma al precio base del plato; 0 si no tiene costo extra
  subgrupos: GrupoOpciones[] // recursivo — [] si esta opción no abre nada más
}
```

```json
{
  "gruposOpciones": [
    {
      "id": "grp_salsa",
      "nombre": "Salsa",
      "obligatorio": true,
      "seleccionMultiple": false,
      "opciones": [
        { "id": "op_bolognesa", "nombre": "Bolognesa", "precioAdicional": 0, "subgrupos": [] },
        { "id": "op_4quesos", "nombre": "4 quesos", "precioAdicional": 800, "subgrupos": [] }
      ]
    },
    {
      "id": "grp_guarnicion",
      "nombre": "Guarnición",
      "obligatorio": false,
      "seleccionMultiple": false,
      "opciones": [
        { "id": "op_pure", "nombre": "Puré de papas", "precioAdicional": 0, "subgrupos": [] },
        {
          "id": "op_ensalada",
          "nombre": "Ensalada",
          "precioAdicional": 0,
          "subgrupos": [
            {
              "id": "grp_aderezo",
              "nombre": "Aderezo",
              "obligatorio": false,
              "seleccionMultiple": false,
              "opciones": [
                { "id": "op_oliva", "nombre": "Aceite de oliva", "precioAdicional": 0, "subgrupos": [] }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Por qué embebido en el producto y no colección aparte:** los grupos/opciones no tienen identidad ni ciclo de vida propio fuera de su plato — se leen y escriben siempre junto con él, y modelarlos como subcolección obligaría a N lecturas extra por plato listado (rompería el patrón de "un solo `onSnapshot` con todos los productos" del feature). El límite de 1MB por documento de Firestore no es un riesgo real para la cantidad de opciones que puede tener un plato de restaurante.

**Uso hoy:** esta estructura se arma desde el panel admin (alta/edición de plato). Todavía no la consume ningún flujo de pedido — cuando se cierre `Pedido / Comanda` (🟡), hay que definir ahí cómo un `item` de pedido referencia las opciones elegidas y cómo se recalcula el precio final.

**Por qué es colección plana (con `seccionId`) y no subcolección de cada sección:** mismo criterio que `pedidos` — la futura feature de Menús (combos) va a necesitar armar un menú referenciando productos de varias secciones sin queries anidadas.

**Borrado:** hard delete directo (mismo patrón que `Mesa` dentro de `Salón`), a diferencia de `Carta - Sección` que solo tiene baja lógica.

**Cómo se lista sin índice compuesto:** se trae **todos** los productos del restaurante en un único `onSnapshot` ordenado por `orden` (sin `where('seccionId', '==', ...)`) y la UI los agrupa por `seccionId` en memoria — evita sumar un índice compuesto nuevo a `firestore.indexes.json`.

**"Adjuntar imagen" (subir foto de la carta física para interpretación automática):** todavía no tiene modelo de datos — la opción está deshabilitada en la UI hasta que se defina esa fase (requeriría sumar un servicio de OCR/IA fuera del stack actual).

---

## Pedido / Comanda

**Estado:** 🟢

`/restaurantes/{restauranteId}/pedidos/{pedidoId}` — **colección raíz** (anidada bajo `restaurantes`, no subcolección de mesa).

| Campo | Tipo | Notas |
|---|---|---|
| restauranteId | string | **denormalizado**, mismo criterio que `Carta - Producto`/`Carta - Sección` |
| mesaId | string | |
| salonId | string | denormalizado |
| mesaNumero | string | denormalizado, evita join en UI de cocina — **`string`**, no `number` (así está tipado `Mesa.numero`, ver [Mesa](#mesa)) |
| qrTokenOrigen | string \| null | trazabilidad del QR que lo generó; `null` si el pedido no se originó escaneando un QR (ver `origen`) |
| origen | `'comensal' \| 'mozo'` | canal por el que se cargó el pedido — pie para estadísticas de canal una vez que exista la app del comensal |
| estado | `PedidoEstado` (ver máquina de estados abajo) | |
| historialEstados | `PedidoHistorialEntrada[]` | timeline de la máquina de estados — un registro por cada transición efectivamente ocurrida, con su timestamp. Ver detalle abajo |
| items | `PedidoItem[]` | ver detalle abajo — incorpora los `gruposOpciones` y `permiteComentarios` de [Carta - Producto](#carta---producto) |
| subtotal | number | suma de `precioUnitario * cantidad` de todos los items |
| total | number | hoy siempre igual a `subtotal` (sin descuentos/propina); se separan como dos campos para no tener que migrar el shape cuando se sume alguno de los dos |
| mozoAsignadoId | string \| null | |
| motivoCancelacion | string \| null | **obligatorio** (no `null`/`''`) cuando `estado === 'cancelado'`; `null` en cualquier otro estado |
| mercadoPagoPaymentId | string \| null | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

**`PedidoItem`** — una línea del pedido. `detalle`/`comentario` tienen exactamente la misma forma que ya se usa en la previsualización de la carta (`CarritoPreviewItem` en `src/features/menu/domain/cartaPreviewRules.ts`, tipos compartidos en `src/types/pedido.ts`): un pedido real es, en los hechos, el carrito de la previsualización pero persistido.

```ts
interface PedidoItem {
  id: string                    // id local a la línea (uuid) — permite referenciarla puntualmente a futuro (ej. cancelar 1 línea)
  productoId: string
  productoNombre: string        // denormalizado al momento de pedir: si el admin edita el nombre del plato después, el histórico no cambia
  cantidad: number
  precioUnitario: number        // precio base del plato + adicionales de las opciones elegidas, calculado al momento de pedir
  detalle: PedidoDetalleGrupo[] // grupos de opciones elegidas (salsa, guarnición, punto de cocción, etc.); [] si el plato no tenía
  comentario: string            // aclaración libre del comensal (ej. "sin sal"); '' si no aplica
}

interface PedidoDetalleGrupo {
  grupoNombre: string
  opciones: { nombre: string; precioAdicional: number }[]
}
```

**`PedidoHistorialEntrada`** — un registro por cada transición de estado efectivamente ocurrida (ver [Máquina de estados](#máquina-de-estados) abajo). Siempre arranca con `{ estado: 'pendiente', en: <mismo valor que createdAt> }`; cada transición posterior agrega una entrada nueva, nunca se edita ni se borra una existente. Es lo que permite calcular métricas de tiempo (cuánto tardó de `pendiente` a `en_preparacion`, de ahí a `listo`, etc.) sin depender de `updatedAt` (que solo guarda el último cambio, no el timeline completo).

```ts
interface PedidoHistorialEntrada {
  estado: PedidoEstado
  en: Timestamp
}
```

```json
{
  "restauranteId": "resto_donmario",
  "mesaId": "mesa_7",
  "salonId": "salon_principal",
  "mesaNumero": "7",
  "qrTokenOrigen": "b3f8b0a2-...",
  "origen": "comensal",
  "estado": "en_preparacion",
  "historialEstados": [
    { "estado": "pendiente", "en": "2026-03-05T20:10:00Z" },
    { "estado": "en_preparacion", "en": "2026-03-05T20:13:00Z" }
  ],
  "items": [
    {
      "id": "item_1",
      "productoId": "prod_gnocchi",
      "productoNombre": "Gnocchi de la casa",
      "cantidad": 2,
      "precioUnitario": 12800,
      "detalle": [
        { "grupoNombre": "Salsa", "opciones": [{ "nombre": "4 quesos", "precioAdicional": 800 }] },
        { "grupoNombre": "Guarnición", "opciones": [{ "nombre": "Ensalada", "precioAdicional": 0 }] }
      ],
      "comentario": ""
    },
    {
      "id": "item_2",
      "productoId": "prod_bife",
      "productoNombre": "Ojo de bife",
      "cantidad": 1,
      "precioUnitario": 15000,
      "detalle": [{ "grupoNombre": "Punto de cocción", "opciones": [{ "nombre": "Jugoso", "precioAdicional": 0 }] }],
      "comentario": "bien dorado por fuera"
    }
  ],
  "subtotal": 40600,
  "total": 40600,
  "mozoAsignadoId": "staff_lucia",
  "motivoCancelacion": null,
  "mercadoPagoPaymentId": null,
  "createdAt": "2026-03-05T20:10:00Z",
  "updatedAt": "2026-03-05T20:13:00Z"
}
```

### Máquina de estados

```
pendiente ──────► en_preparacion ──────► listo ──────► entregado ──────► pagado
    │                    │                  │
    └────────────────────┴──────────────────┴──────────► cancelado
```

| Transición | Roles habilitados | Notas |
|---|---|---|
| `pendiente → en_preparacion` | `cocinero`, `bartender`, `administrador` | cocina "toma" el pedido |
| `en_preparacion → listo` | `cocinero`, `bartender`, `administrador` | terminado, a la espera de que un mozo lo retire |
| `listo → entregado` | `mozo`, `administrador` | se despachó a la mesa |
| `entregado → pagado` | `mozo`, `administrador` | |
| `pendiente \| en_preparacion \| listo → cancelado` | `mozo`, `administrador` | **requiere `motivoCancelacion`** no vacío; `cocinero`/`bartender` no cancelan directamente (avisan al mozo) |
| cualquier otra | — | no permitida — `entregado`/`pagado`/`cancelado` son estados terminales (una devolución post-pago es un caso aparte, sin diseñar todavía) |

Esta tabla vive como datos en `src/features/orders/domain/pedidoRules.ts` (`TRANSICIONES_VALIDAS`/`ROLES_POR_TRANSICION`, expuestas vía `puedeTransicionar(desde, hasta, rol)`), no hardcodeada en `firestore.rules` — mismo criterio que el resto del proyecto: las reglas de Firestore autorizan por `restauranteId`/rol de staff, la lógica de negocio fina vive en `domain/`.

**Cada transición de esta tabla que efectivamente se dispara agrega una entrada a `historialEstados`** (nunca se sobrescribe ni se borra una anterior). Es la base para métricas de tiempo en cocina/salón — cuánto tarda un pedido de `pendiente` a `en_preparacion`, de ahí a `listo`, y de `listo` a `entregado` — sin necesitar un índice ni una query aparte: se calcula leyendo el array del propio documento (`duracionEntreEstados` en `src/features/orders/domain/pedidoRules.ts`).

**Por qué colección raíz:** cocina necesita un listener único sobre todos los pedidos activos del restaurante (`where estado in [...] orderBy createdAt`). Anidarlo bajo mesa forzaría `collectionGroup` + índice compuesto para lograr lo mismo.

**Índices compuestos requeridos** (agregados en `firestore.indexes.json`):
- `estado` ASC + `createdAt` ASC → dashboard de cocina.
- `mesaId` ASC + `createdAt` DESC → historial por mesa.

**🔴 Pendiente — explícitamente fuera de esta vuelta de diseño:**
- Relación con `stock` (descuento de inventario al pasar a `en_preparacion` o al confirmarse): `stock` en sí todavía no tiene modelo de datos cerrado, así que esto se resuelve cuando se diseñe esa entidad.
- La Cloud Function `crearPedido` que orqueste "crear el pedido + marcar la mesa ocupada" de forma transaccional (`registrarPrimeraCompra` en `functions/src/features/mesas/` ya está escrita a la espera de que algo la invoque) y la app del comensal que la dispare. Hoy no hay ningún flujo real de alta de pedidos — el set de pruebas de este documento escribe directo con el Admin SDK (bypasea reglas, como cualquier script de seed).
- `Mesa.pedidoActivoId`/`cuentaSolicitada` (mencionados como pendientes en [Mesa](#mesa)): quedan para cuando se construya ese flujo real, no hacía falta para cerrar el shape de `Pedido`.
- Recalcular `precioUnitario` server-side contra la carta real (hoy se confía en lo que arma el cliente/script) — relevante recién cuando el canal `comensal` sea real y no confiable.

---

## TurnoAsignado

**Estado:** 🟢

`/restaurantes/{restauranteId}/turnosAsignados/{turnoId}` — instancia real de un turno para un empleado en una fecha puntual. Parte del módulo "Jornadas" (`/panel/turnos`, pestaña "Cuadrantes") — ver el análisis funcional previo a esta implementación para el resto de las fases (fichaje, solicitudes).

| Campo | Tipo | Notas |
|---|---|---|
| staffId | string | ref a `staff` |
| fecha | string (`YYYY-MM-DD`) | no es timestamp: evita corrimientos de timezone al filtrar por día y permite comparación lexicográfica en rangos (`where('fecha','>=',...)`), mismo criterio que `HorariosRestaurante` |
| horaInicio / horaFin | string (`HH:mm`, 24hs) | `horaInicio` siempre antes que `horaFin` — no se admiten turnos que cruzan medianoche (misma limitación que `HorariosRestaurante.turnos`) |
| area | `'cocina' \| 'salon' \| 'barra' \| 'recepcion'` | enum fijo, no es una entidad propia — mismo criterio que `Staff.rol` |
| rol | `RolStaff` | denormalizado de `staff.rol` al crear el turno, para filtrar sin join |
| estado | `'planificado' \| 'confirmado'` | marca visual de "cuadrante ya publicado"; no dispara ningún otro efecto todavía |
| notas | string | texto libre, opcional |
| restauranteId | string | denormalizado, mismo criterio que `Mesa`/`Pedido` |
| createdAt / updatedAt | timestamp | |

```json
{
  "staffId": "staff_lucia",
  "fecha": "2026-03-10",
  "horaInicio": "12:00",
  "horaFin": "20:00",
  "area": "salon",
  "rol": "mozo",
  "estado": "planificado",
  "notas": "",
  "restauranteId": "resto_donmario",
  "createdAt": "2026-03-05T18:00:00Z",
  "updatedAt": "2026-03-05T18:00:00Z"
}
```

**No reemplaza `Staff.turno`** (mañana/tarde/noche/rotativo): ese campo sigue siendo la etiqueta preferente del empleado, sin fecha, y se usa como default de `area` al cargar un turno nuevo (`areaSugeridaPorRol` en `features/turnos/domain/cuadranteRules.ts`). `TurnoAsignado` es la instancia real día a día que arma el cuadrante.

**Validación de solapamiento y descanso mínimo (12hs) es 100% cliente**, en `domain/cuadranteRules.ts` — no hay Cloud Function ni regla de Firestore que la replique server-side. El solapamiento bloquea el guardado; el descanso insuficiente y el exceso de horas diarias (>9hs) solo avisan, no bloquean, para no impedir coberturas de urgencia válidas.

**Por qué escritura directa del cliente (sin Cloud Function)**, a diferencia de `Asignacion`/`Mesa.mozoIds`: no hay dos documentos que deban quedar consistentes entre sí en esta fase (eso empieza a aplicar recién con Solicitudes, cuando aprobar una pise el cuadrante — fuera de esta vuelta). Mismo criterio que `Salon`/`CartaProducto`: CRUD simple, permisos resueltos en `firestore.rules`.

**Quién puede escribir:** `administrador` o `encargado` (`canGestionarTurnos` en `firestore.rules`) — es la única colección donde `encargado` tiene permiso de escritura a la par del admin; el resto del panel sigue reservado a `administrador`. Cualquier staff activo puede leer el cuadrante completo (necesita ver a sus compañeros para pedir cambios de turno en una fase futura).

**Aprobar una `Solicitud` de día libre/vacaciones/licencia cancela (borra) los `TurnoAsignado` del empleado dentro del rango de fechas** — ver [Solicitud](#solicitud) para el detalle completo.

**🔴 Pendiente — fases futuras del módulo Jornadas, fuera de esta vuelta:**
- Turnos recurrentes ("todos los lunes") — hoy cada turno se carga individualmente.
- Descanso mínimo configurable por restaurante (hoy es una constante fija de 12hs en `domain/`).

---

## Fichaje

**Estado:** 🟢

`/restaurantes/{restauranteId}/fichajes/{fichajeId}` — registro real de entrada/salida de un empleado. Parte del módulo "Jornadas" (`/panel/turnos`, pestaña "Fichaje").

| Campo | Tipo | Notas |
|---|---|---|
| staffId | string | ref a `staff` — siempre uno mismo, ver más abajo |
| fecha | string (`YYYY-MM-DD`) | día de la entrada según el reloj del dispositivo que fichó; permite `where('fecha','==',...)` sin rango de timestamps |
| turnoAsignadoId | string \| null | turno planificado más cercano al momento de fichar (`turnoMasCercano` en `domain/fichajeRules.ts`, ventana de 4hs); `null` si no hubo ninguno cerca. Se calcula una sola vez al fichar la entrada, no se recalcula después |
| entrada | timestamp | |
| salida | timestamp \| null | `null` mientras la jornada sigue abierta |
| restauranteId | string | denormalizado |
| createdAt / updatedAt | timestamp | |

```json
{
  "staffId": "staff_lucia",
  "fecha": "2026-03-10",
  "turnoAsignadoId": "turno_abc123",
  "entrada": "2026-03-10T15:02:00Z",
  "salida": null,
  "restauranteId": "resto_donmario",
  "createdAt": "2026-03-10T15:02:00Z",
  "updatedAt": "2026-03-10T15:02:00Z"
}
```

**El único requisito para fichar es tener sesión iniciada en el sistema** — pedido explícito del usuario, sin PIN, QR ni geolocalización. Fichar es siempre sobre uno mismo: `firestore.rules` exige `request.resource.data.staffId == request.auth.uid` al crear, y el único `update` permitido es cerrar la propia jornada abierta (setear `salida`) — el resto de los campos son inmutables después de creado. No hay `delete` (`allow delete: if false`): un registro de asistencia no se borra.

**Comparativa planificado vs. real** (`estadoEntrada`/`estadoSalida`/`horasTrabajadas` en `domain/fichajeRules.ts`, con 5 minutos de tolerancia): compara `entrada`/`salida` contra `horaInicio`/`horaFin` del `TurnoAsignado` asociado. Sin turno asociado no hay comparación posible (el fichaje se muestra igual, sin badge de tarde/anticipada). La tabla "Equipo hoy" (`FichajesHoyTabla`, solo para quien gestiona el cuadrante — `puedeGestionarTurnos`) arma una fila por empleado con turno y/o fichaje hoy (`filasFichajeDelDia`) y clasifica a quien tiene turno sin ningún fichaje como `'demorado'` (el turno sigue en curso) o `'ausente'` (el turno ya terminó).

**Por qué no hay Cloud Function**: mismo criterio que `TurnoAsignado` — es una escritura de un solo documento, sin necesidad de consistencia atómica con otra colección en esta fase. El control de "quién puede fichar qué" lo resuelve `firestore.rules` comparando `staffId` contra `request.auth.uid`.

**🔴 Pendiente — fuera de esta vuelta:**
- Corrección manual de un fichaje por parte de un encargado (hoy es inmutable salvo cerrar la propia salida).
- "No fichar una segunda entrada sin cerrar la anterior" hoy solo lo impone la UI (`MiFichajeCard` oculta el botón "Fichar entrada" mientras hay una jornada abierta) — no hay regla de Firestore que lo bloquee a nivel de escritura.

---

## Solicitud

**Estado:** 🟢

`/restaurantes/{restauranteId}/solicitudes/{solicitudId}` — pedido de día libre, vacaciones o licencia de un empleado. Parte del módulo "Jornadas" (`/panel/turnos`, pestaña "Solicitudes"). **No incluye "cambio de turno"**: pedido explícito del usuario — el cuadrante solo lo modifica quien lo gestiona (admin/encargado); cualquier cambio de turno se conversa en vivo, no queda modelado como solicitud del empleado.

| Campo | Tipo | Notas |
|---|---|---|
| staffId | string | quien solicita |
| tipo | `'dia_libre' \| 'vacaciones' \| 'licencia'` | |
| fechaDesde / fechaHasta | string (`YYYY-MM-DD`) | iguales para `'dia_libre'` (un solo día); rango para vacaciones/licencia |
| motivo | string | texto libre del empleado, obligatorio |
| estado | `'pendiente' \| 'aprobada' \| 'rechazada'` | |
| respuestaAdmin | string | nota de quien resuelve, típicamente el motivo de un rechazo; `''` si no se cargó |
| resueltoPor | string \| null | `staffId` de quien aprobó/rechazó; `null` mientras está `pendiente` |
| resueltoEn | timestamp \| null | |
| turnosAsignadosIdsCancelados | string[] | ids de los `TurnoAsignado` que la aprobación canceló — trazabilidad de qué tocó exactamente esta solicitud; `[]` si no había ninguno o si todavía no se resolvió |
| restauranteId | string | denormalizado |
| createdAt | timestamp | |

```json
{
  "staffId": "staff_lucia",
  "tipo": "dia_libre",
  "fechaDesde": "2026-03-12",
  "fechaHasta": "2026-03-12",
  "motivo": "Trámite personal",
  "estado": "aprobada",
  "respuestaAdmin": "",
  "resueltoPor": "staff_admin",
  "resueltoEn": "2026-03-10T14:00:00Z",
  "turnosAsignadosIdsCancelados": ["turno_abc123"],
  "restauranteId": "resto_donmario",
  "createdAt": "2026-03-09T10:00:00Z"
}
```

**Aprobar "mata" el cuadrante de esos días** (pedido explícito del usuario): `solicitudRepository.aprobar` relee los `TurnoAsignado` del empleado en `[fechaDesde, fechaHasta]` en el momento de aprobar (no confía en lo que tenga cacheado la pantalla) y, en un mismo `writeBatch`, actualiza la `Solicitud` (`estado: 'aprobada'`, `turnosAsignadosIdsCancelados`) y **borra** esos turnos — no los marca como cancelados, los elimina. La propia `Solicitud` aprobada, con su rango de fechas y motivo, queda como el registro de por qué ese día no tiene turno (no hace falta un `estado: 'cancelado'` en `TurnoAsignado` para eso).

**Visibilidad más acotada que `TurnoAsignado`/`Fichaje`**: cada empleado lee sus propias solicitudes; quien gestiona el cuadrante lee todas. A diferencia del resto del módulo (donde todo el staff activo ve el cuadrante/fichajes completos), acá no hay visibilidad de equipo — el motivo de una licencia es un dato sensible.

**El empleado puede retirar su propio pedido mientras siga `pendiente`** (`allow delete` en `firestore.rules`, acotado a `staffId == request.auth.uid && estado == 'pendiente'`). Una vez resuelto (aprobado o rechazado), es inmutable — ni el empleado ni el encargado lo editan después.

**Por qué no hay Cloud Function**: la aprobación toca dos colecciones (`solicitudes` + `turnosAsignados`) pero ambas ya son escribibles directo por quien gestiona el cuadrante — un `writeBatch` del lado del cliente alcanza para la atomicidad, mismo criterio que `mesaRepository.saveLayout`. No hace falta validar nada que Firestore Rules no pueda expresar.

**🔴 Pendiente — fuera de esta vuelta:**
- Historial completo para el encargado (hoy solo ve la cola de `pendiente`; lo resuelto queda visible únicamente en el "Mis solicitudes" de cada empleado).

---

## Notificación

**Estado:** 🟢

`/restaurantes/{restauranteId}/notificaciones/{notificacionId}` — aviso en la campana del header (`PanelHeader`) para un único destinatario. Primer y único origen hoy: el ciclo de vida de [Solicitud](#solicitud) — se crea una notificación a quien gestiona el cuadrante (`administrador`/`encargado`, mismo criterio que `canGestionarTurnos`) cuando un empleado pide un día libre/vacaciones/licencia, y una al empleado cuando esa solicitud se resuelve.

| Campo | Tipo | Notas |
|---|---|---|
| destinatarioStaffId | string | `staffId` de quien la recibe — cada doc es para un único destinatario, sin listas de "leído por" |
| tipo | `'solicitud_creada' \| 'solicitud_resuelta'` | determina el ícono en la campana; hoy son los únicos dos orígenes |
| mensaje | string | texto ya armado en `domain/solicitudRules.ts` (ej. "Lucía solicitó vacaciones.") — esta colección no arma el mensaje, solo lo persiste |
| solicitudId | string | referencia a la `Solicitud` que originó el aviso; click navega a Jornadas › Solicitudes |
| leida | boolean | `false` al crearse; el propio destinatario la marca al abrir la campana o al hacer click |
| restauranteId | string | denormalizado |
| createdAt | timestamp | |

```json
{
  "destinatarioStaffId": "staff_admin",
  "tipo": "solicitud_creada",
  "mensaje": "Lucía solicitó día libre.",
  "solicitudId": "sol_abc123",
  "leida": false,
  "restauranteId": "resto_donmario",
  "createdAt": "2026-03-09T10:00:00Z"
}
```

**Por qué un doc por destinatario, no un array de `staffIds`:** cada quien marca su propia notificación como leída de forma independiente; un único doc compartido con un array de "leído por" complicaría las reglas de escritura (`firestore.rules` valida que solo se toque `leida` del propio documento) sin ganar nada, dado que el volumen por restaurante es bajo.

**Quién crea el documento (sin Cloud Function):** el mismo cliente que dispara la acción de negocio, dentro de `solicitudRepository` (`crear` → notifica a `administrador`/`encargado` activos; `aprobar`/`rechazar` → notifica a `solicitud.staffId`). `firestore.rules` valida que el `tipo` declarado sea consistente con el rol de quien escribe y con el rol del destinatario — mismo criterio que el resto del proyecto (Firestore Rules alcanza, no hace falta server-side).

**Por qué no hay push/email todavía:** fuera del alcance pedido — la campana refleja en tiempo real vía `onSnapshot` mientras la pestaña sigue abierta, igual que el resto del panel.

---

## Reserva

**Estado:** 🔴 — `Pedido / Comanda` ya está cerrado (`pedidoInicialId` puede referenciarlo con el shape real), pero quedan sin resolver los otros pendientes de la lista de abajo.

`/restaurantes/{restauranteId}/reservas/{reservaId}` — colección raíz.

| Campo | Tipo | Notas |
|---|---|---|
| mesaId | string | |
| salonId | string | |
| clienteNombre | string | |
| clienteTelefono | string | |
| fechaHora | timestamp | |
| cantidadPersonas | number | |
| estado | `'confirmada' \| 'cancelada' \| 'completada'` | |
| pedidoInicialId | string | compra vinculante — ref a `pedidos` |
| createdAt | timestamp | |

**🔴 Pendiente para cerrar esta entidad:**
- Definición final de `pedidoInicialId` (depende de que `Pedido` esté cerrado).
- Validación de solapamiento de reservas (diferida explícitamente).
- Política de cancelación/no-show y qué pasa con la compra vinculante.

---

## Log de decisiones

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| `qrCodes/{qrToken}` es colección raíz separada, además del `qrToken` embebido en `Mesa` | Solo el `qrToken` embebido, sin colección aparte | El comensal escanea sin sesión — necesita resolver `restauranteId/salonId/mesaId` con lectura pública, sin poder hacer una query a `mesas` (no sabría en qué restaurante/salón buscar). *(Corrige una entrada anterior de este log que decía lo contrario y no coincidía con el código real — ver [Código QR](#código-qr))* |
| Generación del código QR 100% manual (botón "Generar código QR" en "Editar mesa"), no automática al crear la mesa | Auto-generar el QR de cada mesa al guardar el diseño (como estaba antes) | Pedido explícito: permite distinguir mesas con/sin QR habilitado (indicativo visual en el lienzo) — con generación automática, todas las mesas ya tendrían QR y el botón no tendría sentido |
| `Mesa.mozoIds` es array (varios mozos a la vez), no un `mozoActualId` único | Un solo mozo por mesa | Pedido explícito: una mesa puede tener más de un mozo asignado (turnos superpuestos, cobertura compartida) |
| La asignación de mozos pasa por la Cloud Function `asignarMozoAMesa` (con historial real en [Asignación](#asignación)), el cliente nunca escribe `Mesa.mozoIds` ni `asignaciones` directo | Escritura directa del cliente a `Mesa.mozoActualId`, sin usar `Asignacion` | *(Corrige una entrada anterior de este log que decía que `Asignacion` "queda sin ningún consumidor real" — ya no es así: `asignarMozoAMesa`/`liberarMesa` la usan activamente)*. Mantiene consistente el historial y evita condiciones de carrera entre asignaciones concurrentes |
| `pedidos` es colección raíz | Subcolección de `mesa` | Cocina necesita un listener global sin `collectionGroup` |
| `mesas` es subcolección de `salones` | Colección raíz con `salonId` como campo | La UI siempre navega por salón; anidar reduce lecturas al set visible |
| Cambios de estado de mesa vía Cloud Functions transaccionales | Escritura directa desde el cliente | Consistencia (evita condiciones de carrera entre "primer pedido" y "mozo libera mesa") |
| Todas las escrituras pasan por Cloud Functions callable | Firestore Rules + escritura directa del cliente | Ya definido en las convenciones del proyecto; permite validar `qrToken` y lógica de negocio server-side |
| `staffIndex/{uid}` como colección raíz auxiliar | Custom claims de Firebase Auth (`restauranteId`/`rol` en el ID token) | Resuelve la sesión sin manejar refresh de token; con `staff` ya anidado bajo `restaurantes`, alcanza con dos `get()` directos |
| El alta de staff (no admin) crea la cuenta de Auth vía Cloud Function callable con Admin SDK | App secundaria de Firebase en el cliente | Permite validar server-side que quien da de alta es admin activo del restaurante, y no depende únicamente de Firestore Rules |
| Tamaño de elemento fijo por `forma` (sin resize individual) | Resize libre por elemento en el lienzo | Prototipo: alcanza con tamaños estándar para representar el layout real, evita sumar complejidad de handles de resize |
| Solo la Barra rota (horizontal/vertical, dos orientaciones) | Rotación libre en ángulo, o rotación también para Mesa/Baños | Es el único elemento donde la orientación cambia el layout real de forma relevante (largo vs. angosto); el resto no lo pidió el usuario |
| Guardado del lienzo con botón explícito ("Guardar diseño") + diff en un solo `writeBatch` | Autoguardado por mesa al soltarla | Evita escrituras parciales mientras se arma el layout y permite descartar cambios antes de persistir |
| Secciones de Barra = N docs `Mesa` normales que comparten `grupoId` (con `posicion`/`rotacion` en mirroring continuo entre todas) | Doc `Barra` contenedor + subcolección de secciones, o una "sección ancla" con reasignación al borrarla | Cada sección ya es una mesa completa en todo sentido operativo (propio `qrToken`, propio `estado`, futuro propio `pedidoActivoId`); modelarla aparte duplicaría toda la infraestructura de diff/save/QR ya existente. El mirroring evita necesitar lógica de reasignación de "ancla" al borrar una sección cualquiera |
| `cartaProductos` es colección plana con `seccionId` denormalizado | Subcolección de cada `cartaSeccion` | La futura feature de Menús (combos) arma un menú referenciando productos de varias secciones sin queries anidadas — mismo criterio que `pedidos` |
| Todos los campos del plato (nombre, descripción, precio, imagen) son opcionales | Nombre obligatorio como mínimo | Pedido explícito: permite cargar una carta de forma incremental/parcial |
| "Adjuntar imagen" (interpretación automática de una foto de la carta) queda deshabilitada en la UI, sin lógica ni modelo de datos | Implementar OCR/IA de entrada | Fuera del stack definido en CLAUDE.md; se define como fase aparte |
| `cartaProductos.gruposOpciones` es un array embebido y recursivo (grupo → opciones → subgrupos → ...) dentro del propio documento del producto | Colección/subcolección aparte para grupos/opciones | Sin identidad ni ciclo de vida propio fuera del plato; evita N lecturas extra por plato y preserva el patrón de un único `onSnapshot` para toda la carta |
| Cada grupo de opciones tiene flags `obligatorio` y `seleccionMultiple` configurables por el admin (no un tipo fijo "única"/"múltiple" a nivel de esquema) | Tipos de grupo predefinidos (ej. `'salsa' \| 'guarnicion'`) | Pedido explícito: la lógica de "salsas a distinto precio" y "guarniciones con una opción que abre más opciones" tiene que poder armarse libremente para cualquier plato, no quedar atada a categorías fijas |
| "Punto de cocción" (u otra indicación que el comensal se olvida de dar, o puede pedir algo que el local no ofrece) se resuelve con un `GrupoOpciones` común marcado `obligatorio: true` y `seleccionMultiple: false`, no con un campo/tipo de dato nuevo | Un campo `puntoCoccion` dedicado en `CartaProducto`, o un tipo especial de grupo | Reutiliza toda la lógica ya construida (validación de obligatorios, precio adicional si aplica, UI de selección) sin sumar un caso especial; y al ser opciones de una lista cerrada que define el propio local, el comensal no puede escribir un punto que el restaurante no maneja |
| `permiteComentarios` es un campo booleano aparte en `CartaProducto`, no un `GrupoOpciones` más | Modelar el comentario como otro grupo de opciones (ej. con una sola "opción" de texto libre) | El comentario es texto libre sin precio ni validación de obligatoriedad — forzarlo dentro del modelo de grupos/opciones (pensado para listas cerradas) sería más confuso que un flag simple |
| `PedidoItem.detalle`/`comentario` reutilizan exactamente el shape ya validado en la previsualización de la carta (`CarritoPreviewItem`), centralizado en `src/types/pedido.ts` | Definir un shape de línea de pedido nuevo e independiente | Evita divergencia entre "lo que el comensal previsualiza" y "lo que se termina guardando" — son conceptualmente el mismo carrito en dos momentos distintos |
| La máquina de estados y los roles habilitados por transición viven como datos en `domain/pedidoRules.ts`, no en `firestore.rules` | Codificar las transiciones válidas directo en las reglas de Firestore | Mismo criterio ya usado en el resto del proyecto: `firestore.rules` autoriza por `restauranteId`/rol de staff en general, la lógica de negocio fina (qué transición puntual es válida) vive en `domain/`, testeable sin desplegar reglas |
| `cancelado` requiere `motivoCancelacion` no vacío y solo lo puede disparar `mozo`/`administrador` (no `cocinero`/`bartender`) | Permitir cancelar sin motivo, o habilitar a cualquier rol | Un pedido cancelado sin razón documentada no sirve para estadísticas ni para resolver reclamos; y dejar que cocina cancele directo se presta a que se cancele para "sacárselo de encima" en vez de resolverlo con el mozo |
| El set de pruebas de pedidos (`scripts/seedPedidos.ts`) escribe directo con Admin SDK, sin pasar por una Cloud Function | Escribir una Cloud Function `crearPedido` completa antes de poder generar datos de prueba | Todavía no existe ningún flujo real de alta de pedidos (ni app del comensal ni UI de mozo) contra el cual validar esa Cloud Function; un script de seed con Admin SDK es el patrón estándar para poblar datos de prueba y bypasea reglas como cualquier otro script administrativo de este proyecto |
| `Pedido.historialEstados` es un array embebido en el propio documento (append-only) | Subcolección `pedidos/{id}/historial/{entradaId}`, o solo confiar en `updatedAt` | Se necesita el timeline completo (no solo el último cambio) para medir tiempos entre estados, y el volumen es chico (a lo sumo 5 entradas: una por cada estado de la máquina). Una subcolección forzaría una lectura extra por pedido solo para ver su historial; embebido viaja gratis con el `onSnapshot` que la cocina/salón ya tienen abierto |
| `scripts/seedPedidos.ts` genera pedidos en los seis estados posibles (ponderado hacia los "en cocina" para poblar bien el tablero en vivo, pero incluye `entregado`/`pagado`/`cancelado`) | Generar únicamente estados "en cocina", como antes | Hacía falta poder probar las columnas "Entregados" del tablero y casos de `cancelado` con `motivoCancelacion`; limitarse a 3 de los 6 estados dejaba sin cubrir la mitad de la máquina de estados |

---

| El módulo "Jornadas" (`/panel/turnos`) integra el horario del local existente y el cuadrante de personal nuevo como pestañas de una misma pantalla (`Tabs` de shadcn) | Mover el horario del local a `/panel/configuracion` y dejar `/panel/turnos` 100% dedicada al cuadrante | El ítem de sidebar "Jornadas" ya apuntaba a esa ruta; tabs conserva el link mental existente y no mueve una pantalla que ya funciona |
| `TurnoAsignado` es una colección nueva, no una extensión de `Staff.turno` | Reemplazar `Staff.turno` por instancias con fecha | `Staff.turno` es una etiqueta preferente sin fecha (sirve para filtrar/agrupar); no puede representar "esta persona libra el jueves pero no el resto de la semana". Se complementan: `Staff.turno` sugiere el default de `area` al cargar un turno nuevo |
| `area` operativa (cocina/salón/barra/recepción) es un enum fijo en `TurnoAsignado`, no una entidad con CRUD propio | Colección `areas` editable por restaurante | Pedido explícito de mantener el alcance acotado en esta primera vuelta; mismo criterio que `Staff.rol` |
| Descanso mínimo entre jornadas (12hs) es una constante fija en `domain/cuadranteRules.ts`, no configurable por restaurante | Campo editable en `HorariosRestaurante` | Sin un valor legal de referencia confirmado por el usuario, fijar un default razonable y dejarlo ajustable a futuro evita bloquear esta vuelta por un dato de configuración menor |
| Solapamiento de turnos bloquea el guardado; descanso insuficiente y exceso de horas diarias solo avisan | Bloquear los tres casos por igual | Un solapamiento es imposible de cubrir en la práctica; descanso/exceso de horas pueden ser coberturas de urgencia válidas que el encargado decide a conciencia |
| `horasSemanalesContrato` se agrega a `Staff` como campo opcional, editable solo desde "Editar colaborador" (no en el alta) | Sumarlo también al alta (Cloud Function `crearStaff`) | Evita tocar la Cloud Function de alta en esta vuelta; el campo solo lo consume el cuadrante, que de todos modos se carga después de dar de alta al colaborador |
| `canGestionarTurnos` (admin **o** encargado) es una función aparte de `isAdminOf` (solo admin) en `firestore.rules`, acotada a `turnosAsignados` | Ampliar `isAdminOf` para incluir `encargado` en todas las colecciones | El resto del panel (staff, salones, carta) sigue siendo exclusivo del admin; ampliar `isAdminOf` global habría dado a todos los encargados permisos que no se pidieron fuera del cuadrante |

| El único requisito para fichar es tener sesión iniciada (`staffId == request.auth.uid`) — sin PIN, QR ni geolocalización | PIN en un dispositivo compartido, o geolocalización | Pedido explícito del usuario: en este comercio alcanza con estar logueado en el sistema |
| `Fichaje.turnoAsignadoId` se calcula una sola vez al fichar la entrada (`turnoMasCercano`, ventana de 4hs) y no se recalcula después | Recalcular en cada lectura contra el cuadrante vigente | El cuadrante puede cambiar después de fichado (el turno se edita/cancela); el fichaje tiene que reflejar contra qué turno se comparó en el momento real, no contra el estado actual del cuadrante |
| `Fichaje` no tiene Cloud Function ni permite `delete` — es inmutable salvo cerrar la propia `salida` | Permitir editar/borrar fichajes propios | Un registro de asistencia alterable por quien lo genera no sirve como fuente de verdad; la corrección por un encargado queda para una vuelta futura |
| El cuadrante (`/panel/turnos` › Cuadrantes) pasa a ser de solo lectura para quien no tiene `puedeGestionarTurnos` (ya no ofrece "Nuevo turno" ni edición) | Dejarlo editable para todo el staff, confiando solo en `firestore.rules` | La regla ya bloqueaba la escritura, pero la UI seguía ofreciendo el botón y el diálogo a cualquier rol — un mozo podía llenar el formulario entero y recién ahí recibir un error de permisos. Corrección de UX aplicada en la misma vuelta que Fichaje, que fue la primera pantalla de Jornadas pensada para todo el staff, no solo para quien administra |
| Aprobar un día libre/licencia cancela el `TurnoAsignado` del día y deja registro de la licencia aplicada (decidido, implementación en `Solicitud` pendiente) | Dejar el turno intacto y resolver el conflicto manualmente | Pedido explícito del usuario: la aprobación tiene que reflejarse automáticamente en el cuadrante, no requerir un segundo paso manual del encargado |

| `Solicitud` no incluye `'cambio_turno'` como tipo — solo día libre/vacaciones/licencia | Modelar el cambio de turno como una solicitud más, con `turnoAsignadoIdRelacionado` y horario propuesto | Pedido explícito del usuario: el cuadrante solo lo modifica quien lo gestiona; un cambio de turno se conversa en vivo, no genera un aviso en el sistema |
| Aprobar una `Solicitud` borra los `TurnoAsignado` afectados (no los marca `cancelado`) | Agregar un estado `'cancelado'` a `TurnoAsignado` y conservar el documento | La propia `Solicitud` aprobada (con su rango de fechas y motivo) ya es el registro de por qué ese día no tiene turno — sumar un estado más a `TurnoAsignado` solo para este caso hubiera sido redundante |
| `solicitudRepository.aprobar` relee los turnos del rango en el momento de aprobar, no usa lo que tenga cacheado la pantalla | Pasarle los turnos ya cargados en el cuadrante visible | El cuadrante pudo cambiar entre que se creó la solicitud y se aprueba, y el rango de fechas de la solicitud puede caer fuera de la semana/mes que el encargado tiene abierto en pantalla |
| `Solicitud` tiene visibilidad acotada (cada uno lee las propias; quien gestiona el cuadrante las lee todas) | Visibilidad de equipo completo, igual que `TurnoAsignado`/`Fichaje` | El motivo de una licencia es un dato sensible — a diferencia de un horario de trabajo, no hay razón operativa para que un compañero vea por qué otro pidió un día libre |
| `Notificacion` notifica a `administrador` **y** `encargado` cuando se crea una `Solicitud`, no solo a `administrador` | Notificar solo al rol `administrador`, tal como se pidió literalmente | `encargado` ya puede aprobar/rechazar (`canGestionarTurnos`) — dejarlo sin aviso lo dejaría ciego a pedidos que igual puede resolver. Confirmado con el usuario antes de implementar (`docs/database-schema.md#notificación`) |
| `Notificacion` es una subcolección de `Restaurante` con un doc por destinatario, sin Cloud Function | Colección raíz global, o un doc compartido con array de destinatarios/leídos | Mismo criterio de particionado por restaurante que el resto del modelo; un doc por destinatario deja "marcar como leída" como una escritura acotada a un solo documento propio, expresable en `firestore.rules` sin lógica server-side |

| La pestaña "Métricas" de Jornadas (horas planificadas/trabajadas, cumplimiento, ausentismo) no es una entidad nueva — lee `TurnoAsignado` + `Fichaje` ya existentes y agrega solo lógica de agregación en `domain/metricsRules.ts` | Persistir métricas precalculadas en una colección aparte | El volumen de datos (turnos/fichajes de una semana o mes de un restaurante) no justifica desnormalizar; calcularlo al vuelo del lado del cliente alcanza y evita mantener dos fuentes de verdad |
| `MetricasTab` (y `recharts`) se cargan con `React.lazy()` desde `TurnosPage`, a diferencia del resto de las pestañas de Jornadas | Import estático como las demás pestañas | `recharts` es una dependencia pesada que no aporta nada al primer render de Cuadrantes/Fichaje/Solicitudes — caso de manual explícito en CLAUDE.md §5.1 ("gráficos de métricas... si no son visibles en el primer render") |
| Métricas es visible solo para `puedeGestionarTurnos` (admin/encargado), igual que la tabla de fichajes del equipo | Visible para todo el staff | Horas trabajadas y ausentismo de todo el equipo son datos de gestión, no algo que cada mozo necesite ver de sus compañeros |
| Un turno solo cuenta para "ausentismo" si ya terminó (`fecha + horaFin < ahora`) y ningún fichaje de ese empleado existe ese mismo día | Contar como ausente cualquier turno sin fichaje, incluidos los que todavía no empezaron o están en curso | Marcar "ausente" un turno que todavía puede ficharse sería un falso positivo — la métrica tiene que reflejar solo lo que ya es un hecho consumado |

## Cómo usar este documento con Claude Code

- En el prompt de cada feature, referenciá la sección puntual: *"Implementá el CRUD de Mesa usando el esquema de `docs/database-schema.md#mesa`"*.
- Si una feature toca una entidad 🔴 o 🟡, primero cerrá esa sección de este documento — no dejes que Claude Code complete el diseño por default.
- Cuando una decisión de diseño cambie, actualizá la tabla de "Log de decisiones" en el mismo commit que el código, no después.