# Spark: plan de implementación

*Documento para un LLM de código (Claude Code, Codex o similar) y para la persona responsable del proyecto. Las rutas y nombres de archivo son orientativos, basados en la estructura del monorepo scratch-editor: verifícalos siempre con búsquedas en el código real.*

## 0. Cómo usar este documento

- Léelo completo antes de tocar código. Trabaja fase por fase, en orden. No empieces una fase sin cumplir los criterios de aceptación de la anterior.
- Cada fase termina en commits pequeños, con el build y los tests en verde.
- Si el código real contradice este plan, manda el código: anota la discrepancia en `docs/SPARK_DECISIONS.md` y sigue con la opción más conservadora.
- No inventes datos legales (licencias de recursos, textos de marca). Si no puedes verificar algo, exclúyelo y anótalo como pendiente.
- Minimiza el diff sobre archivos upstream para poder integrar cambios futuros de Scratch. El código nuevo va en un directorio propio (por ejemplo `spark/`) y los cambios en archivos upstream se marcan con el comentario `// SPARK:`.
- Cuando algo no se pueda probar sin hardware real (el hub WeDo 2.0), usa mocks y deja la verificación en la lista de QA manual (sección 5).

## 1. Qué es Spark

PWA gratuita y de código abierto, basada en un fork del editor de Scratch, centrada exclusivamente en LEGO WeDo 2.0. Funciona 100 % en local: sin cuentas, sin backend, sin analítica. Los proyectos se guardan en el navegador y se importan y exportan como archivos `.sb3`. La conexión con el hub usa la API Web Bluetooth del navegador en lugar de Scratch Link.

## 2. Decisiones cerradas

- **Base del código:** monorepo actual `scratch-editor` (licencia AGPL-3.0). El fork se mantiene bajo AGPL-3.0.
- **Navegadores objetivo:** Chromium (Chrome, Edge y derivados, en escritorio y Android). En Safari, iOS y Firefox la app funciona sin hardware y muestra un aviso claro al intentar conectar.
- **Hardware:** solo LEGO WeDo 2.0, un único hub conectado a la vez.
- **Extensiones que se quedan:** WeDo 2.0, Lápiz, Música y Detección de vídeo (todas funcionan en local).
- **Extensiones que se eliminan:** Makey Makey, micro:bit, Go Direct Force & Acceleration, LEGO MINDSTORMS EV3, LEGO BOOST, Texto a voz y Traductor (estas dos necesitan servidores). También se eliminan las variables en la nube.
- **Biblioteca multimedia:** subconjunto de recursos de Scratch con licencia verificada, empaquetado en local.
- **Idiomas:** todos los de Scratch (paquete scratch-l10n), con carga diferida por idioma.
- **Persistencia:** autoguardado en IndexedDB y exportación e importación de `.sb3`.
- **Stack:** se mantiene el tooling de Scratch (webpack, React, JavaScript). Service worker con Workbox.
- **Imagen:** se sustituye el gato y todo el branding de Scratch por identidad propia.
- **Nombre:** Spark. Antes de publicar, comprobar que no choca con marcas existentes en software educativo.

## 3. Reglas de trabajo

1. Haz un build limpio y ejecuta los tests existentes antes de cambiar nada. Guarda el resultado como línea base.
2. Una fase = una rama o una serie de commits con mensajes claros.
3. Cada fase añade o actualiza tests. Los tests que fallaban antes de empezar se documentan, no se ocultan.
4. Cualquier decisión nueva se registra en `docs/SPARK_DECISIONS.md` (fecha, contexto, decisión, alternativas).
5. Nunca introduzcas dependencias sin comprobar su licencia y añadirla a `THIRD_PARTY_LICENSES`.
6. No elimines los avisos de copyright ni los archivos LICENSE originales.

## 4. Fases

### Fase 0: Preparación e inventario

**Tareas**

- Hacer el fork, instalar dependencias y comprobar que el editor arranca en local.
- Inventariar en `docs/INVENTORY.md`: (a) todas las URLs externas del código (buscar `scratch.mit.edu`, `assets.scratch.mit.edu`, `projects.scratch.mit.edu`, `cdn.`, `https://`, `fetch(`, `XMLHttpRequest`, WebSocket); (b) la lista de extensiones y dónde se registran; (c) los repositorios de dependencias que viven fuera del monorepo (scratch-blocks, scratch-paint, scratch-audio, scratch-storage, scratch-l10n, etc.) con su licencia; (d) los archivos de marca (logos, iconos, favicon, imágenes de bienvenida).
- Crear `docs/SPARK_DECISIONS.md`.

**Aceptación:** el editor compila y arranca, y el inventario está completo y revisado.

### Fase 1: Marca, licencias y avisos

**Tareas**

- Leer los archivos `LICENSE` y `TRADEMARK` del monorepo y respetarlos. Mantenerlos en el repositorio.
- Renombrar el producto a Spark en `package.json`, títulos HTML, manifiestos, textos de la interfaz y documentación.
- Sustituir logo, favicon, iconos y el sprite por defecto (el gato) por recursos propios y neutrales. No usar los personajes de marca de Scratch.
- Añadir una página o diálogo Acerca de con: créditos a Scratch (proyecto en el que se basa), enlace al código fuente de Spark (requisito de la AGPL por servirse en red), licencia AGPL-3.0 y este descargo: Spark es un fork independiente, no afiliado ni respaldado por la Scratch Foundation ni por el Grupo LEGO. LEGO y WeDo son marcas de sus respectivos titulares.
- Enlace al código fuente visible también en el pie o menú de la interfaz principal.
- Crear `NOTICE` y `THIRD_PARTY_LICENSES` (puede generarse con una herramienta como license-checker).
- Revisar los iconos de la extensión WeDo 2.0 heredados. No usar logos de LEGO como identidad. Si hay dudas sobre su origen, sustituirlos por iconos propios.
- Eliminar enlaces de ayuda, tutoriales, comunidad y feedback que apunten a Scratch.

**Aceptación:** una búsqueda de la palabra Scratch en la interfaz visible solo encuentra los créditos y el descargo. Los avisos de licencia originales siguen presentes.

### Fase 2: Poda de extensiones

**Tareas**

- En scratch-vm: quitar del registro de extensiones integradas y del código las de Makey Makey, micro:bit, Go Direct Force & Acceleration, EV3, BOOST, Texto a voz y Traductor. Conservar WeDo 2.0, Lápiz, Música y Detección de vídeo.
- En scratch-gui: dejar la biblioteca de extensiones con solo esas cuatro. Eliminar las entradas, imágenes, textos de conexión y enlaces de ayuda de las demás.
- Eliminar el soporte de variables en la nube (bloques, interfaz y conexión al servidor).
- Comportamiento al cargar un proyecto con extensiones eliminadas: **no debe fallar ni descartar nada en silencio**. Debe cargarse lo que sea posible y mostrar un aviso listando las extensiones no soportadas. Primero investiga cómo actúa scratch-vm hoy con una extensión desconocida y documenta el resultado. Luego implementa el aviso y cubre el caso con un test que use un `.sb3` de ejemplo con bloques de micro:bit.
- Eliminar código muerto, assets y traducciones exclusivas de lo eliminado solo si es seguro. En caso de duda, déjalos y anótalo.

**Aceptación:** el menú de extensiones muestra exactamente WeDo 2.0, Lápiz, Música y Detección de vídeo. El build y los tests pasan. Abrir un proyecto con micro:bit muestra el aviso y no rompe el editor.

### Fase 3: Puente Web Bluetooth (sustituye a Scratch Link)

**Contexto:** la extensión WeDo 2.0 de scratch-vm se comunica mediante una clase BLE (por ejemplo `src/io/ble.js`) que habla con Scratch Link por WebSocket con mensajes tipo JSON-RPC (descubrir, conectar, leer, escribir, notificaciones) y datos en base64. Verifica los detalles reales. El objetivo es **no tocar la lógica de la extensión**, solo la capa de transporte.

**Tareas**

1. Crear una clase nueva (por ejemplo `spark/ble/WebBluetoothSession`) con la misma interfaz pública que la clase BLE actual: constructor (runtime, extensionId, opciones del periférico, callbacks de conexión y reinicio), solicitar periférico, conectar, desconectar, estado conectado, leer, escribir y activar o desactivar notificaciones.
2. Traducir las opciones del periférico a `navigator.bluetooth.requestDevice` con `filters` y `optionalServices`. **Todos los servicios que use la extensión deben figurar en `optionalServices`**, o el navegador bloqueará el acceso.
3. Codificación: la extensión envía y espera base64. El puente debe convertir de base64 a bytes al escribir y de bytes a base64 al leer o notificar.
4. Flujo de usuario: `requestDevice` exige un gesto del usuario. En el paso de búsqueda del modal de conexión debe haber un botón explícito Buscar hub que dispare el escaneo. Tras la selección, emitir el evento de lista de periféricos con un único dispositivo (o conectar directamente) para reutilizar la interfaz existente con el mínimo cambio.
5. Eventos: emitir los mismos eventos de runtime que usa hoy la GUI (conexión, desconexión, error de petición, tiempo de espera) para que el estado visual del hub siga funcionando. Escuchar `gattserverdisconnected` y llamar al callback de reinicio.
6. Serializar todas las operaciones GATT con una cola. El navegador falla si se solapan operaciones.
7. Detección de soporte: si no existe `navigator.bluetooth` o el contexto no es seguro, mostrar en el modal un mensaje claro con los navegadores compatibles. El editor sigue siendo plenamente usable sin hardware.
8. Reconexión: tras una desconexión inesperada, mostrar el estado y ofrecer un botón Reconectar que intente volver a conectar con el mismo dispositivo.
9. Eliminar toda referencia a Scratch Link: detección de instalación, textos, enlaces de ayuda y mensajes de error.
10. Tests unitarios con un mock completo de `navigator.bluetooth` (dispositivo, servidor GATT, servicios, características): codificación, cola de operaciones, eventos de conexión y desconexión, ausencia de soporte.

**Aceptación:** con el mock, el flujo completo (buscar, conectar, escribir, recibir notificaciones, desconectar) funciona y los tests pasan. En el código no queda ninguna referencia a Scratch Link ni a WebSocket local. La verificación con un hub real queda en la lista de la sección 5.

### Fase 4: Eliminar red, cuentas y backend

**Tareas**

- Quitar de la interfaz: inicio de sesión y registro, menú de usuario, Mis cosas, Compartir, Guardar ahora, Remix, la mochila (backpack), tutoriales y vídeos externos, comunidad y cualquier enlace a scratch.mit.edu.
- Quitar cualquier analítica, seguimiento o telemetría.
- Revisar scratch-storage: eliminar los almacenes web que apuntan a servidores de Scratch. Los assets se servirán localmente (ver fase 5).
- Revisar fuentes, imágenes y scripts: todo debe estar empaquetado, sin CDN externos.
- Añadir una política de seguridad de contenido (CSP) restrictiva, por ejemplo con `connect-src 'self'` y orígenes propios para scripts y estilos.
- Introducir una interfaz `ProjectStore` (cargar, guardar, listar) con una única implementación local. Así, si el proyecto crece, se puede añadir una implementación con backend sin reescribir la interfaz.

**Aceptación:** un test e2e en Chromium (Playwright) que bloquee todas las peticiones a otros orígenes comprueba que el editor arranca y se usa con normalidad sin ninguna petición externa. Una búsqueda de dominios de Scratch en el código fuente (excepto créditos y enlaces de documentación) no devuelve resultados.

### Fase 5: Biblioteca multimedia local verificada

**Tareas**

1. Localizar las bibliotecas (sprites, disfraces, fondos, sonidos) y cómo se resuelven los assets (hash más extensión hacia una URL de CDN de Scratch).
2. Crear `spark/media/candidates.json` con los recursos candidatos y, para cada uno, campos de procedencia y licencia: autor, fuente, licencia, URL donde se verificó y estado `verified` (true o false).
3. Reglas de selección: incluir únicamente recursos con licencia confirmada en documentación oficial. Excluir los personajes de marca de Scratch (gato, Gobo, Giga, Pico, Nano, Tera, etc.) y cualquier recurso de origen dudoso. No asumas la licencia: si no hay evidencia, queda fuera y se anota como pendiente.
4. Presupuesto orientativo: tamaño total de la biblioteca en torno a 25 MB como máximo. Cuenta con un conjunto reducido (decenas de sprites, fondos y sonidos).
5. Script de build `scripts/build-media` que lee los candidatos verificados, copia los assets a una carpeta local servida por la app y genera las bibliotecas JSON locales. El script **falla** si algún recurso incluido tiene `verified: false`.
6. Configurar scratch-storage para resolver los assets desde la carpeta local.
7. Proyecto por defecto sin el gato: lienzo vacío o un sprite neutral propio. Sonidos y disfraces del editor (creación) sin dependencias externas.
8. Generar automáticamente `docs/MEDIA_LICENSES.md` con la atribución de cada recurso incluido.

**Aceptación:** todas las entradas de las bibliotecas se resuelven localmente sin red. Ningún recurso sin licencia verificada entra en el build. `MEDIA_LICENSES.md` existe y es completo.

### Fase 6: Persistencia local e importación y exportación

**Tareas**

- Autoguardado en IndexedDB del proyecto actual, serializado con la función de guardado de `.sb3` de la VM. Hacerlo con debounce (por ejemplo unos 2 segundos tras cada cambio) y al ocultarse la pestaña (`visibilitychange`). Conservar la versión actual y unas pocas instantáneas rotatorias.
- Al iniciar, si hay autoguardado, ofrecer Continuar donde lo dejaste o Proyecto nuevo.
- Menú Archivo: Nuevo, Cargar desde tu ordenador y Guardar en tu ordenador. En Chromium, opcionalmente usar la File System Access API para guardar sobre el mismo archivo, con descarga clásica como alternativa en el resto.
- Aviso de cambios sin guardar al cerrar (`beforeunload`).
- Solicitar almacenamiento persistente (`navigator.storage.persist()`) y mostrar un aviso discreto que recomiende exportar con frecuencia, porque el navegador puede borrar datos locales.
- Manejo de errores: cuota de almacenamiento agotada, archivo corrupto, archivo demasiado grande y extensiones no soportadas (ver fase 2).
- Mantener la compatibilidad: un `.sb3` exportado por Spark debe poder abrirse en Scratch.

**Aceptación:** tests unitarios del almacén y e2e que crean un proyecto, recargan la página y recuperan el trabajo. Exportar e importar devuelve un proyecto equivalente.

### Fase 7: Idiomas

**Tareas**

- Incluir todos los idiomas de scratch-l10n, con carga diferida (un chunk por idioma) para no inflar el bundle inicial.
- Añadir las cadenas propias de Spark (avisos de Web Bluetooth, almacenamiento, Acerca de, etc.) con un prefijo propio. Traducirlas al menos a español e inglés. El resto de idiomas recurre al inglés.
- Detectar el idioma inicial con `navigator.language` y recordar la elección del usuario en `localStorage`.
- Verificar que los idiomas de derecha a izquierda siguen funcionando.

**Aceptación:** cambiar de idioma funciona sin conexión y las cadenas nuevas aparecen en español e inglés.

### Fase 8: PWA instalable y sin conexión

**Tareas**

- `manifest.webmanifest` con nombre, `short_name`, iconos de 192 y 512 píxeles (incluido maskable), `display: standalone`, `start_url`, `scope`, colores y idioma.
- Service worker con Workbox (InjectManifest o workbox-build, según encaje con el build). Precachear el app shell, los chunks, los assets de la biblioteca multimedia y los idiomas. Estrategia cache-first para recursos estáticos versionados.
- Flujo de actualización: cuando haya una versión nueva, mostrar un aviso Hay una versión nueva, ¿actualizar? Nunca recargar sin preguntar, para no perder trabajo.
- Soportar publicación en una subruta (por ejemplo GitHub Pages) mediante una opción de base path.
- Verificar que Web Bluetooth funciona con la app cargada sin conexión.

**Aceptación:** tras una primera visita, con la red desconectada (Playwright `setOffline(true)`) el editor arranca, se pueden crear, guardar, importar y exportar proyectos y cambiar de idioma. La app pasa la comprobación de instalable de Lighthouse.

### Fase 9: Compresión de assets y reducción del peso de la PWA

**Tareas**

- Medir el peso actual del bundle inicial, de los chunks y de `static/library-assets` (PNG, WAV y SVG) con un analizador de bundle y guardar la línea base en `docs/`.
- Comprimir los recursos multimedia locales sin perder la calidad aceptable: optimizar PNG (y valorar WebP/AVIF con alternativa para los navegadores objetivo), minificar SVG y comprimir WAV sin romper la importación/exportación de `.sb3` ni la compatibilidad con Scratch. Actualizar `docs/MEDIA_LICENSES.md` si cambia algún archivo.
- Reducir el JavaScript de arranque: revisar el splitter de webpack, mover a chunks diferidos lo que no haga falta en el primer render, eliminar mapas de origen de producción y descartar dependencias o extensiones que no se usen (sin reintroducir las podadas en la fase 2).
- Evitar precachear de entrada la biblioteca multimedia completa: mantener precache del app shell, chunks e idiomas, y pasar los assets grandes a caché bajo demanda con estrategia cache-first, preservando el funcionamiento sin conexión tras la primera visita.
- Añadir compresión de transferencia (gzip/Brotli) para los recursos versionados, y documentar la configuración del servidor necesaria (o renunciar a ella si el destino no la soporta).
- Definir un presupuesto de tamaño (bundle inicial, total precacheado y assets de biblioteca) y un script que lo compruebe sobre el build.

**Aceptación:** el peso total descargado y el del bundle inicial bajan respecto a la línea base documentada; la app sigue siendo instalable y funciona sin conexión; los proyectos `.sb3` siguen abriendo en Spark y en Scratch; el presupuesto de tamaño se verifica con el script y las licencias siguen siendo correctas.

**Estado (2026-11-17):** implementada. La biblioteca baja de 54,30 a 45,55 MiB, el bundle inicial de 20,6 a 10,63 MiB y el precache de 80,3 MB a 17,87 MiB. La compresión de transferencia se renuncia por el alojamiento en GitHub Pages. Línea base, medidas y presupuesto en `docs/PWA_SIZE_BUDGET.md`; decisiones en D030. Queda pendiente la verificación e2e offline y Lighthouse de la Fase 8 con el build final.

### Fase 10: Calidad, CI y documentación

**Tareas**

- CI con lint, tests unitarios, tests e2e y build.
- Comprobación automática de licencias de dependencias, y de que ningún recurso o dominio externo se cuela.
- README en español e inglés con: qué es Spark, navegadores compatibles (y la limitación en iOS), instalación, compartir proyectos con archivos `.sb3`, cómo contribuir, licencia y descargos.
- `CONTRIBUTING.md` y una nota sobre cómo integrar cambios upstream de Scratch.
- Documentar en `docs/` la arquitectura del puente Web Bluetooth y del almacén local.

**Aceptación:** CI en verde, documentación completa, `THIRD_PARTY_LICENSES` y `MEDIA_LICENSES.md` actualizados.

## 5. QA manual con hardware real (no automatizable)

- Conectar un hub WeDo 2.0 en Chrome sobre Windows, macOS, ChromeOS y Android. Comprobar también Linux, donde la disponibilidad de Web Bluetooth puede requerir configuración adicional (verificar y documentar).
- Probar motores, LED, sensor de distancia y sensor de inclinación.
- Probar desconexión (apagar el hub, alejarse) y reconexión.
- Probar que el modal de conexión muestra el mensaje correcto en Safari, iOS y Firefox.
- Probar el uso sin conexión: instalar la PWA, desconectar la red y repetir las pruebas.
- Comprobar que un `.sb3` creado en Spark se abre en Scratch y viceversa (con la advertencia de extensiones).

## 6. Riesgos y puntos que el LLM debe escalar a la persona responsable

- **Licencia de recursos multimedia:** si no se puede verificar, el recurso se excluye. No asumas nada.
- **Marca:** confirmar el texto de la política TRADEMARK del repositorio y que el nombre Spark no genera conflicto.
- **Imágenes de LEGO:** cualquier icono o imagen con logos o arte de LEGO debe sustituirse o consultarse.
- **Deriva con upstream:** si un cambio requiere modificar muchos archivos upstream, detente y propón una alternativa más aislada.
- **Limitaciones de Web Bluetooth:** iOS y Safari no están soportados, y el comportamiento BLE varía entre sistemas. Documentarlo siempre, sin prometer compatibilidad total.
- **Pérdida de datos local:** el almacenamiento del navegador no es una copia de seguridad. Mantener los avisos y la facilidad de exportar.

## 7. Definición de hecho (checklist global)

- [ ] Build y tests en verde, sin peticiones de red externas en el e2e.
- [ ] Solo WeDo 2.0, Lápiz, Música y Detección de vídeo en el menú de extensiones.
- [ ] Conexión por Web Bluetooth, sin referencias a Scratch Link.
- [ ] Sin cuentas, sin backend, sin analítica, sin variables en la nube.
- [ ] Biblioteca multimedia local con licencias verificadas y documentadas.
- [ ] Autoguardado, importación y exportación de `.sb3` funcionando.
- [ ] Todos los idiomas de Scratch disponibles, con las cadenas de Spark en español e inglés.
- [ ] PWA instalable y funcional sin conexión.
- [ ] Marca de Scratch eliminada, créditos, descargos y enlace al código fuente presentes.
- [ ] LICENSE, NOTICE, THIRD\_PARTY\_LICENSES y MEDIA\_LICENSES completos.

