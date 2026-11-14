const Base64Util = require('../util/base64-util');
const log = require('../util/log');

/**
 * The time (in milliseconds) to wait for the user to pick a peripheral in the
 * browser's device chooser before considering the search finished.
 * @type {number}
 */
const DISCOVER_TIMEOUT = 60000;

/**
 * A session with a Bluetooth Low Energy peripheral, using the browser's Web
 * Bluetooth API instead of an external helper.
 *
 * It offers the same interface as the transport it replaces, so the
 * extensions using it do not need to know how the peripheral is reached:
 *
 *  - requestPeripheral: ask the user to pick a device (needs a user gesture).
 *  - connectPeripheral: connect to the picked device.
 *  - disconnect: close the connection.
 *  - isConnected: whether the peripheral is connected.
 *  - read / write / startNotifications / stopNotifications: talk to the device.
 *
 * All the GATT operations are serialized in a queue, because the Web Bluetooth
 * API fails when two operations overlap.
 */
class WebBluetoothSession {

    /**
     * @param {Runtime} runtime - the Runtime for sending/receiving GUI update events.
     * @param {string} extensionId - the id of the extension using this session.
     * @param {object} peripheralOptions - the options for the device request.
     * @param {function} connectCallback - a callback for connection.
     * @param {function} [resetCallback] - a callback for resetting extension state.
     */
    constructor (runtime, extensionId, peripheralOptions, connectCallback, resetCallback = null) {
        this._runtime = runtime;
        this._extensionId = extensionId;
        this._peripheralOptions = peripheralOptions || {};
        this._connectCallback = connectCallback;
        this._resetCallback = resetCallback;

        this._device = null;
        this._connected = false;
        this._characteristicDidChangeCallbacks = {};
        this._discoverTimeoutID = null;
        this._queue = Promise.resolve();
    }

    /**
     * Whether this browser can talk to Bluetooth devices.
     * @returns {boolean} true if the Web Bluetooth API is available.
     */
    static isSupported () {
        return typeof navigator !== 'undefined' &&
            typeof navigator.bluetooth !== 'undefined' &&
            navigator.bluetooth !== null;
    }

    /**
     * The reason why the Web Bluetooth API cannot be used, if that is the case.
     * @returns {string} an empty string when the API is available.
     */
    static getUnsupportedReason () {
        if (typeof window !== 'undefined' && window.isSecureContext === false) {
            return 'insecure-context';
        }
        if (!WebBluetoothSession.isSupported()) {
            return 'no-web-bluetooth';
        }
        return '';
    }

    /**
     * Ask the user to pick a Bluetooth device.
     *
     * This must be called from a user gesture (a click), otherwise the browser
     * refuses to show the device chooser.
     * @returns {Promise} resolved when the user picks a device.
     */
    requestPeripheral () {
        if (!WebBluetoothSession.isSupported()) {
            this._handleRequestError(new Error('Web Bluetooth is not available'));
            return Promise.resolve();
        }

        this._clearDiscoverTimeout();
        this._discoverTimeoutID = setTimeout(() => this._handleDiscoverTimeout(), DISCOVER_TIMEOUT);

        return navigator.bluetooth.requestDevice(this._buildRequestOptions())
            .then(device => {
                this._clearDiscoverTimeout();
                this._device = device;
                const peripheral = this._peripheralInfo(device);
                // Web Bluetooth only reports the device after the user picks it.
                // Emitting a list update here would make the auto-scanning UI try
                // to connect twice (once for the list and once for the pick).
                this._runtime.emit(
                    this._runtime.constructor.USER_PICKED_PERIPHERAL,
                    {
                        [peripheral.peripheralId]: peripheral
                    }
                );
                return device;
            })
            .catch(error => {
                this._clearDiscoverTimeout();
                // The user closed the device chooser: it is not an error, just
                // the end of the search.
                if (error && error.name === 'NotFoundError') {
                    this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
                    return null;
                }
                this._handleRequestError(error);
                return null;
            });
    }

    /**
     * Connect to the peripheral picked by the user.
     * @param {string} id - the id of the peripheral to connect to.
     * @returns {Promise} resolved when the peripheral is connected.
     */
    connectPeripheral (id) {
        const device = this._device;
        if (!device) {
            this._handleRequestError(new Error('No peripheral was picked'));
            return Promise.resolve();
        }

        return this._enqueue(() => {
            // The 'gattserverdisconnected' event is fired by the device.
            device.addEventListener('gattserverdisconnected', this._handleGattDisconnected);
            return device.gatt.connect();
        })
            .then(() => {
                this._connected = true;
                this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
                if (this._connectCallback) {
                    this._connectCallback();
                }
            })
            .catch(error => {
                this._handleRequestError(error);
            });
    }

    /**
     * Try to reconnect to the peripheral that was connected before.
     * @returns {Promise} resolved when the peripheral is connected again.
     */
    reconnect () {
        if (!this._device) {
            this._handleRequestError(new Error('There is no peripheral to reconnect to'));
            return Promise.resolve();
        }
        return this.connectPeripheral(this._peripheralInfo(this._device).peripheralId);
    }

    /**
     * Disconnect from the peripheral.
     */
    disconnect () {
        this._connected = false;
        this._clearDiscoverTimeout();

        const device = this._device;
        if (device) {
            device.removeEventListener('gattserverdisconnected', this._handleGattDisconnected);
        }
        if (device && typeof device.gatt.connected === 'boolean' && device.gatt.connected) {
            try {
                device.gatt.disconnect();
            } catch (e) {
                // The device may already be gone; nothing else to do.
            }
        }

        // Sets connection status icon to orange
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_DISCONNECTED);
    }

    /**
     * @returns {boolean} whether the peripheral is connected.
     */
    isConnected () {
        return this._connected;
    }

    /**
     * Read the value of a characteristic.
     * @param {string} serviceId - the UUID of the service to read.
     * @param {string} characteristicId - the UUID of the characteristic to read.
     * @param {boolean} [optStartNotifications] - whether to also start notifications.
     * @param {function} [onCharacteristicChanged] - callback for notifications.
     * @returns {Promise} resolved with the value of the characteristic.
     */
    read (serviceId, characteristicId, optStartNotifications = false, onCharacteristicChanged = null) {
        if (onCharacteristicChanged) {
            this._characteristicDidChangeCallbacks[characteristicId] = onCharacteristicChanged;
        }

        const readOperation = () => this._getCharacteristic(serviceId, characteristicId)
            .then(characteristic => characteristic.readValue());

        return this._enqueue(readOperation)
            .then(value => {
                if (optStartNotifications) {
                    return this.startNotifications(serviceId, characteristicId, onCharacteristicChanged);
                }
                return value;
            })
            .catch(error => {
                this.handleDisconnectError(error);
            });
    }

    /**
     * Write a value to a characteristic.
     * @param {string} serviceId - the UUID of the service to write.
     * @param {string} characteristicId - the UUID of the characteristic to write.
     * @param {string} message - the message to send, base64 encoded.
     * @param {string} [encoding] - the encoding of the message ('base64').
     * @param {boolean} [withResponse] - whether to wait for the peripheral's response.
     * @returns {Promise} resolved when the value has been written.
     */
    write (serviceId, characteristicId, message, encoding = null, withResponse = null) {
        const bytes = encoding === 'base64' ?
            Base64Util.base64ToUint8Array(message) :
            new Uint8Array(message);

        const writeOperation = () => this._getCharacteristic(serviceId, characteristicId)
            .then(characteristic => characteristic.writeValueWithResponse(bytes)
                .catch(() => characteristic.writeValue(bytes)));

        return this._enqueue(writeOperation)
            .catch(error => {
                this.handleDisconnectError(error);
            });
    }

    /**
     * Start receiving notifications of a characteristic.
     * @param {string} serviceId - the UUID of the service to listen to.
     * @param {string} characteristicId - the UUID of the characteristic to listen to.
     * @param {function} [onCharacteristicChanged] - callback for notifications.
     * @returns {Promise} resolved when the notifications are enabled.
     */
    startNotifications (serviceId, characteristicId, onCharacteristicChanged = null) {
        if (onCharacteristicChanged) {
            this._characteristicDidChangeCallbacks[characteristicId] = onCharacteristicChanged;
        }

        const notificationOperation = () => this._getCharacteristic(serviceId, characteristicId)
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', event => {
                    this._handleCharacteristicChanged(characteristicId, event);
                });
                return characteristic.startNotifications();
            });

        return this._enqueue(notificationOperation)
            .catch(error => {
                this.handleDisconnectError(error);
            });
    }

    /**
     * Stop receiving notifications of a characteristic.
     * @param {string} serviceId - the UUID of the service.
     * @param {string} characteristicId - the UUID of the characteristic.
     * @returns {Promise} resolved when the notifications are disabled.
     */
    stopNotifications (serviceId, characteristicId) {
        const stopOperation = () => this._getCharacteristic(serviceId, characteristicId)
            .then(characteristic => characteristic.stopNotifications());

        return this._enqueue(stopOperation)
            .catch(error => {
                this.handleDisconnectError(error);
            });
    }

    /**
     * Handle a lost connection to the peripheral.
     *
     * This could be due to:
     * - battery depletion
     * - going out of bluetooth range
     * - being powered down
     *
     * Disconnect, call the reset callback of the extension and emit an error.
     * @param {Error} [e] - the error that caused the disconnection.
     */
    handleDisconnectError (e) {
        if (!this._connected) return;

        log.error('Spark lost the Web Bluetooth connection', {
            extensionId: this._extensionId,
            error: e
        });

        this.disconnect();

        if (this._resetCallback) {
            this._resetCallback();
        }

        this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR, {
            message: 'Spark lost connection to',
            extensionId: this._extensionId
        });
    }

    /**
     * Handle an error while making a request to the peripheral.
     * @param {Error} [e] - the error.
     */
    _handleRequestError (e) {
        log.error('Web Bluetooth request failed', {
            extensionId: this._extensionId,
            error: e
        });
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
            message: 'Spark lost connection to',
            extensionId: this._extensionId
        });
    }

    /**
     * Handle the disconnection of the GATT server, which happens when the
     * peripheral is switched off or goes out of range.
     */
    _handleGattDisconnected = () => {
        this.handleDisconnectError(new Error('The GATT server disconnected'));
    };

    /**
     * Handle a change of the value of a characteristic.
     * @param {string} characteristicId - the UUID of the characteristic.
     * @param {Event} event - the event with the new value.
     */
    _handleCharacteristicChanged (characteristicId, event) {
        const callback = this._characteristicDidChangeCallbacks[characteristicId];
        if (!callback) return;

        const value = event.target.value;
        const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        callback(Base64Util.uint8ArrayToBase64(bytes));
    }

    /**
     * Handle the end of the time the user has to pick a peripheral.
     */
    _handleDiscoverTimeout () {
        this._clearDiscoverTimeout();
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }

    /**
     * Clear the timer that waits for the user to pick a peripheral.
     */
    _clearDiscoverTimeout () {
        if (this._discoverTimeoutID) {
            clearTimeout(this._discoverTimeoutID);
            this._discoverTimeoutID = null;
        }
    }

    /**
     * Get a characteristic of the connected peripheral.
     * @param {string} serviceId - the UUID of the service.
     * @param {string} characteristicId - the UUID of the characteristic.
     * @returns {Promise} resolved with the characteristic.
     */
    _getCharacteristic (serviceId, characteristicId) {
        if (!this._device || !this._device.gatt) {
            return Promise.reject(new Error('There is no peripheral connected'));
        }

        return this._device.gatt.getPrimaryService(serviceId)
            .then(service => service.getCharacteristic(characteristicId));
    }

    /**
     * Build the options of the device request.
     *
     * Every service used by the extension has to be listed in
     * `optionalServices`, otherwise the browser does not give access to it.
     * @returns {object} the options for `navigator.bluetooth.requestDevice`.
     */
    _buildRequestOptions () {
        const options = this._peripheralOptions || {};
        const filters = options.filters || [];
        const optionalServices = (options.optionalServices || []).slice();

        filters.forEach(filter => {
            (filter.services || []).forEach(service => {
                if (!optionalServices.includes(service)) {
                    optionalServices.push(service);
                }
            });
        });

        const requestOptions = {optionalServices};
        if (filters.length > 0) {
            requestOptions.filters = filters;
        }
        return requestOptions;
    }

    /**
     * Describe a device the way the interface expects it.
     * @param {object} device - the device picked by the user.
     * @returns {object} the information about the peripheral.
     */
    _peripheralInfo (device) {
        return {
            peripheralId: device.id || device.name || 'peripheral',
            name: device.name || 'LEGO WeDo 2.0',
            rssi: 0
        };
    }

    /**
     * Run an operation after all the previous ones have finished.
     *
     * The Web Bluetooth API does not allow overlapping GATT operations.
     * @param {function} operation - the operation to run.
     * @returns {Promise} resolved with the result of the operation.
     */
    _enqueue (operation) {
        const result = this._queue.then(operation, operation);
        // Keep the queue alive even when an operation fails.
        this._queue = result.catch(() => null);
        return result;
    }
}

module.exports = WebBluetoothSession;
