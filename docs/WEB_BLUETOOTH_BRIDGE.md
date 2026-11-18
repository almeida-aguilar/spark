# Arquitectura del puente Web Bluetooth

Este documento describe cómo Spark conecta la extensión LEGO WeDo 2.0 con el
navegador usando la API Web Bluetooth, sin Scratch Link ni procesos externos.

## Objetivo

La extensión WeDo 2.0 de `scratch-vm` ya implementa el protocolo del hub
(lectura de sensores, escritura de actuadores, notificaciones). Para no tocar
esa lógica, Spark sustituye solo la capa de transporte: en lugar de hablar con
Scratch Link por WebSocket/JSON-RPC, la sesión BLE habla directamente con
`navigator.bluetooth`.

Decisiones de diseño: `docs/SPARK_DECISIONS.md` (D017, D018, D019).

## Componentes

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| Sesión/puente | `packages/scratch-vm/src/io/web-bluetooth-session.js` | Acceso GATT con Web Bluetooth, cola de operaciones, conversión base64 y emisión de eventos del runtime. |
| Extensión WeDo 2.0 | `packages/scratch-vm/src/extensions/scratch3_wedo2/` | Lógica de bloques y protocolo WeDo 2.0; usa la sesión a través de la misma interfaz pública que el transporte anterior. |
| Detección de soporte (GUI) | `packages/scratch-gui/src/lib/web-bluetooth.js` | Comprueba `navigator.bluetooth` y contexto seguro para decidir si se puede buscar un dispositivo. |
| Flujo de conexión (GUI) | `packages/scratch-gui/src/containers/connection-modal.jsx`, `packages/scratch-gui/src/components/connection-modal/*` | Estados del modal (buscar, conectar, conectado, error, no disponible), botón explícito de búsqueda y reconexión. |

La clase vive en `scratch-vm/src/io` (y no en un directorio `spark/` separado)
porque la extensión la importa desde `@scratch/scratch-vm` (D019).

## Interfaz del transporte

`WebBluetoothSession` mantiene la misma interfaz pública que la clase BLE que
reemplaza, de modo que la extensión no necesita conocer el transporte:

- `constructor(runtime, extensionId, peripheralOptions, connectCallback, resetCallback)`
- `requestPeripheral()` — solicita al usuario elegir un dispositivo (requiere
  un gesto de usuario, p. ej. clic en "Start Searching").
- `connectPeripheral(id)` — conecta con el dispositivo elegido.
- `reconnect()` — vuelve a conectar con el último dispositivo.
- `disconnect()` — cierra la conexión.
- `isConnected()` — indica si hay conexión activa.
- `read(serviceId, characteristicId, optStartNotifications, onCharacteristicChanged)`
- `write(serviceId, characteristicId, message, encoding, withResponse)`
- `startNotifications(...)` / `stopNotifications(...)`

Las operaciones GATT se serializan en una cola interna (`_enqueue`), porque la
API Web Bluetooth falla si se solapan.

## Codificación y eventos

- **Codificación:** la extensión intercambia datos en base64. Al escribir se
  convierte de base64 a `Uint8Array` (`Base64Util.base64ToUint8Array`) y al
  leer/notificar de bytes a base64 (`uint8ArrayToBase64`).
- **Eventos de runtime:** la sesión emite los mismos eventos que usa la GUI
  (`PERIPHERAL_LIST_UPDATE`, `USER_PICKED_PERIPHERAL`,
  `PERIPHERAL_SCAN_TIMEOUT`, `PERIPHERAL_CONNECTED`, `PERIPHERAL_DISCONNECTED`,
  `PERIPHERAL_REQUEST_ERROR`, `PERIPHERAL_CONNECTION_LOST_ERROR`) para
  reutilizar la interfaz existente.

## Flujo de conexión

1. El usuario abre el modal de conexión de la extensión WeDo 2.0.
2. Si el navegador no soporta Web Bluetooth o no es un contexto seguro, el
   modal pasa directamente al estado "no disponible" con un mensaje claro y la
   lista de navegadores compatibles. El editor sigue siendo usable sin hardware.
3. Con soporte disponible, el usuario pulsa el botón de búsqueda: desde ese
   gesto se llama a `navigator.bluetooth.requestDevice(...)`.
4. Tras elegir el dispositivo, se emiten `PERIPHERAL_LIST_UPDATE` y
   `USER_PICKED_PERIPHERAL` con un único periférico; la GUI existente inicia la
   conexión.
5. `connectPeripheral` conecta el servidor GATT y registra el listener
   `gattserverdisconnected`. Al conectar se emite `PERIPHERAL_CONNECTED`.
6. Lecturas, escrituras y notificaciones se ejecutan en orden a través de la
   cola; los callbacks de notificación reciben el valor en base64.

## Opciones del dispositivo y servicios

`_buildRequestOptions` parte de `peripheralOptions` (`filters`,
`optionalServices`) y garantiza que **todos los servicios usados** estén en
`optionalServices`, incluidos los presentes en los filtros. Si un servicio no
figura ahí, el navegador bloquea el acceso a sus características.

## Desconexión y reconexión

- **Desconexión esperada:** `disconnect()` limpia estado y emite
  `PERIPHERAL_DISCONNECTED`.
- **Desconexión inesperada:** el evento `gattserverdisconnected` provoca
  `handleDisconnectError`, que desconecta, ejecuta el `resetCallback` de la
  extensión y emite `PERIPHERAL_CONNECTION_LOST_ERROR`. El modal ofrece un botón
  "Reconectar" que llama a `reconnect()` sobre el mismo dispositivo.

## Compatibilidad y limitaciones

- Web Bluetooth está disponible en navegadores basados en Chromium (Chrome,
  Edge y derivados, escritorio y Android) y solo en contextos seguros (HTTPS o
  localhost).
- Safari, iOS y Firefox no soportan Web Bluetooth: Spark funciona sin hardware
  y muestra el aviso correspondiente al intentar conectar.
- La verificación con un hub WeDo 2.0 real es parte del QA manual
  (`context/plan.md`, sección 5); las pruebas automatizadas usan mocks de
  `navigator.bluetooth`.
