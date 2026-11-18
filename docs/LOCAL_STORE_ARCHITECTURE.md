# Arquitectura del almacén local

Spark funciona 100 % en local: no hay cuentas ni servidor. Los proyectos, sus
recursos (imágenes y sonidos) y el estado de trabajo se guardan en el navegador.

Decisiones de diseño: `docs/SPARK_DECISIONS.md` (D020, D021, D026).

## Visión general

| Datos | Almacenamiento | Implementación |
| --- | --- | --- |
| Proyectos guardados y metadatos (id, título, fecha, instantáneas) | IndexedDB `spark-projects` (con reserva en memoria) | `packages/scratch-gui/src/lib/project-store.js`, `project-store-local.js`, `project-store-provider.js` |
| Assets referenciados por los proyectos (disfraces, sonidos) | IndexedDB `spark-assets` (con reserva en memoria) | `packages/scratch-gui/src/lib/local-assets.js` |
| Carga de proyectos/assets para la VM | Helper de `scratch-storage` | `packages/scratch-gui/src/lib/indexed-db-helper.js` |
| Guardado/autoguardado desde la GUI | HOC de guardado | `packages/scratch-gui/src/lib/project-saver-hoc.jsx` |
| Biblioteca multimedia empaquetada | Archivos estáticos servidos con la app | `packages/scratch-gui/static/library-assets/`, `legacy-storage.ts` |

## Interfaz `ProjectStore`

`ProjectStore` define el contrato de persistencia de proyectos para desacoplar
la aplicación del mecanismo concreto:

- `load(id)` / `getEntry(id)` — recupera un proyecto o `null`.
- `save(id, projectData, title)` — guarda y devuelve la entrada (genera un id
  `local-...` si `id` es nulo).
- `list()` — lista los proyectos guardados.
- `remove(id)` — elimina un proyecto y sus instantáneas.
- `saveSnapshot(id, projectData, title)` / `listSnapshots(id)` — instantáneas
  rotatorias para recuperación.

La implementación actual es `LocalProjectStore` (`project-store-local.js`),
obtenida mediante `getProjectStore()` (`project-store-provider.js`). La
indirección permite añadir en el futuro otra implementación (p. ej. sincronizada
con un servidor) sin reescribir la interfaz.

## Base de datos de proyectos (`spark-projects`)

- **Versión:** 2.
- **Almacenes:** `projects` (clave `id`) e `snapshots` (clave autoincremental).
- **Entrada de proyecto:** `{id, title, projectData, modified}`. El título se
  guarda en la entrada (no dentro del `.sb3`).
- **Instantáneas:** se conservan hasta 3 por proyecto (`MAX_SNAPSHOTS`); al
  guardar una nueva se descartan las más antiguas.
- **Reserva en memoria:** si IndexedDB no está disponible (p. ej. algunos modos
  de navegación privada), los datos se mantienen en memoria durante la sesión.

## Base de datos de assets (`spark-assets`)

- **Versión:** 1.
- **Almacén:** `assets` (clave `id`, normalmente el md5 del contenido).
- **Entrada:** `{id, assetTypeName, dataFormat, data}`.
- **Reserva en memoria:** igual que los proyectos, con un mapa en memoria si la
  escritura/lectura en IndexedDB falla o no está disponible.

## Integración con `scratch-storage`

`IndexedDbHelper` (`indexed-db-helper.js`) es un `Helper` de `scratch-storage`
que carga desde el navegador:

- **Proyectos (`AssetType.Project`):** lee la entrada de `ProjectStore`, crea el
  `Asset` con `DataFormat.JSON` y adjunta `asset.title` para que el cargador
  restaure el título del editor.
- **Imágenes y sonidos:** lee de `loadAsset` (`local-assets.js`) y reconstruye
  el `Asset` con su tipo y formato.

Si un recurso no existe en local, el helper **rechaza** la promesa (no resuelve
`null`): la cadena de carga de `scratch-storage` solo continúa con el siguiente
helper ante un rechazo.

`IndexedDbHelper` no implementa `store`; el flujo de guardado escribe
directamente en los almacenes locales.

## Flujo de guardado

`ProjectSaverHOC` (`project-saver-hoc.jsx`) coordina el guardado:

1. Serializa el estado de la VM (`vm.toJSON()`).
2. Persiste los assets del proyecto en `spark-assets` (los modificados; el
   `assetId` es el hash del contenido, por lo que el mismo id implica el mismo
   contenido ya almacenado).
3. Guarda el proyecto en `spark-projects` vía `ProjectStore.save(...)`.
4. Marca el proyecto como sin cambios, solicita almacenamiento persistente
   (`navigator.storage.persist()`), guarda una instantánea rotatoria y recuerda
   el último id en `localStorage` (`spark.lastProjectId`) para ofrecer
   "Continuar donde lo dejaste" al iniciar.
5. **Autoguardado:** con debounce (aprox. 2 s tras cambios) y al ocultarse la
   pestaña (`visibilitychange`), para no perder el trabajo pendiente.
6. **Errores:** la cuota agotada se detecta y se comunica con un aviso específico
   que recomienda exportar; los fallos se registran con contexto.

La importación/exportación de archivos `.sb3` usa el formato estándar de
Scratch; un `.sb3` exportado por Spark debe poder abrirse en Scratch.

## Biblioteca multimedia empaquetada

Los recursos de las bibliotecas (disfraces, fondos, sonidos) se sirven como
archivos locales (`static/library-assets/`) copiados al build y resueltos por
`legacy-storage.ts`/`legacy-library-asset-url.ts`, sin CDN externo. Su
procedencia y licencias están documentadas en `docs/MEDIA_LICENSES.md`.
