// SPARK: comprobación del soporte de Web Bluetooth en el navegador.
//
// Web Bluetooth (navigator.bluetooth) solo está disponible en navegadores
// basados en Chromium (Chrome, Edge y derivados, también en Android) y
// únicamente en un contexto seguro (https o localhost).

/**
 * Whether this browser can talk to Bluetooth devices.
 * @returns {boolean} true if the Web Bluetooth API is available.
 */
const isWebBluetoothSupported = () => (
    typeof navigator !== 'undefined' &&
    typeof navigator.bluetooth !== 'undefined' &&
    navigator.bluetooth !== null &&
    (typeof window === 'undefined' || window.isSecureContext !== false)
);

export {
    isWebBluetoothSupported
};
