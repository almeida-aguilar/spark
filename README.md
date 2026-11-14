# Spark

PWA gratuita y de código abierto, basada en un fork del editor de Scratch, centrada exclusivamente en LEGO WeDo 2.0.
Funciona 100 % en local: sin cuentas, sin backend, sin analítica. Los proyectos se guardan en el navegador y se
importan y exportan como archivos `.sb3`. La conexión con el hub usa la API Web Bluetooth del navegador en lugar de
Scratch Link.

> **Aviso de marcas:** Spark es un fork independiente, no afiliado ni respaldado por la Scratch Foundation ni por el
> Grupo LEGO. LEGO y WeDo son marcas de sus respectivos titulares. Este proyecto se distribuye bajo la licencia
> AGPL-3.0.

---

# Spark

Spark is a free, open-source Progressive Web App (PWA) based on a fork of the Scratch editor, focused exclusively on
LEGO WeDo 2.0. It runs 100 % locally: no accounts, no backend, no analytics. Projects are saved in the browser and can
be imported and exported as `.sb3` files. The hub connects via the browser's Web Bluetooth API instead of Scratch Link.

> **Trademark notice:** Spark is an independent fork and is not affiliated with or endorsed by the Scratch Foundation
> or the LEGO Group. LEGO and WeDo are trademarks of their respective owners. This project is distributed under the
> AGPL-3.0 license.

---

## Navegadores compatibles / Supported browsers

- **Chromium** (Chrome, Edge y derivados, en escritorio y Android). Web Bluetooth está disponible.
- **Safari, iOS y Firefox:** la app funciona sin hardware, pero la conexión por Web Bluetooth **no está soportada**.
  Al intentar conectar, se muestra un aviso claro con los navegadores compatibles.

- **Chromium** (Chrome, Edge and derivatives, on desktop and Android). Web Bluetooth is available.
- **Safari, iOS and Firefox:** the app works without hardware, but Web Bluetooth connection is **not supported**.
  A clear message is shown when attempting to connect, listing the compatible browsers.

---

## Instalación / Installation

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-organizacion/spark.git
   cd spark
   ```
2. Instala las dependencias:
   ```bash
   npm ci
   ```
3. Construye y sirve la app:
   ```bash
   npm run build
   npm run serve
   ```
   (o el comando de sirvimiento que defina el paquete `scratch-gui`).
4. Abre la URL resultante en Chrome o Edge. Para instalar como PWA, usa el botón de instalación del navegador.

---

## Compartir proyectos / Sharing projects

- Los proyectos se guardan localmente en el navegador (IndexedDB) y se pueden exportar como `.sb3`.
- Para compartir, exporta el `.sb3` y compártelo por los medios que prefieras (email,Drive, USB…).
- Cualquier `.sb3` exportado por Spark debe abrirse en Scratch sin problemas. Si un proyecto contiene bloques de
  extensiones no soportadas (por ejemplo micro:bit), el editor mostrará un aviso y cargará lo que pueda.

---

## Cómo contribuir / Contributing

- Consulta `CONTRIBUTING.md` para ver el flujo de desarrollo (ramas, commits convencionales, tests, lint).
- Las decisiones arquitectónicas y los cambios de alcance se documentan en `docs/SPARK_DECISIONS.md`.
- Para integrar cambios upstream de Scratch, sigue las instrucciones de `CONTRIBUTING.md` y revisa los conflictos
  con cuidado; los cambios de Spark se marcan con el comentario `// SPARK:`.

---

## Licencia y descargos / License and disclaimers

- Este proyecto se distribuye bajo la licencia **AGPL-3.0**. Consulta `LICENSE`, `NOTICE` y `THIRD_PARTY_LICENSES`.
- La biblioteca multimedia incluye recursos con licencias verificadas; consulta `MEDIA_LICENSES.md` para ver la
  atribución de cada recurso.
- Spark se basa en el editor de Scratch, proyecto de código abierto. Créditos y enlace al código fuente visible en
  la interfaz y en el pie de página.
- **Descargos:** Spark es un fork independiente, no afiliado ni respaldado por la Scratch Foundation ni por el Grupo
  LEGO. LEGO y WeDo son marcas de sus respectivos titulares.