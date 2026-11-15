# SPARK_DECISIONS

Registro de decisiones de diseño e implementación del proyecto Spark.

Formato: fecha, contexto, decisión, alternativas. Entradas en orden cronológico.

---

## D001 — 2026-11-11 — Punto de partida del fork

**Contexto.** El plan (Fase 0) indica partir del monorepo `scratch-editor` de la
Scratch Foundation. El directorio `/home/alm/Projects/ts/spark` estaba vacío.

**Decisión.** Clonar `scratchfoundation/scratch-editor` (rama `develop`, commit
`73ea5b020d02fcd00a0ce502596541d887371300`, versión 15.3.0) directamente en este
directorio y mantener la rama `develop` de upstream como base. Los cambios de
Spark van en la rama `spark/develop`, que parte de `develop`.

**Alternativas.**
- Partir de un tag de release estable (`14.x`): se descartó porque `develop` es
  la línea activa y las integraciones futuras de upstream serán contra ella.
- Partir de `scratch-gui` clásico (repositorio separado): descartado; el plan
  especifica el monorepo.

---

## D002 — 2026-11-11 — Desviación del plan: las fuentes ya están en el monorepo

**Contexto.** El plan asume una estructura tipo `scratch-gui`/`scratch-vm`
repositorios separados (por ejemplo, `src/io/ble.js` de scratch-vm). El código
real del monorepo difiere.

**Decisión.** Mandan las rutas reales del monorepo. Mapeo del plan a la
estructura real:

| Plan (orientativo) | Real en este monorepo |
|---|---|
| extensiones en scratch-vm | `packages/scratch-vm/src/extensions/scratch3_*` |
| registro de extensiones | `packages/scratch-vm/src/extension-support/extension-manager.js` (`builtinExtensions`) |
| clase BLE (Scratch Link) | `packages/scratch-vm/src/util/scratch-link-websocket.js` |
| biblioteca de extensiones GUI | `packages/scratch-gui/src/lib/libraries/extensions/index.jsx` |
| proyecto por defecto (gato) | `packages/scratch-gui/src/lib/default-project/` |
| favicon | `packages/scratch-gui/static/favicon.ico` |
| logo | `packages/scratch-gui/src/components/menu-bar/scratch-logo.svg` |

**Alternativas.** Ninguna: el plan ya prevé esta situación ("verifícalos
siempre con búsquedas en el código real").

---

## D003 — 2026-11-11 — Política de scripts de instalación de npm

**Contexto.** `npm ci` bloqueó los `install scripts` de 10 paquetes
(`esbuild`, `canvas`, `playwright-chromium`, `@parcel/watcher`, `core-js`,
`unrs-resolver`) porque no están en `allowScripts`.

**Decisión.** Se aprobaron individualmente (`npm install-scripts approve`)
los necesarios para compilar y testear: `esbuild`, `unrs-resolver`, `canvas`,
`playwright-chromium`, `@parcel/watcher` y `core-js` (postinstall de telemetría
de donation, inofensivo pero requerido para evitar warnings). No se permitió
ejecutar scripts de paquetes no auditados. La lista queda en el `package.json`
raíz.

**Alternativas.** Denegar todos y reconstruir a mano: más frágil y sin
beneficio de seguridad, los aprobados son dependencias estándar del tooling
de upstream.

---

## D004 — 2026-11-11 — Comportamiento actual de la VM con extensiones desconocidas (documentado para Fase 2)

**Contexto.** La Fase 2 exige que cargar un `.sb3` con extensiones eliminadas
no descarte nada en silencio. Antes de implementar el aviso, se documenta el
comportamiento real de upstream:

1. `sb3.js` recopila los IDs de extensión de los opcodes
   (`getExtensionIdForOpcode`) sin validarlos contra la lista de extensiones
   integradas.
2. `virtual-machine.js` (`installTargets`) llama `loadExtensionURL` por cada ID
   no cargado.
3. `extension-manager.js` (`loadExtensionURL`): un ID que no está en
   `builtinExtensions` cae al camino de Web Worker, que hace `importScripts(id)`
   y falla; `onWorkerInit` rechaza la promesa.
4. El rechazo de `installTargets` hace rechazar `deserializeProject` →
   `loadProject` → la GUI muestra el alerta genérico `loadError`
   (`sb-file-uploader-hoc.jsx`). **El proyecto entero no se carga**: no hay
   carga parcial ni bloques huérfanos.

**Decisión.** En Fase 2 se cambiará este comportamiento en Spark: la carga
continuará con lo que sea posible y la GUI mostrará un aviso con la lista de
extensiones no soportadas (con test incluido).

**Alternativas.** Mantener el comportamiento upstream (fallo total): rechazado
por el plan (Fase 2, criterio de aceptación).

---

## D005 — 2026-11-11 — Identidad de marca (personajes)

**Contexto.** `context/marca.md` define los personajes de Spark: formas
primitivas redondeadas (círculos, cuadrados, triángulos…), con caras kawaii
hechas solo con líneas y puntos — dos ojos muy separados y una sonrisa entre
ellos, un poco más abajo; algunas formas llevan cara "uwu" (ojos cerrados
felices y boquita de gato; ver D024). La mascota principal es una estrella de
6 lados llamada Spark.

**Decisión.** Los recursos de marca (logo, favicon, mascota, iconos) se
dibujarán como SVG originales siguiendo esa guía, en `spark/brand/` y en los
sitios que los consume la GUI. Nada del arte de Scratch (el gato, Gobo, Pico,
Nano, Tera, Giga) se conserva como identidad: la política `TRADEMARK` del
repositorio lo prohíbe para productos derivados sin permiso escrito.

**Alternativas.** Ninguna necesaria.

---

## D006 — 2026-11-11 — Bin hoisted de playwright y línea base de tests

**Contexto.** Al ejecutar `npm test --workspace=packages/scratch-gui`, el
script `test:playwright` (`playwright test`) falla con `unknown command
'test'`: el bin hoisted `node_modules/.bin/playwright` pertenece a
`playwright-chromium` (dependencia de scratch-render), cuya CLI no tiene el
comando `test`, y tapa el bin de `@playwright/test`. Además, el binario de
Firefox no está instalado en este entorno (solo se aprobó
`playwright-chromium`), y los tests de scratch-gui corren también en Firefox.

**Decisión.**
- Línea base: los tests de scratch-gui en Playwright se ejecutan con
  `node ../../node_modules/@playwright/test/cli.js test --project=chromium`
  (desde `packages/scratch-gui`). Resultado de línea base: PASS (4/4).
- Spark solo soporta Chromium como navegador objetivo (decisión cerrada del
  plan), así que los tests de Firefox quedan fuera de la línea base. Si se
  quieren en el futuro: `npx playwright install firefox`.
- Para no saturar la CPU del equipo de desarrollo, las corridas completas se
  hacen con paralelismo mínimo (`tap --jobs=1`, `jest --runInBand`,
  `playwright --workers=1`) y `nice -n 15`.

**Alternativas.** Instalar firefox y dejar la corrida por defecto: rechazada
por consumo de recursos y por irrelevancia para el producto final.

---

## D007 — 2026-11-11 — Iconos de la extensión WeDo 2.0 (fase 1)

**Contexto.** La fase 1 pide revisar los iconos heredados de WeDo 2.0: no
usar logos de LEGO como identidad y sustituirlos si hay dudas sobre su origen.
Los assets son `wedo.png` (miniatura de la extensión), `wedo-small.svg`
(icono pequeño), `wedo-illustration.svg` y `wedo-button-illustration.svg`
(ilustraciones del hub en el modal de conexión).

**Decisión.** Se conservan. Son dibujos originales de Scratch (monorepo
AGPL-3.0, con atribución en `NOTICE`) que **depictan** el dispositivo
soportado; no contienen el logotipo ni la marca escrita "LEGO" (verificado
buscando `LEGO`/`lego` en el SVG y revisando las imágenes). Son documentación
funcional del hardware, no identidad de Spark. Si en el futuro se quisiera un
icono propio, se sustituyen en la fase 5 junto con la biblioteca multimedia.

**Alternativas.** Sustituir ya por iconos propios: aplazado a la fase 5 para
no duplicar trabajo.

---

## D008 — 2026-11-11 — Identificadores de mensaje propios para el rebranding

**Contexto.** Las traducciones de `scratch-l10n` (paquete externo) sustituyen
el `defaultMessage` de los mensajes con id de Scratch, de modo que cambiar el
`defaultMessage` no cambia el texto visible (p. ej.
`gui.gui.defaultProjectTitle` → "Proyecto de Scratch").

**Decisión.** Las cadenas cuyo texto debe cambiar por marca se redefinen con
identificadores propios con prefijo `spark.` (p. ej. `spark.gui.defaultProjectTitle`,
`spark.menuBar.joinAction`, `spark.about.*`). Esas cadenas se muestran en
inglés hasta que la fase 7 añada las traducciones propias al español e
inglés. El resto de cadenas con textos genéricos se mantiene con sus ids
originales.

**Alternativas.** Forkear `scratch-l10n`: descartado (peso y mantenimiento);
editar las traducciones en runtime: descartado por complejidad.

---

## D009 — 2026-11-11 — Regla: nada de comentarios en archivos JSON

**Contexto.** Al marcar un cambio en `packages/scratch-gui/package.json` se
añadió un comentario `// SPARK:` en el JSON. El JSON no admite comentarios, así
que el archivo dejó de parsearse y **jest fallaba al arrancar** ("Exit prior to
config file resolving"), lo que rompía toda la suite de tests de la GUI hasta
detectar la causa.

**Decisión.** En archivos JSON (`package.json`, `tsconfig.json`, etc.) no se
añaden comentarios: el motivo se anota en este documento y, si hace falta, en
un archivo de notas del paquete. Los comentarios `// SPARK:` solo se usan en
archivos JavaScript/TypeScript/CSS/HTML.

**Alternativas.** Usar campos de tipo "jsonc" admitidos por algunas
herramientas: no es portable y Jest/Node los leen como JSON estricto.

---

## D010 — 2026-11-11 — Sin telemetría y sin redirección a scratch.mit.edu (fase 1)

**Contexto.** La interfaz visible de Scratch ofrecía el modal de telemetría
("Report statistics to improve Scratch", con enlace a la política de privacidad
de Scratch) y el playground redirigía a `https://scratch.mit.edu` al pulsar el
logo. Spark, por definición, no envía datos de uso (plan, sección 2) y no debe
enlazar a dominios de Scratch.

**Decisión.**
- El playground deja de montar el modal de telemetría (`showTelemetryModal`) y
  de los handlers asociados. El componente `telemetry-modal.jsx` permanece en el
  código y se eliminará en la fase 4, junto con el resto de analítica.
- El logo del menú y el del stage en pantalla completa ya no enlazan a
  `scratch.mit.edu`; el playground tampoco redirige.
- Se eliminan los enlaces de ayuda al FAQ de Scratch en los modales de
  navegador y WebGL, y el enlace del aviso de variables en la nube.

**Alternativas.** Reescribir ahora los textos del modal de telemetría: no tiene
sentido si el modal no se muestra; se hará en la fase 4.

---

## D011 — 2026-11-12 — Poda de extensiones: qué ocurre con los bloques no soportados

**Contexto.** La fase 2 elimina ocho extensiones (Makey Makey, micro:bit, Go
Direct, EV3, BOOST, Texto a voz, Traductor y Detección de caras). Un proyecto
`.sb3` que las use debe seguir cargando (sin fallar) y avisar de lo que falta.

**Decisión.**
- En `scratch-vm`, el registro `builtinExtensions` queda con Lápiz, WeDo 2.0,
  Música, Detección de vídeo y el ejemplo `coreExample`.
- Al deserializar, los bloques cuyo opcode pertenece a una extensión no
  soportada **no se crean**, y tampoco se crean los bloques que dependen de
  ellos (cadenas de `parent`/`next`). El resto del proyecto se carga con
  normalidad.
- La VM registra las extensiones afectadas en
  `runtime.unsupportedExtensions`, que la interfaz lee tras cargar el
  proyecto para mostrar el aviso `unsupportedExtensions` con sus nombres
  legibles (`src/lib/unsupported-extensions.js`).
- La lista se reinicia en cada `loadProject`, para no arrastrar avisos del
  proyecto anterior.

**Alternativas.**
- Mantener los bloques y dejarlos sin implementación: el usuario vería bloques
  que no hacen nada, sin indicación clara. Rechazado.
- Fallar la carga como hace upstream (D004): rechazado por el plan.

---

## D012 — 2026-11-12 — Se elimina la descarga del firmware de micro:bit

**Contexto.** `packages/scratch-gui/scripts/prepare.mjs` descargaba en cada
build el firmware de micro:bit desde `downloads.scratch.mit.edu` y generaba
`src/generated/microbit-hex-url.cjs`.

**Decisión.** Con la extensión micro:bit eliminada, el script de preparación
deja de descargar nada. Con ello el build de la GUI deja de depender de la
red y de los servidores de Scratch (la fase 4 sigue eliminando el resto de
dependencias de red).

**Alternativas.** Mantener la descarga por si se recupera la extensión:
descartado, el código muerto no debe depender de la red.

---

## D013 — 2026-11-12 — Incidente: import por defecto cambiado a import con nombre

**Contexto.** Al reescribir `src/playground/render-gui-standalone.jsx` (para
quitar la telemetría) se cambió `import HashParserHOC from
'../lib/hash-parser-hoc.jsx'` por `import {HashParserHOC} from ...`. El módulo
exporta el HOC por defecto, así que el nombre importado era `undefined` y
`compose()` de redux fallaba al montar el editor standalone con
`TypeError: Cannot read properties of undefined (reading 'apply')`.

**Síntomas.** El editor standalone no arrancaba: sin toolbox, sin bloques. Los
tests de integración de la GUI fallaban (14 de 134) con "Code" no encontrado,
mientras que la misma suite pasaba aislada. El error solo aparecía en la
consola del navegador.

**Decisión.** El fallo se detectó comparando la suite de integración completa
con el **upstream sin modificar**, en un *worktree* independiente
(`git worktree add <ruta> 73ea5b0` + `npm ci` + build). Ese baseline es el
método de referencia para cualquier fallo dudoso. Además, los tests de
integración deben revisarse siempre con la consola del navegador
(`test-results/selenium-error-*/browser-log.txt`), que es donde aparece el
error real.

**Alternativas.** No comparar con upstream: habría dejado el editor standalone
roto sin forma de distinguir la regresión de un problema del entorno.

---

## D014 — 2026-11-12 — Línea base del upstream para los tests de integración

**Contexto.** Los tests de integración de scratch-gui dependen de un navegador
real (Selenium/Chromium) y son sensibles al estado del equipo: una máquina
cargada provoca timeouts que parecen regresiones.

**Decisión.** Se mantiene un worktree con el upstream intacto
(`/tmp/opencode/upstream-baseline`, commit `73ea5b0`, `npm ci` + build) para
ejecutar la misma suite y comparar. Línea base del upstream: **127 tests
pasados, 0 fallos**. Cualquier fallo en Spark se compara contra ese resultado
antes de tocar código. Las corridas se hacen con paralelismo mínimo
(`--runInBand`) y `nice -n 15` para no saturar la CPU.

---

## D015 — 2026-11-12 — Procesos de Chrome fugados entre corridas de integración

**Contexto.** Cada suite de integración abre su propio Chrome. En varias
corridas seguidas se acumularon **143 procesos de Chrome** vivos, y el equipo
empezó a matar sesiones de forma aleatoria (`NoSuchSessionError: This driver
instance does not have a valid session ID`), con tests distintos fallando en
cada corrida.

**Decisión.** Entre corridas se limpian los procesos: `pkill -f chrome;
pkill -f chromedriver`. Un fallo con ese mensaje se considera **fallo de
entorno**, no regresión: se comprueba en solitario y contra el baseline del
upstream (D014) antes de tocar código.

**Alternativas.** Ignorar los fallos "de sesión": descartado, porque oculta
regresiones reales (fue justo el caso de D013).


## D016 — 2026-11-12 — El test del modal de conexión tumbaba el navegador

**Contexto.** Al reescribir `connection-modal.test.js` (que en upstream usaba
micro:bit y EV3, ya eliminados) se buscó en el modal el texto "Bluetooth",
que **no existe**: el modal de WeDo 2.0 muestra el paso previo a la búsqueda
("Press the button on your LEGO WeDo 2.0…" / "Start Searching"). La búsqueda
del texto inexistente esperaba 20 s y, mientras tanto, la extensión reintentaba
la conexión (Scratch Link, que en esta fase sigue siendo el transporte) hasta
que la sesión del navegador moría (`invalid session id`).

**Síntoma.** Una suite de integración fallaba por corrida, siempre con una
sesión de navegador muerta, y **la suite que fallaba era la anterior en el
orden de ejecución**: el error se atribuía a la suite siguiente, lo que hacía
parecer un problema de orden o de recursos.

**Decisión.** El test comprueba ahora el texto que el modal muestra de verdad
("Start Searching"), sin esperas largas. Además, `selenium-helper.js` ya no
propaga el error del volcado de información cuando el navegador no responde:
guarda el error en los ficheros de diagnóstico y deja ver el error original.

**Alternativas.** Dejar el test como estaba y esperar al rediseño del flujo de
conexión de la fase 3: descartado, porque el fallo escondía el error real.

---

## D017 — 2026-11-12 — El puente Web Bluetooth sustituye a Scratch Link

**Contexto.** La extensión WeDo 2.0 usaba `src/io/ble.js`, que habla
JSON-RPC con Scratch Link por WebSocket (`ws://127.0.0.1:20111` o
`wss://device-manager.scratch.mit.edu`). Spark no debe depender de Scratch
Link ni de ningún proceso externo.

**Decisión.**
- Nueva clase `packages/scratch-vm/src/io/web-bluetooth-session.js`
  (`WebBluetoothSession`) con la **misma interfaz pública** que la clase
  sustituida: constructor (`runtime`, `extensionId`, `peripheralOptions`,
  `connectCallback`, `resetCallback`), `requestPeripheral()`,
  `connectPeripheral(id)`, `disconnect()`, `isConnected()`, `read()`,
  `write()`, `startNotifications()` y `stopNotifications()`. La extensión
  WeDo 2.0 no cambia su lógica: solo cambia el transporte.
- Se conservan los **mismos eventos del runtime** (`PERIPHERAL_LIST_UPDATE`,
  `USER_PICKED_PERIPHERAL`, `PERIPHERAL_SCAN_TIMEOUT`, `PERIPHERAL_CONNECTED`,
  `PERIPHERAL_DISCONNECTED`, `PERIPHERAL_REQUEST_ERROR`,
  `PERIPHERAL_CONNECTION_LOST_ERROR`) y la convención **base64** en los datos,
  de modo que la interfaz existente se reutiliza sin cambios.
- El transporte de Scratch Link se elimina por completo: `src/io/ble.js`,
  `src/io/bt.js`, `src/util/scratch-link-websocket.js`, la fábrica de sockets
  del runtime (`getScratchLinkSocket`, `configureScratchLinkSocketFactory`) y
  la inyección del script de la extensión de navegador (`_initScratchLink`).
- La petición del dispositivo (`navigator.bluetooth.requestDevice`) se hace
  dentro del clic del botón "Start Searching", porque el navegador exige un
  gesto del usuario. Tras la elección se emiten `PERIPHERAL_LIST_UPDATE` y
  `USER_PICKED_PERIPHERAL` con un único dispositivo, y la interfaz existente
  se encarga de conectar.
- **Todos los servicios** que usa la extensión (el del dispositivo y el de
  entrada/salida) se añaden a `optionalServices`, incluidos los que aparecen
  en los `filters`: si no, el navegador no da acceso a ellos.
- Las operaciones GATT se **serializan en una cola**: la API del navegador
  falla si dos operaciones se solapan.
- La desconexión inesperada se detecta con el evento
  `gattserverdisconnected` del servidor GATT, que llama al callback de
  reinicio de la extensión y emite `PERIPHERAL_CONNECTION_LOST_ERROR`.

**Alternativas.**
- Sustituir el socket (`configureScratchLinkSocketFactory`) por otro que
  hable JSON-RPC: descartado, obligaría a implementar el protocolo completo
  para un transporte que ya no es JSON-RPC.
- Mantener Scratch Link como alternativa: descartado, el plan lo excluye.

---

## D018 — 2026-11-12 — Soporte del navegador y reconexión

**Contexto.** Web Bluetooth solo existe en navegadores basados en Chromium
(Chrome, Edge y derivados, también en Android) y únicamente en un contexto
seguro. En Safari, iOS y Firefox no hay forma de conectar el hub.

**Decisión.**
- `src/lib/web-bluetooth.js` (GUI) y `WebBluetoothSession.isSupported()` (VM)
  comprueban la existencia de `navigator.bluetooth` y el contexto seguro.
- Si el navegador no lo soporta, el modal de conexión se abre directamente en
  el paso "no disponible", que explica que se use un navegador compatible
  (Chrome, Edge o Chromium en Android). **El editor sigue siendo usable sin
  hardware.**
- Tras una desconexión inesperada, el paso de error ofrece un botón
  **"Reconnect"** (`vm.reconnectPeripheral(extensionId)`) que vuelve a
  conectar con el mismo dispositivo.

**Alternativas.** Mostrar el error de la API tal cual: descartado, el mensaje
de la interfaz debe ser accionable.

---

## D019 — 2026-11-12 — Dónde vive el puente Web Bluetooth

**Contexto.** El plan sugería `spark/ble/WebBluetoothSession`.

**Decisión.** La clase vive en `packages/scratch-vm/src/io/web-bluetooth-session.js`,
junto a los demás transportes del VM, porque la extensión WeDo 2.0 la importa
desde el paquete `@scratch/scratch-vm`. El directorio `spark/` del repositorio
se reserva para los recursos que no dependen de un paquete concreto (por
ejemplo, la marca).

**Alternativas.** Un paquete nuevo `spark-ble` en el monorepo: descartado por
ahora, porque añadiría un paquete publicado sin necesidad; se puede mover
más adelante sin cambiar la interfaz.

---

## D020 — 2026-11-12 — Fase 4: qué se elimina y qué lo sustituye

**Contexto.** Spark debe funcionar sin red, sin cuentas y sin backend.

**Decisión.** Se elimina de la GUI todo lo que dependía de servidores de
Scratch o de cuentas:

- **Interfaz**: botones de Compartir, Remix y Comunidad; modal de telemetría;
  mochila (backpack); biblioteca de tutoriales y tarjetas (vídeos de Wistia);
  menú de usuario, "Mis cosas" y registro; carga de proyectos por id desde
  `projects.scratch.mit.edu`.
- **Módulos eliminados**: `cloud-manager-hoc`, `cloud-provider`,
  `legacy-backpack-storage`, `backpack-api`, `save-project-to-server`,
  `telemetry-modal`, `project-fetcher-hoc` se conserva pero ahora carga de los
  almacenes locales; `lib/libraries/decks`, `components/cards`,
  `containers/cards`, `containers/tips-library`, `tutorial-from-url`.
- **Analítica**: `lib/analytics.js` queda como módulo vacío (mantiene la
  interfaz de llamada para no tocar sus puntos de uso).
- **CSP**: `index.ejs` incluye una Content-Security-Policy restrictiva
  (`default-src 'self'`, `connect-src 'self'`, `form-action 'none'`).

**Alternativas.** Mantener la mochila con almacenamiento local: descartado en
la Fase 4 por alcance; se puede reintroducir más adelante sobre IndexedDB.

---

## D021 — 2026-11-12 — El guardado local: ProjectStore y assets en IndexedDB

**Contexto.** Sin servidor, el ciclo guardar/cargar debe funcionar íntegramente
en el navegador.

**Decisión.** Tres piezas en `packages/scratch-gui/src/lib/`:

- `project-store.js` + `project-store-local.js`: interfaz `ProjectStore` con
  implementación `LocalProjectStore` (IndexedDB `spark-projects`, con reserva
  en memoria si IndexedDB no está disponible). Guarda id, título, datos y
  fecha; `save(null)` genera un id `local-...`.
- `local-assets.js` + `indexed-db-helper.js`: almacén de assets (IndexedDB
  `spark-assets`) y un `Helper` de `scratch-storage` que los sirve. Así el VM
  encuentra disfraces y sonidos al recargar un proyecto sin conexión.
- `project-saver-hoc.jsx`: al guardar, escribe **todos** los assets del
  proyecto en `spark-assets` (no solo los modificados: al no haber servidor de
  assets, cualquier asset referenciado debe estar en local) y el proyecto en
  `spark-projects`.

El título del proyecto viaja en la entrada del almacén (no dentro del sb3);
`IndexedDbHelper` lo adjunta al asset cargado y `project-fetcher-hoc` restaura
el título del editor con `setProjectTitle`.

**Cableado.** `ProjectFetcherHOC` vuelve al `compose` de `containers/gui.jsx`
(carga el proyecto por defecto del caché builtin con id `0`, y los proyectos
locales por su id). `render-gui.jsx` ya no fuerza `canSave=false`; `canSave`,
`canCreateNew` y `canEditTitle` valen `true` por defecto (GUI y saver), porque
todo el guardado es local. El hash de la URL acepta ids locales
(`hash-parser-hoc.jsx`: `#local-...`).

**Alternativas.** Guardar el proyecto como un asset más en `spark-assets`:
descartado, porque el título y la lista de proyectos (`ProjectStore.list()`)
necesitan entradas propias; las dos bases de datos quedan separadas a propósito.

---

## D022 — 2026-11-12 — URL del repositorio (AGPL)

**Contexto.** El diálogo "About Spark" debe enlazar el código fuente conforme a
la AGPL-3.0.

**Decisión.** `SPARK_SOURCE_URL = 'https://almeida-aguilar.github.io/spark/fundation/'`
en `packages/scratch-gui/src/lib/spark-config.js`. Con la URL definida, el
diálogo muestra el enlace como `<a>` en vez del texto pendiente.

---
## D023 — 2026-11-13 — Fase 5: biblioteca multimedia empaquetada en local

**Contexto.** La biblioteca (disfraces, fondos, sonidos, actores) referencia
1347 assets por md5 que Scratch servía desde `cdn.assets.scratch.mit.edu`.
Sin ellos la biblioteca está muerta: las miniaturas no cargan y añadir un
elemento falla.

**Decisión.**

- `packages/scratch-gui/scripts/fetch-library-assets.js` descarga una sola vez
  los 1347 assets únicos (~58 MB) del CDN de Scratch a
  `static/library-assets/<md5ext>` (la carpeta va en `.gitignore`; se regenera
  con `npm run fetch-library-assets`). El patrón `static → static` de
  CopyWebpackPlugin los empaqueta sin cambios en el build.
- `legacy-storage.ts` registra un almacén web para `[ImageVector, ImageBitmap,
  Sound]` con URL absoluta (`new URL(..., window.location.href)`): el cliente
  de descarga de scratch-storage no resuelve rutas relativas. Se elimina el
  almacén `static/extension-assets/scratch3_music/` — código muerto del
  upstream: los sonidos de la extensión Music van inline en el bundle del VM
  y esos archivos no existen en este monorepo.
- `legacy-library-asset-url.ts` apunta a `static/library-assets/` (las
  miniaturas de la biblioteca usan `<img src>`, que admite rutas relativas).
- `docs/MEDIA_LICENSES.md` documenta la atribución (CC BY-SA 2.0, Scratch
  Foundation), enlazada desde NOTICE.

**Hallazgo durante la fase** (importante para futuros helpers): la cadena de
carga de scratch-storage solo continúa con el siguiente helper si el actual
*rechaza*; un helper que resuelve `null` de forma asíncrona corta la cadena.
`IndexedDbHelper` rechaza con un error descriptivo cuando el asset no está en
local, y `local-assets.js` convierte un `IDBRequest.result` ausente en `null`
(devolver el request crudo hacía creer que había datos).

**Limitación.** El almacén usa `fetch`, que Chromium bloquea en orígenes
`file://`. Con la app abierta por archivo la biblioteca muestra miniaturas
(`<img>`) pero falla al añadir assets; servida por HTTP (servidor local o
GitHub Pages) funciona íntegramente y sin red externa. La ejecución por HTTP
es el modo de distribución previsto.

**Alternativas.** Empaquetar los assets inline en el bundle JS (58 MB extra en
`gui.js`): descartado. Reproducir el par `/internalapi/asset/<md5>/get/`: no
aporta nada y complica el mapeo a archivos planos.

---
## D024 — 2026-11-13 — La mascota gana una cara (sonrisas kawaii)

**Contexto.** Los personajes de la marca tenían solo dos puntos como ojos, sin
boca. Se pidió una cara: ojos muy separados y una sonrisa entre ellos, un poco
más abajo, con sonrisas kawaii para las demás formas, una de ellas "uwu".

**Decisión.** Los rasgos son solo puntos y curvas finas de extremos
redondeados, sin relleno:

- **Disfraz 1 de la mascota** (sprite por defecto, `b19c8f26…svg`): ojos
  separados (x 42/78) y sonrisa entre ellos (`M 53,62 Q 60,69 67,62`).
- **Disfraz 2** (`3bb45ab9…svg`): cara "uwu" — ojos cerrados felices "u u" y
  boquita de gato "omega".
- **Logo del menú** (`spark-logo.svg` y variante Android): la misma cara a
  escala del logo.
- **Amigos** (`spark-friends.svg`): Blip y Tria con ojos de puntos y sonrisa;
  Quad (el cuadrado) con cara "uwu".
- **Marca** (`spark-mascot.svg`, `spark-mascot-mono.svg`): alineadas con el
  disfraz 1. La convención de marca "nunca boca ni nariz" cambia a "solo
  puntos y sonrisas kawaii; nunca nariz ni otros rasgos" (`context/marca.md`,
  `spark/brand/README.md`).

Al editar los SVG cambia su md5, así que los dos disfraces del proyecto por
defecto se renombraron a su nuevo md5 y se actualizaron las referencias en
`default-project/index.ts` y `default-project/project-data.ts`. El favicon
(`favicon.ico`, binario monocromo) queda como estaba: regenerarlo sigue
pendiente en el README de marca.

---
## D025 — 2026-11-13 — Los personajes de Spark entran en la biblioteca de actores

**Contexto.** Tras D024 la mascota y sus amigos existían solo como recursos de
marca y como sprite por defecto; no aparecían en el buscador de la biblioteca
de actores.

**Decisión.** Se añadieron 4 entradas a `sprites.json` (Blip, Quad, Spark con
2 disfraces —"Spark-a" y "Spark-uwu"— y Tria), orden alfabético, etiquetas
`fantasy` y `drawing`, sonido Pop genérico de la biblioteca y centro de
rotación 60/63. Los 5 assets (2 disfraces + 3 amigos) viven en
`static/library-assets/` como los demás, pero no vienen del CDN de Scratch:
`scripts/fetch-library-assets.js` los copia desde los SVG fuente rastreados en
el repo (`spark/brand/spark-{blip,quad,tria}.svg` y los disfraces de
`src/lib/default-project/`), nombrándolos con el md5 de su contenido. Los
SVG fuente de los amigos son la referencia canónica; la biblioteca se
regenera con `npm run fetch-library-assets`. No se eliminaron los personajes
de Scratch (Cat, Gobo, etc.) de la biblioteca.

---
## D026 — 2026-11-14 — Fase 6: autoguardado, instantáneas y "Continuar donde lo dejaste"

**Contexto.** La Fase 6 del plan pide persistencia local completa. Gran parte
ya existía tras el rediseño sin servidor: `LocalProjectStore` (IndexedDB
`spark-projects`), autoguardado con temporizador de 600 s, guardado y carga
de `.sb3`, y aviso `beforeunload`.

**Decisión.** Se completaron los puntos que faltaban:

- **Autoguardado con debounce de 2 s** (`autoSaveIntervalSecs` de 600 a 2) y
  guardado inmediato al ocultar la pestaña (`visibilitychange`). Con el
  debounce corto, `storeProject` solo reescribe los assets con cambios
  (`!asset.clean`); el `assetId` es el md5 del contenido, así que el mismo
  id implica el mismo contenido ya almacenado.
- **Instantáneas rotatorias**: `LocalProjectStore.saveSnapshot` guarda la
  última copia del JSON del proyecto en un almacén `snapshots` (versión 2 de
  la base de datos), conservando 3 por proyecto y descartando las más
  viejas. Cada guardado local guarda una instantánea; no bloquea el
  guardado. `remove` limpia las instantáneas del proyecto borrado.
- **"Continuar donde lo dejaste"**: `spark.lastProjectId` en localStorage
  recuerda el último proyecto guardado; al arrancar el editor con el
  proyecto por defecto, si no hay hash, no hay cambios sin guardar y el
  proyecto existe en el almacén, un modal ofrece Continuar (carga por id
  vía `setProjectId`) o Proyecto nuevo. Se comprueba una sola vez por
  montaje.
- **`navigator.storage.persist()`**: se solicita tras el primer guardado
  local. Si el navegador no la concede (o no existe), se muestra una vez
  (clave `spark.persistReminderShown` en localStorage) el aviso discreto
  `persistReminder` que recomienda exportar con frecuencia.
- **Cuota agotada**: si el guardado falla por cuota de IndexedDB
  (`QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, `err.code === 22`),
  se muestra `storageQuotaError` (con botón de descarga) en lugar del
  `savingError` genérico; reintentar no ayudaría.
- **Archivo demasiado grande**: los `.sb3` de más de 500 MB se rechazan
  antes de leerlos a memoria, con aviso `spark.projectLoader.fileTooLarge`.
  Un fallo de lectura del `FileReader` ahora cancela la carga y avisa
  (antes el editor se quedaba colgado).
- **File System Access API**: en Chromium, "Guardar en tu ordenador" usa
  `showSaveFilePicker` la primera vez y después sobrescribe el mismo
  archivo si el permiso sigue vigente (`lib/file-save.js`); el resto de
  navegadores y cualquier error usan la descarga clásica. Cancelar el
  selector no descarga nada. El handle se recuerda solo durante la sesión.

**Alternativas.**
- Instantáneas solo en guardados manuales: descartado; el autoguardado es
  el único guardado habitual y la copia de seguridad debe cubrirlo.
- Pedir el permiso del handle recordado con `requestPermission`: se
  descartó porque puede lanzarse sin activación de usuario válida dentro
  de la promesa; se prefiere `queryPermission` y degradar a descarga.
- Guardar el handle en IndexedDB para recordarlo entre sesiones: aplazado;
  el manejador de permisos al reabrirlo complica el flujo por poco beneficio.

---
