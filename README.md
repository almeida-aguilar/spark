# Spark

[English version below](#spark-english)

PWA gratuita y de código abierto, basada en un fork del editor de Scratch, centrada exclusivamente en LEGO WeDo 2.0.
Funciona 100 % en local: sin cuentas, sin backend, sin analítica. Los proyectos se guardan en el navegador y se
importan y exportan como archivos `.sb3`. La conexión con el hub usa la API Web Bluetooth del navegador en lugar de
Scratch Link.

> **Aviso de marcas:** Spark es un fork independiente, no afiliado ni respaldado por la Scratch Foundation ni por el
> Grupo LEGO. LEGO y WeDo son marcas de sus respectivos titulares. Este proyecto se distribuye bajo la licencia
> AGPL-3.0.

## Qué es Spark

- Editor visual para programar el hub LEGO WeDo 2.0 (extensión WeDo 2.0, Lápiz, Música y Detección de vídeo).
- Progressive Web App (PWA): instalable y utilizable sin conexión tras la primera carga.
- Datos locales: autoguardado en IndexedDB y archivos `.sb3` para importar/exportar.

## Navegadores compatibles (y limitación en iOS/Safari)

- **Compatibles (Web Bluetooth):** navegadores basados en Chromium — Google Chrome, Microsoft Edge y derivados — en
  escritorio y Android, en un contexto seguro (HTTPS o `localhost`).
- **Sin conexión al hardware:** Safari, iOS y Firefox no soportan Web Bluetooth. La aplicación se puede usar sin
  conectar el hub, pero al intentar conectar se muestra un aviso con los navegadores compatibles. iOS no permite la
  conexión Web Bluetooth aunque se use otro navegador.

## Instalación

Requisitos: Node.js según `.nvmrc` (incluye npm). Monorepo con npm workspaces.

Con [mise](https://mise.jdx.dev/) (recomendado) puedes instalar la versión de Node del proyecto:

```bash
mise trust
mise install
```

`mise.toml` fija la versión de Node para que `node` y `npm` estén disponibles en el proyecto. Si no usas mise, instala manualmente la versión indicada en `.nvmrc`.

1. Clona el repositorio:
   ```bash
   git clone https://github.com/almeida-aguilar/spark.git
   cd spark
   ```
2. Instala las dependencias:
   ```bash
   npm ci
   ```
3. Construye todos los paquetes:
   ```bash
   npm run build
   ```
   El artefacto de la PWA queda en `packages/scratch-gui/build/` (con `index.html`).
4. Sirve el directorio `build` con un servidor HTTP local (necesario para service worker/Web Bluetooth en contexto seguro
   distinto de `file://`), por ejemplo:
   ```bash
   npx serve packages/scratch-gui/build
   ```
   Para desarrollo del editor puedes usar `npm start` (equivale a `npm --workspace @scratch/scratch-gui start`).
5. Abre la URL en un navegador compatible. Para instalar como PWA, usa la opción de instalación del navegador.

## Compartir proyectos con archivos `.sb3`

- Los proyectos se guardan localmente en el navegador (IndexedDB) y pueden exportarse como archivos `.sb3`.
- Para compartir un proyecto, expórtalo como `.sb3` y envíalo por el medio que prefieras (correo, mensajería, USB,
  almacenamiento en la nube, etc.). Para abrirlo, impórtalo desde el editor.
- Un `.sb3` exportado por Spark debe poder abrirse en Scratch. Si un proyecto contiene bloques de extensiones no
  soportadas (por ejemplo micro:bit, EV3 o Texto a voz), el editor mostrará un aviso y cargará lo que pueda.

## Cómo contribuir

- Consulta [`CONTRIBUTING.md`](CONTRIBUTING.md) para el flujo de desarrollo (ramas, commits convencionales, pruebas y
  lint).
- Las decisiones arquitectónicas y los cambios de alcance se documentan en [`docs/SPARK_DECISIONS.md`](docs/SPARK_DECISIONS.md).
- La integración de cambios upstream de Scratch se describe en [`CONTRIBUTING.md`](CONTRIBUTING.md) (sección
  correspondiente).

## Licencia y descargos

- Licencia: **AGPL-3.0-only**. Consulta [`LICENSE`](LICENSE), [`NOTICE`](NOTICE) y
  [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).
- Biblioteca multimedia y atribuciones: [`docs/MEDIA_LICENSES.md`](docs/MEDIA_LICENSES.md).
- Documentación de arquitectura: [`docs/WEB_BLUETOOTH_BRIDGE.md`](docs/WEB_BLUETOOTH_BRIDGE.md) y
  [`docs/LOCAL_STORE_ARCHITECTURE.md`](docs/LOCAL_STORE_ARCHITECTURE.md).
- Spark se basa en el editor de Scratch (proyecto de código abierto). Los créditos y el enlace al código fuente son
  visibles en la interfaz ("Acerca de Spark").
- **Descargos:** Spark es un fork independiente, no afiliado ni respaldado por la Scratch Foundation ni por el Grupo
  LEGO. LEGO y WeDo son marcas de sus respectivos titulares.

---

## Spark (English)

Spark is a free, open-source Progressive Web App (PWA) based on a fork of the Scratch editor, focused exclusively on
LEGO WeDo 2.0. It runs 100% locally: no accounts, no backend, no analytics. Projects are saved in the browser and can
be imported and exported as `.sb3` files. The hub connects via the browser's Web Bluetooth API instead of Scratch Link.

> **Trademark notice:** Spark is an independent fork and is not affiliated with or endorsed by the Scratch Foundation
> or the LEGO Group. LEGO and WeDo are trademarks of their respective owners. This project is distributed under the
> AGPL-3.0 license.

## What Spark is

- A visual editor for programming the LEGO WeDo 2.0 hub (WeDo 2.0, Pen, Music and Video Sensing extensions).
- A Progressive Web App (PWA): installable and usable offline after the first load.
- Local data: autosave in IndexedDB and `.sb3` files for import/export.

## Supported browsers (including iOS/Safari limitation)

- **Supported (Web Bluetooth):** Chromium-based browsers — Google Chrome, Microsoft Edge and derivatives — on desktop
  and Android, in a secure context (HTTPS or `localhost`).
- **No hardware connection:** Safari, iOS and Firefox do not support Web Bluetooth. The app works without connecting a
  hub, but attempting to connect shows a clear message listing compatible browsers. iOS does not allow Web Bluetooth
  connections even when using another browser.

## Installation

Requirements: Node.js as specified in `.nvmrc` (includes npm). npm workspaces monorepo.

With [mise](https://mise.jdx.dev/) (recommended) you can install the project's Node version:

```bash
mise trust
mise install
```

`mise.toml` pins the Node version so `node` and `npm` are available for this project. If you don't use mise, install the version specified in `.nvmrc` manually.

1. Clone the repository:
   ```bash
   git clone https://github.com/almeida-aguilar/spark.git
   cd spark
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Build all packages:
   ```bash
   npm run build
   ```
   The PWA artifact is generated in `packages/scratch-gui/build/` (including `index.html`).
4. Serve the `build` directory with a local HTTP server (required for service workers / secure context features;
   `file://` is not suitable), for example:
   ```bash
   npx serve packages/scratch-gui/build
   ```
   For editor development you can use `npm start` (equivalent to `npm --workspace @scratch/scratch-gui start`).
5. Open the URL in a compatible browser. To install as a PWA, use the browser's install option.

## Sharing projects via `.sb3`

- Projects are saved locally in the browser (IndexedDB) and can be exported as `.sb3` files.
- To share a project, export it as `.sb3` and send it however you prefer (email, messaging, USB, cloud storage, etc.).
  To open it, import it from the editor.
- Any `.sb3` exported by Spark should open in Scratch. If a project contains blocks from unsupported extensions (for
  example micro:bit, EV3 or Text to Speech), the editor will show a warning and load what it can.

## Contributing

- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow (branches, Conventional Commits, tests and
  lint).
- Architectural decisions and scope changes are documented in [`docs/SPARK_DECISIONS.md`](docs/SPARK_DECISIONS.md).
- How to integrate upstream Scratch changes is described in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License and disclaimers

- License: **AGPL-3.0-only**. See [`LICENSE`](LICENSE), [`NOTICE`](NOTICE) and
  [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).
- Media library and attributions: [`docs/MEDIA_LICENSES.md`](docs/MEDIA_LICENSES.md).
- Architecture docs: [`docs/WEB_BLUETOOTH_BRIDGE.md`](docs/WEB_BLUETOOTH_BRIDGE.md) and
  [`docs/LOCAL_STORE_ARCHITECTURE.md`](docs/LOCAL_STORE_ARCHITECTURE.md).
- Spark is based on the Scratch editor (an open-source project). Credits and a link to the source code are visible in
  the app ("About Spark").
- **Disclaimers:** Spark is an independent fork and is not affiliated with or endorsed by the Scratch Foundation or the
  LEGO Group. LEGO and WeDo are trademarks of their respective owners.
