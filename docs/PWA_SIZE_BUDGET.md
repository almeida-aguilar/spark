# Presupuesto de tamaño de la PWA

Esta página registra la línea base, las medidas posteriores a la Fase 9 y el
presupuesto que comprueba `npm run check:size` sobre
`packages/scratch-gui/build` (el artefacto que despliega GitHub Pages).

## Cómo se mide

`packages/scratch-gui/scripts/check-build-size.mjs` lee cuatro métricas:

| Métrica | Definición |
|---|---|
| `initialBundleBytes` | Suma de los `<script src>` del `index.html` generado (el arranque real). |
| `precacheBytes` | Suma de las URL del manifiesto que Workbox inyecta en `sw.js`. |
| `libraryAssetsBytes` | Tamaño total de `build/static/library-assets`. |
| `buildBytes` | Tamaño total del directorio `build/`. |

El presupuesto está en `packages/scratch-gui/scripts/size-budget.json`. Se
ejecuta automáticamente al final de `npm run build` y también de forma
independiente con `npm run check:size` (en la raíz o en el workspace). En un
clone nuevo, `npm run build` y `npm start` descargan automáticamente los assets
de la biblioteca (`npm run fetch-library-assets`) si faltan; la biblioteca está
en `.gitignore` y requiere acceso a la red en la primera descarga.

## Línea base y resultado

Medidas antes de la Fase 9 (build de desarrollo publicado por `npm run build`)
y después de la Fase 9 (`npm run build:pwa`):

| Métrica | Línea base | Después de la Fase 9 | Límite |
|---|---:|---:|---:|
| Bundle inicial (`gui.js`) | 20,6 MiB | **10,63 MiB** (11.143.219 B) | 12.000.000 B |
| Precache | 80,3 MB / 1895 URL | **17,87 MiB** (18.741.806 B) / 529 URL | 21.000.000 B |
| Biblioteca multimedia | 54,30 MiB (56.944.699 B) | **45,55 MiB** (47.760.616 B) | 52.000.000 B |
| Directorio `build/` | 121 MiB | **76,72 MiB** (80.448.017 B) | 90.000.000 B |

La optimización de la biblioteca ahorra 8,76 MiB; el resto del ahorro viene de
publicar solo la entrada `gui` con minificación de producción, de no incluir
mapas de origen en la PWA y de no precachear la biblioteca completa.

## Qué se optimiza

- **PNG:** se recomprimen los bloques IDAT con deflate nivel 9, conservando el
  resto de bloques (perfiles de color, metadatos) y los píxeles exactos.
- **SVG:** se eliminan comentarios y el espacio en blanco entre etiquetas; se
  conservan los atributos, los namespaces y el texto.
- **WAV:** el PCM mono de 8/16 bits se convierte a IMA ADPCM, el formato que ya
  usaban la mayoría de los sonidos de Scratch. Los archivos ya ADPCM o estéreo
  no se tocan. La conversión se valida contra el decodificador de
  `scratch-audio`.

Los nombres `<md5>.<ext>` no cambian: `scratch-storage` no comprueba el hash
del contenido al cargar, y los JSON de biblioteca y los `.sb3` siguen
referenciando el mismo identificador. Como efecto colateral documentado, el
nombre ya no es el MD5 de los bytes optimizados. Las optimizaciones son
idempotentes y se aplican tanto al descargar la biblioteca como al construir.

No se convierten los PNG a WebP/AVIF: el par `md5ext`/`dataFormat` de Scratch y
los proyectos `.sb3` exigen la extensión original, y no hay un optimizador de
imágenes disponible sin añadir dependencias externas.

La compatibilidad se comprueba con tests unitarios de los tres formatos y
cargando assets optimizados reales con `scratch-storage`: el `assetId` y los
bytes devueltos son los esperados y el WAV ADPCM se decodifica con
`scratch-audio`. Los tests de importación/exportación de `.sb3` de la VM siguen
pasando sin cambios.

## Precache y funcionamiento sin conexión

El service worker precachea el app shell (incluido `gui.js`, por eso se elevó
`maximumFileSizeToCacheInBytes` a 12 MiB), los chunks, los idiomas y los
recursos estáticos versionados. La biblioteca multimedia y los modelos de
MediaPipe se excluyen del precache y se guardan bajo demanda con una ruta
`CacheFirst` dedicada (`spark-library-assets-v1`).

Consecuencia: tras la primera visita el editor, los idiomas y los recursos ya
usados funcionan sin conexión; un asset de la biblioteca que nunca se ha usado
necesita una primera descarga. Los assets añadidos a un proyecto se guardan
también en el almacén local de IndexedDB, por lo que los proyectos creados
siguen abriéndose sin red.

## Compresión de transferencia

Se renuncia a gzip/Brotli: el destino es GitHub Pages, que no permite
configuración propia de cabeceras ni servir variantes precomprimidas. Los
archivos ya comprimidos (PNG, ADPCM) tampoco se beneficiarían de forma
significativa. Para un despliegue propio con servidor configurable, se
recomienda habilitar Brotli/gzip para `*.js`, `*.css` y `*.svg`, sin volver a
comprimir PNG ni WAV.
