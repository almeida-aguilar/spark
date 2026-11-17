# INVENTORY — Inventario de recursos externos, extensiones y marca

Inventario de la Fase 0 del plan Spark. Base: monorepo
`scratchfoundation/scratch-editor`, rama `develop`, commit `73ea5b0`, versión
15.3.0. Actualizar cuando cambie el código.

---

## 1. URLs externas del código

Solo código fuente (`packages/*/src`, `packages/*/test`); excluye
`node_modules`, `dist`, builds, READMEs y cabeceras de licencia.

### 1.1 Dominios de Scratch — producción

| Referencia | Paquete | Archivo | Uso |
|---|---|---|---|
| `https://assets.scratch.mit.edu` (default) | scratch-gui | `src/lib/project-fetcher-hoc.jsx:149` | Host de assets por defecto del fetcher de proyectos |
| `https://projects.scratch.mit.edu` (default) | scratch-gui | `src/lib/project-fetcher-hoc.jsx:150` | Host de proyectos por defecto |
| `cdn.assets.scratch.mit.edu/internalapi/asset/{md5}.{fmt}/get/` | scratch-gui | `src/lib/legacy-library-asset-url.ts:2` | Resolver assets de bibliotecas legacy |
| `https://scratch.mit.edu` redirect | scratch-gui | `src/playground/render-gui.jsx:12`, `render-gui-standalone.jsx:8` | Redirección del playground |
| `https://scratch.mit.edu/projects/embed/...` | scratch-gui | `src/playground/compatibility-testing.jsx:45` | iframe de test de compatibilidad |
| `https://scratch.mit.edu` (link) | scratch-gui | `src/components/stage-header/stage-header.jsx:214` | Enlace visible en la UI |
| `//scratch.mit.edu/3faq` | scratch-gui | `src/components/webgl-modal/webgl-modal.jsx:90`, `browser-modal.jsx:88` | Enlaces de ayuda de modales |
| `https://scratch.mit.edu/privacy_policy/` | scratch-gui | `src/components/telemetry-modal/telemetry-modal.jsx:154` | Enlace de política de privacidad |
| `https://scratch.mit.edu/info/faq/#clouddata` | scratch-gui | `src/lib/alerts/index.jsx:193` | FAQ de variables en la nube |
| `helpLink: /microbit, /vernier, /ev3, /boost, /wedo` | scratch-gui | `src/lib/libraries/extensions/index.jsx:234,278,322,368,414` | Enlaces de ayuda de extensiones |
| `https://scratch.mit.edu/projects/1210061611` | scratch-gui | `src/lib/libraries/decks/index.jsx:1664` | Proyecto externo en tutorial (Face Sensing) |
| `https://scratchfoundation.org/...` | scratch-gui | `src/lib/libraries/decks/index.jsx:1675` | Link de Face Sensing en biblioteca |
| `['scratch.mit.edu', 'scratch.org']` | scratch-vm | `src/engine/runtime.js:1649,1673` | Detección de host de producción y colas de `scratchFetch` para servicios de extensiones |
| `https://synthesis-service.scratch.mit.edu` | scratch-vm | `src/extensions/scratch3_text2speech/index.js:30,719` | Servicio de texto a voz (servidor) |
| `https://translate-service.scratch.mit.edu/` | scratch-vm | `src/extensions/scratch3_translate/index.js:27` | Servicio de traducción (servidor) |
| `wss://speech.scratch.mit.edu` | scratch-vm | `src/extensions/scratch3_speech2text/index.js:29,510` | WebSocket de reconocimiento de voz |
| `wss://device-manager.scratch.mit.edu:20110` | scratch-vm | `src/util/scratch-link-websocket.js:59` | Fallback remoto de Scratch Link |
| `ws://127.0.0.1:20111` | scratch-vm | `src/util/scratch-link-websocket.js:58` | Scratch Link local (WebSocket) |
| `cdn.projects.scratch.mit.edu` | scratch-vm | `src/playground/benchmark.js:57`, `test/fixtures/make-test-storage.js:4` | Playground/benchmark y fixture de test |
| `cdn.assets.scratch.mit.edu` | scratch-render | `src/playground/playground.js:36,48` | Playground del renderer |
| `cdn.assets.scratch.mit.edu` | scratch-vm | `src/playground/benchmark.js:56` | Benchmark |

### 1.2 Otros orígenes cargados en runtime (no de Scratch)

| Referencia | Paquete | Archivo | Uso |
|---|---|---|---|
| `fast.wistia.com/embed/medias/*.jsonp` + `assets/external/E-v1.js` | scratch-gui | `src/components/cards/cards.jsx:144,150` | Reproductor de vídeo de los tutoriales |
| `https://code.org/api/hour/begin_scratch_*.png` | scratch-gui | `src/lib/libraries/decks/index.jsx:456,1422` | Píxeles de tracking de Hour of Code |
| `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@…` | scratch-vm | `src/extensions/scratch3_face_sensing/index.js:105` | Fallback CDN del modelo MediaPipe (el primario es local) |
| `https://get.webgl.org` | scratch-gui | `src/components/webgl-modal/webgl-modal.jsx:51` | Enlace de ayuda |
| `https://microbit.org/...` | scratch-gui | `src/components/connection-modal/update-peripheral-step.jsx:26` | Guía de firmware micro:bit |

### 1.3 Uso directo de red en runtime

| API | Paquete | Archivo | Descripción |
|---|---|---|---|
| `fetch(resource, …)` | scratch-storage | `src/scratchFetch.ts:112` | Canal base de todo el runtime (con colas por hostname) |
| `fetch(bodyUrl)` | scratch-gui | `src/containers/blocks.jsx:663` | Descarga del JSON de bloques arrastrados |
| `fetch(hexUrl)` | scratch-gui | `src/lib/microbit-update.js:78` | Descarga del firmware micro:bit (URL de asset local, ver 1.4) |
| `new WebSocket(cloudHost)` | scratch-gui | `src/lib/cloud-provider.ts:84` | Variables en la nube (host inyectado por props) |
| WebSockets de Scratch Link | scratch-vm | `src/util/scratch-link-websocket.js:58-59` | Local y fallback remoto |
| `new XMLHttpRequest()` | scratch-render | `src/playground/playground.js:39` | Solo playground de desarrollo |

### 1.4 Red en build-time (no runtime)

| Referencia | Archivo | Descripción |
|---|---|---|
| `https://downloads.scratch.mit.edu/microbit/scratch-microbit.hex.zip` | `packages/scratch-gui/scripts/prepare.mjs:79-85` | Descarga del firmware en el build; el resultado se empaqueta localmente en `static/microbit/` |

### 1.5 Tests con red real o mockeada (informativo)

- `packages/scratch-gui/test/integration/connection-modal.test.js:23` — `wss://fake.fake` (error de UI)
- `packages/scratch-gui/test/integration/examples.test.js:40,42,71,73` — afirma requests a `projects.scratch.mit.edu` (mockeada)
- `packages/scratch-gui/test/helpers/selenium-helper.js:228` — SauceLabs (infra de test)
- `packages/scratch-svg-renderer/test/*` — `example.com`, `evil.com` (mocks)
- `packages/scratch-storage/test/*` — `example.com` (mocks)
- `packages/scratch-vm/test/fixtures/make-test-storage.js:3-4` — apunta a `cdn.*.scratch.mit.edu` (fixture, potencial red real)

---

## 2. Extensiones

### 2.1 Dónde se registran

- **Registro central:** `packages/scratch-vm/src/extension-support/extension-manager.js`,
  objeto `builtinExtensions` (líneas 11–28). Añadir/quitar una extensión
  integrada = añadir/quitar una clave `id: () => require('../extensions/scratch3_<id>')`.
- Un ID no presente en el mapa cae al camino de Web Worker
  (`loadExtensionURL`, líneas 142–165) y falla la carga del proyecto (ver
  `SPARK_DECISIONS.md` D004).
- `CORE_EXTENSIONS` en `packages/scratch-vm/src/serialization/sb3.js:45-58`
  (y en `virtual-machine.js:29-39`, vacío) es la lista de "extensiones" del
  núcleo (control, looks, motion…) que no se registran como extensiones.

### 2.2 Extensiones integradas (13 entradas)

| ID (`builtinExtensions`) | Directorio | Destino en Spark |
|---|---|---|
| `pen` | `scratch3_pen` | **Conservar** |
| `wedo2` | `scratch3_wedo2` | **Conservar** (foco del producto) |
| `music` | `scratch3_music` | **Conservar** |
| `videoSensing` | `scratch3_video_sensing` | **Conservar** |
| `microbit` | `scratch3_microbit` | Eliminar (Fase 2) |
| `text2speech` | `scratch3_text2speech` | Eliminar (servidor TTS) |
| `translate` | `scratch3_translate` | Eliminar (servidor de traducción) |
| `ev3` | `scratch3_ev3` | Eliminar (Fase 2) |
| `makeymakey` | `scratch3_makeymakey` | Eliminar (Fase 2) |
| `boost` | `scratch3_boost` | Eliminar (Fase 2) |
| `gdxfor` | `scratch3_gdx_for` | Eliminar (Fase 2) |
| `faceSensing` | `scratch3_face_sensing` | Eliminar (Fase 2) |
| `coreExample` | `src/blocks/scratch3_core_example` | Decide en Fase 2 (no es extensión de usuario) |

### 2.3 Biblioteca de extensiones de la GUI

Índice: `packages/scratch-gui/src/lib/libraries/extensions/index.jsx`
(export default línea 52; entradas: music 53–72, pen 73–92, videoSensing
93–112, faceSensing 113–132, text2speech 133–154, translate 155–176,
makeymakey 177–191, microbit 192–235, gdxfor 236–279, ev3 280–323, boost
324–369, wedo2 370–415).

Assets a eliminar junto con sus entradas (Fase 2):

- `makeymakey/makeymakey.png`, `makeymakey/makeymakey-small.svg`
- `microbit/microbit.png`, `microbit-small.svg`, `microbit-illustration.svg`
- `ev3/ev3.png`, `ev3-small.svg`, `ev3-hub-illustration.svg`
- `boost/boost.png`, `boost-small.svg`, `boost-illustration.svg`, `boost-button-illustration.svg`
- `gdxfor/gdxfor.png`, `gdxfor-small.svg`, `gdxfor-illustration.svg`
- `text2speech/text2speech.png`, `text2speech-small.svg`
- `translate/translate.png`, `translate-small.png`
- `faceSensing/faceSensing.png`, `faceSensing-small.svg`

Directorio: `packages/scratch-gui/src/lib/libraries/extensions/<id>/`.

Iconos de alto contraste (`packages/scratch-gui/src/lib/settings/color-mode/high-contrast/extensions/`):
`faceSensingIcon.svg`, `musicIcon.svg`, `penIcon.svg`, `text2speechIcon.svg`,
`translateIcon.svg`, `videoSensingIcon.svg` — eliminar `faceSensing`,
`text2speech` y `translate`.

---

## 3. Dependencias fuera del monorepo (paquetes Scratch publicados en npm)

Todas las deps `@scratch/…` presentes en `packages/*` resuelven dentro del
monorepo, salvo las de esta lista (publicadas por separado):

| Paquete npm | Versión | Consumido por | Repo | Licencia |
|---|---|---|---|---|
| `scratch-audio` | 2.0.275 | gui, vm | `scratchfoundation/scratch-audio` | AGPL-3.0-only |
| `scratch-blocks` | 2.2.6 | gui (dep), vm (dev) | `scratchfoundation/scratch-blocks` | Apache-2.0 |
| `scratch-l10n` | 6.2.4 | gui (dep); paint, vm (dev) | `scratchfoundation/scratch-l10n` | AGPL-3.0-only |
| `scratch-render-fonts` | 1.0.258 | gui; render, svg-renderer (peer); paint, vm (dev) | `scratchfoundation/scratch-render-fonts` | (sin `license` en package.json; repo con `LICENSE.txt` Apache-2.0 y `OFL.txt` para las fuentes) |
| `scratch-webpack-configuration` | 3.1.3 | dev en casi todos | `scratchfoundation/scratch-webpack-configuration` | BSD-3-Clause |
| `scratch-parser` | 6.0.1 | vm | `scratchfoundation/scratch-parser` | AGPL-3.0-only |
| `scratch-sb1-converter` | 2.0.284 | vm | `scratchfoundation/scratch-sb1-converter` | AGPL-3.0-only |
| `scratch-translate-extension-languages` | 1.0.7 | vm | `scratchfoundation/scratch-translate-extension-languages` | BSD-3-Clause |
| `@scratch/paper` | 0.11.20221201200345 | paint | fork de `paperjs/paper.js` bajo scope `@scratch` | MIT |

Nota: `scratch-translate-extension-languages` deja de usarse al eliminar la
extensión Traductor (Fase 2). `scratch-sb1-converter` solo sirve para cargar
`.sb1` heredados: pendiente decidir si se conserva (decisión de Fase 2/4).

---

## 4. Archivos de marca de Scratch

### 4.1 Logos e iconos

| Archivo | Uso |
|---|---|
| `packages/scratch-gui/src/components/menu-bar/scratch-logo.svg` | Logo principal (menú, importado en `menu-bar.jsx:67` y `stage-header.jsx:18`) |
| `packages/scratch-gui/src/components/menu-bar/scratch-logo-android.svg` | Variante Android (`menu-bar.jsx:68`) |
| `packages/scratch-gui/src/components/menu-bar/cat_logo.svg`, `nineties_logo.svg`, `prehistoric-logo.svg`, `oldtimey-logo.svg`, `cat-ears.svg` | Variantes easter-egg / avatar |
| `packages/scratch-gui/static/favicon.ico` | Favicon (`src/playground/index.ejs:17`) |

El manifiesto PWA (`static/manifest.webmanifest`), los iconos 192/512 y el
`apple-touch-icon` se añadieron en la Fase 8.

### 4.2 Pantalla de carga

Sin imágenes de marca: solo SVGs de bloques animados
(`packages/scratch-gui/src/components/loader/top-block.svg`, `middle-block.svg`,
`bottom-block.svg`) y un spinner genérico.

### 4.3 Sprite por defecto (el gato)

El proyecto por defecto vive en la GUI:

- `packages/scratch-gui/src/lib/default-project/index.ts` — ensamblado
- Assets por md5 (cada uno con su import en `index.ts:5-9`):
  - `bcf454acf82e4504149f7ffe07081dbc.svg` — disfraz 1 del gato
  - `0fb9be3e8397c983338cb71dc84d0b25.svg` — disfraz 2 del gato
  - `cd21514d0531fdffb22204e0ec5ed84a.svg` — fondo Backdrop1
  - `83c36d806dc92327b9e7049a565c6bff.wav` — sonido "Meow"
  - `83a9787d4cb6f3b7632b4ddfebf74367.wav` — sonido "Pop"
- JSON: `packages/scratch-gui/src/lib/default-project/project-data.ts`
- Registrado en el storage builtin vía `packages/scratch-gui/src/lib/legacy-storage.ts:103-104`
- Referencias cruzadas al gato: `packages/scratch-gui/src/lib/empty-assets.js`
  (mismos md5), `packages/scratch-gui/src/lib/libraries/sprites.json:3728`
  (entrada "Cat"), `packages/scratch-gui/src/lib/default-project/messages.js`

### 4.4 Política de marca

`TRADEMARK` (raíz del monorepo): las marcas de Scratch —nombre, logo, el gato,
Gobo, Pico, Nano, Tera y Giga— son propiedad de la Scratch Foundation y no
pueden usarse para respaldar o promocionar productos derivados sin permiso
escrito previo. Consecuencia: Spark debe eliminar todo ese arte como identidad
(los personajes propios de Spark están definidos en `context/marca.md` y la
decisión D005).

---

## 5. Resultado de la línea base (Fase 0)

- Instalación: `npm ci` OK (2977 paquetes, Node v26.13.0, npm 12.2.1).
- Scripts de instalación aprobados: `esbuild@0.28.2`, `unrs-resolver@1.12.2`,
  `canvas@3.2.3`, `playwright-chromium@1.65.0`, `core-js`,
  `@parcel/watcher@2.6.0` (ver D003).
- Build de producción de todos los paquetes: ver sección 5.1.
- Tests: ver sección 5.2.

### 5.1 Build

- **Fecha:** 2026-11-11. Comando: `npm run build` (producción, todos los
  workspaces). **Resultado: OK** (exit 0).
- Artefactos generados: `packages/scratch-vm/dist/{web,node}`,
  `packages/scratch-gui/dist/` (incluye `scratch-gui-standalone.js`,
  `extension-worker.js`, `chunks/mediapipe/…`), `packages/scratch-render/dist`,
  `packages/scratch-storage/dist`, `packages/scratch-media-lib-scripts/media/`.
- Warnings (no bloqueantes, de tamaño de bundle): `scratch-gui-standalone.js`
  16.5 MiB (contiene `src/reducers/locales.js`, 4.9 MiB, y la extensión Face
  Sensing con TensorFlow, 4.7 MiB), `chunks/mediapipe` ~12 MiB de modelos
  `.tflite`/`.wasm`, logos GIF grandes de tutoriales. Nota para fases
  posteriores: al eliminar Face Sensing (Fase 2) y externalizar idiomas
  (Fase 7) el bundle inicial bajará drásticamente.

### 5.2 Tests

- **Fecha:** 2026-11-11. Ejecución por workspace con paralelismo mínimo
  (`tap --jobs=1`, `jest --runInBand`, `playwright --workers=1`) para no
  saturar la CPU. Logs en `/tmp/opencode/test-logs/` (no versionados).

| Paquete | Resultado | Notas |
|---|---|---|
| task-herder | PASS | Vitest |
| scratch-storage | PASS | |
| scratch-svg-renderer | PASS | |
| scratch-paint | PASS | |
| scratch-render | PASS | `tap test/unit test/integration` |
| scratch-vm | PASS | `npm run tap -- --jobs=1` (unit + integration) |
| scratch-gui lint | PASS | `npm run test:lint` (vía `npm test` primera pasada) |
| scratch-gui unit | PASS | 52 suites, 336 tests (`jest --runInBand test/unit`) |
| scratch-gui integration | PASS | 17 suites, **125 tests** (`jest --runInBand test/integration`), 8 skipped por dependencia de red |
| scratch-gui playwright | PASS (Chromium) / FAIL entorno (Firefox) | Chromium 4/4. Firefox: binario no instalado (`npx playwright install firefox` lo resolvería); fuera del alcance de Spark, que solo soporta Chromium |
| scratch-media-lib-scripts | PASS | 20/20 |

- **Comparación con el upstream**: se mantiene un worktree con el upstream
  intacto (`/tmp/opencode/upstream-baseline`, `73ea5b0`) para distinguir
  regresiones de fallos del entorno. Línea base del upstream: 127 tests
  integrados y 0 fallos; línea base de Spark tras la fase 2: 125 tests y
  0 fallos (8 skipped, uno más que upstream por el test de red marcado como
  `skip`).


- Incidencias registradas (resueltas):
  1. Una segunda ejecución de `npm run build` iniciada por error y cancelada a
     mitad dejó `packages/scratch-storage/dist` vacío; reconstruido.
  2. El bin hoisted `node_modules/.bin/playwright` pertenece a
     `playwright-chromium` (dep de scratch-render) y no tiene el comando
     `test`, sombra del bin de `@playwright/test` (ver D006). El bin
     correcto se invoca por ruta: `node ../../node_modules/@playwright/test/cli.js`.
  3. Fallo inicial de render/vm/gui en la primera pasada = causa 1 (no fallo
     real del código).
  4. Import por defecto cambiado a import con nombre en
     `render-gui-standalone.jsx`: el editor standalone no arrancaba (ver D013).
     Detectado comparando con el upstream intacto (D014).

- **Tests dependientes de la red** (quedan como *flaky* hasta que las fases 4
  y 5 los eliminen):
  - `sounds.test.js` → "Adding a sound through the library": el sonido de la
    biblioteca se descarga de `cdn.assets.scratch.mit.edu`. Pasa en solitario y
    falla por timeout cuando la máquina está cargada. La fase 5 sirve la
    biblioteca en local.
  - `project-loading.test.js` → "Nonexistent projects show error screen":
    requiere el servidor de proyectos de Scratch. Marcado como `test.skip`,
    como upstream ya hace con sus otros tests de red; la fase 4 elimina el
    cargador de proyectos por ID.


---

### 5.3 Arranque del editor

- 2026-11-11: `webpack serve` (dev, puerto de prueba) responde HTTP 200 en
  ~5 s con el playground de scratch-gui (título "Scratch 3.0 GUI").
  Criterio de arranque de la Fase 0 cumplido.
- 2026-11-11 (fase 1): tras el rebranding, el título pasa a "Spark" y el
  playground ya no redirige a `scratch.mit.edu`.

---

## 6. Assets de marca de Spark (nuevos, Fase 0/1 prep)

Creados en `spark/brand/` según `context/marca.md` (ver `spark/brand/README.md`):

- `spark-mascot.svg` — Spark, estrella de 6 lados redondeada, dos ojos de puntos
- `spark-mascot-mono.svg` — variante monocroma (`currentColor`)
- `spark-friends.svg` — Blip (círculo), Quad (cuadrado), Tria (triángulo)

---

## 7. Fase 1 — Rebranding (estado)


Cambios aplicados en `packages/scratch-gui`:

| Elemento | Antes | Ahora |
|---|---|---|
| Logo del menú y del stage | `scratch-logo.svg` (Scratch) | `spark-logo.svg` (mascota + wordmark) |
| Favicon | `static/favicon.ico` (Scratch) | regenerado desde la mascota (16/32/48 px) |
| Títulos HTML | "Scratch 3.0 GUI…" | "Spark…" (`webpack.config.js`) |
| Proyecto por defecto | gato (2 disfraces) + fondo + "Meow" | mascota Spark (2 disfraces) + fondo neutro + "Bip" (audio propio) |
| Diálogo Acerca de | inexistente | `src/components/spark-about/` (créditos, descargo, licencia, enlace al código) |
| Telemetría | modal montado en el playground | no se monta (el componente se elimina en la fase 4) |
| Redirección del logo | a `scratch.mit.edu` | ninguna |
| Enlaces de ayuda | FAQ de Scratch, política de privacidad, cloud data FAQ | eliminados |
| Ids de las cadenas de marca | ids de Scratch (traducidos por `scratch-l10n`) | ids propios `spark.*` (en inglés hasta la fase 7) |

Pendiente:

- **URL pública del repositorio de Spark** (necesaria para el enlace al código
  fuente que exige la AGPL): está en
  `packages/scratch-gui/src/lib/spark-config.js` (`SPARK_SOURCE_URL`), a la
  espera de confirmación.
- `README.md` en español e inglés: fase 10.
- Componente `telemetry-modal.jsx`: se elimina en la fase 4.
- Flujo de conexión de WeDo (texto de Scratch Link): fase 3.
- Biblioteca multimedia (entradas "Cat" en `sprites.json`, `costumes.json`,
  `sounds.json`): fase 5.

---

## 8. Fase 2 — Poda de extensiones (estado)

### 8.1 Extensiones eliminadas

| Extensión | VM (`builtinExtensions`) | GUI (biblioteca) | Assets eliminados |
|---|---|---|---|
| Makey Makey | fuera | fuera | `extensions/makeymakey/*` |
| micro:bit | fuera | fuera | `extensions/microbit/*`, `lib/microbit-update.js`, firmware (`static/microbit`, `src/generated/microbit-hex-url.cjs`) y su descarga en `scripts/prepare.mjs` |
| Go Direct Force & Acceleration | fuera | fuera | `extensions/gdxfor/*` |
| LEGO MINDSTORMS EV3 | fuera | fuera | `extensions/ev3/*` |
| LEGO BOOST | fuera | fuera | `extensions/boost/*` |
| Texto a voz | fuera | fuera | `extensions/text2speech/*`, `extensions/speech2text/*`, test unitario de la extensión |
| Traductor | fuera | fuera | `extensions/translate/*` |
| Detección de caras | fuera | fuera | `extensions/faceSensing/*` y el modelo MediaPipe del bundle |

Se conservan: **Lápiz, WeDo 2.0, Música y Detección de vídeo** (más el ejemplo
`coreExample` en la VM, que no aparece en el menú).

### 8.2 Carga de proyectos con extensiones no soportadas

- Los bloques de esas extensiones **no se crean** (ni los que dependen de
  ellos): el proyecto carga con normalidad.
- La VM registra los IDs afectados en `runtime.unsupportedExtensions`.
- La GUI muestra el aviso `unsupportedExtensions` con los nombres legibles
  (`src/lib/unsupported-extensions.js`) al cargar un archivo de proyecto.
- Tests: `packages/scratch-vm/test/integration/unsupported_extension.js` (con el
  fixture `unsupported_extension.sb3`), test del reducer de avisos y test de los
  nombres.

### 8.3 Pendiente de la fase 2

- **Variables en la nube**: el soporte sigue en el código (bloques,
  `cloud-manager-hoc`, `cloud-provider`); se elimina en la fase 4.
- Tutoriales (decks) de vídeo (Wistia): fase 4.
- Resto de dependencias de red: fase 4.

---

## 9. Fase 3 — Puente Web Bluetooth (estado)

### 9.1 Sustitución del transporte

| Antes (Scratch Link) | Ahora (Web Bluetooth) |
|---|---|
| `packages/scratch-vm/src/io/ble.js` (JSON-RPC) | `packages/scratch-vm/src/io/web-bluetooth-session.js` |
| `packages/scratch-vm/src/io/bt.js` | eliminado |
| `packages/scratch-vm/src/util/scratch-link-websocket.js` | eliminado |
| `runtime.getScratchLinkSocket()` / `configureScratchLinkSocketFactory()` | eliminados |
| `runtime._initScratchLink()` (inyecta la extensión de navegador) | eliminado |
| `vm.configureScratchLinkSocketFactory()` | eliminado |
| `ws://127.0.0.1:20111` y `wss://device-manager.scratch.mit.edu` | `navigator.bluetooth` |

La interfaz pública de la sesión, los eventos del runtime y la convención
base64 se mantienen, para que la extensión WeDo 2.0 no cambie su lógica.

### 9.2 Servicios GATT del hub WeDo 2.0

| Servicio | UUID | Características |
|---|---|---|
| Dispositivo | `00001523-1212-efde-1523-785feabcd123` | `00001527-…` (IO conectado), `00001528-…` (batería) |
| Entrada/salida | `00004f0e-1212-efde-1523-785feabcd123` | `00001560-…` (valores), `00001563-…` (comandos de entrada), `00001565-…` (comandos de salida) |

Ambos servicios se piden en `optionalServices` (obligatorio para que el
navegador dé acceso a ellos).

### 9.3 Flujo de usuario

1. El usuario abre el modal de la extensión WeDo 2.0.
2. Si el navegador no soporta Web Bluetooth, el modal muestra directamente el
   aviso con los navegadores compatibles (Chrome, Edge o Chromium en Android);
   el editor sigue siendo usable sin hardware.
3. Con soporte, el botón "Start Searching" (un clic = gesto del usuario)
   dispara `navigator.bluetooth.requestDevice`, que abre el selector del
   navegador.
4. Al elegir el hub, se emiten `PERIPHERAL_LIST_UPDATE` y
   `USER_PICKED_PERIPHERAL` con un único dispositivo y la interfaz conecta.
5. Si la conexión se pierde, el modal ofrece "Reconnect".

### 9.4 Tests

- `packages/scratch-vm/test/unit/web-bluetooth-session.js`: 10 tests con un
  mock completo de `navigator.bluetooth` (dispositivo, servidor GATT,
  servicios, características): codificación base64, cola de operaciones,
  eventos de conexión y desconexión, reconexión y ausencia de soporte.

### 9.5 Pendiente de la fase 3

- Verificación con un hub real (sección 5 del plan): Chrome en Windows,
  macOS, ChromeOS y Android; comprobar motores, LED, sensor de distancia y de
  inclinación; y el comportamiento en Safari, iOS y Firefox.

---

---

## 7. Estado tras la Fase 4 (2026-11-12)

Red, cuentas y backend eliminados del editor. Resumen del estado real:

**Interfaz (scratch-gui).** Menú: Settings, File (New, Save now, Load from
your computer, Save to your computer), Edit, Debug, About Spark. Sin Compartir,
Remix, Comunidad, mochila, tutoriales (Wistia), tarjetas, menú de usuario ni
telemetría. El guardado local (`canSave`, `canCreateNew`, `canEditTitle`) está
siempre disponible; los defaults viven en `components/gui/gui.jsx` y en
`project-saver-hoc.jsx`.

**Persistencia.** Proyectos en IndexedDB `spark-projects` (id, título, datos,
fecha; ids `local-...`) y assets en IndexedDB `spark-assets`; ver D021.
El ciclo guardar → recargar por hash (`#local-...`) → editar → guardar
funciona sin red y restaura el título.

**CSP.** `index.ejs` con `default-src 'self'`, `connect-src 'self'`,
`form-action 'none'`. Verificado con Playwright: la app cargada desde
`file://` hace **cero** peticiones externas.

**URL del repositorio.** `SPARK_SOURCE_URL` definida
(`https://almeida-aguilar.github.io/spark/fundation/`) y enlazada en el
diálogo "About Spark" (D022).

**Módulos eliminados** (ver D020 para la lista completa): cloud provider y
manager, backpack, decks/cards/tips-library, telemetry-modal,
save-project-to-server, legacy-backpack-storage. Tests obsoletos eliminados
(cards, cloud-provider, cloud-manager-hoc, code-payload, translate-video,
tutorial-from-url, hash-project-loader-hoc).

**Tests tras la Fase 4** (`npx jest --runInBand test/unit/`, paquete
scratch-gui): 46 suites, 291 passed, 1 skipped, 0 failed. Incluye las 4 pruebas
de `LocalProjectStore` y las de menú actualizadas al diálogo "About Spark".

**Pendiente para fases posteriores:** la biblioteca de assets multimedia
(disfraces/sonidos/fondos) aún se sirve desde la ruta `internalapi/asset/...`
local sin contenido empaquetado (Fase 5); localización propia (Fase 7).

---

## 8. Estado tras la Fase 5 (2026-11-13)

La biblioteca multimedia (disfraces, fondos, sonidos y actores) funciona sin
red externa:

- **Origen.** `src/lib/libraries/*.json` (915 disfraces, 85 fondos, 354
  sonidos, 347 actores) referencia 1352 assets únicos (~58 MB). Se descargan
  del CDN de Scratch una sola vez con
  `npm run fetch-library-assets` (scratch-gui) a `static/library-assets/`
  (carpeta en `.gitignore`; ver `docs/MEDIA_LICENSES.md` para la atribución,
  CC BY-SA 2.0, Scratch Foundation). Los 5 assets de los personajes de la
  marca (2 disfraces de Spark + Blip, Quad, Tria) no vienen del CDN: el
  script los copia desde los SVG de `spark/brand/` y
  `src/lib/default-project/` (ver D024 y D025).
- **Servido.** Copiado al build con el patrón `static → static` existente y
  resuelto por un almacén web de `legacy-storage.ts` para
  `[ImageVector, ImageBitmap, Sound]` con URL absoluta. Se eliminó el almacén
  muerto `static/extension-assets/scratch3_music/` (los sonidos de Music van
  inline en el bundle del VM).
- **Verificado (HTTP local, Playwright).** Las cuatro bibliotecas abren con
  miniaturas cargadas (0 rotas), se añaden disfraz, sonido, fondo y actor y
  todos se renderizan y reproducen. Cero peticiones fuera del servidor local.
- **Limitación.** Con origen `file://` Chromium bloquea `fetch`: la biblioteca
  muestra miniaturas pero no puede añadir assets. El modo de distribución es
  HTTP (servidor local o GitHub Pages), donde funciona íntegramente.

La extensión Music mantiene sus instrumentos y percusión empaquetados inline
en `packages/scratch-vm` (manifest con `require('./assets/*.mp3')`); no usan
la biblioteca ni red.

---

## 9. Estado tras la Fase 9 (2026-11-17)

- **Biblioteca optimizada.** Los mismos 1352 archivos ocupan ahora 47.760.616
  bytes (45,55 MiB), 8,76 MiB menos que en la línea base. Se optimizan en el
  momento de descargarlos (`fetch-library-assets.js`) y antes de cada build;
  los nombres `<md5>.<ext>` y los formatos no cambian, por lo que los JSON y los
  `.sb3` siguen siendo válidos. Detalles en `docs/MEDIA_LICENSES.md`.
- **Artefacto PWA.** `npm run build:pwa` genera `packages/scratch-gui/build/`
  con una sola entrada, sin mapas de origen ni ejemplos de desarrollo. El
  directorio baja de 121 MiB a 76,72 MiB.
- **Service worker.** El app shell (incluido `gui.js`) se precachea; la
  biblioteca y los modelos de MediaPipe se cachean bajo demanda
  (`CacheFirst`). El precache baja de 80,3 MB a 17,87 MiB.
- **Presupuesto.** `npm run check:size` valida bundle inicial, precache,
  biblioteca y tamaño total contra `scripts/size-budget.json`. Línea base,
  límites y renuncia a gzip/Brotli en `docs/PWA_SIZE_BUDGET.md`.
