const test = require('tap').test;
const Runtime = require('../../src/engine/runtime');
const WebBluetoothSession = require('../../src/io/web-bluetooth-session');
const Base64Util = require('../../src/util/base64-util');

const DEVICE_SERVICE = '00001523-1212-efde-1523-785feabcd123';
const IO_SERVICE = '00004f0e-1212-efde-1523-785feabcd123';
const INPUT_VALUES = '00001560-1212-efde-1523-785feabcd123';

/**
 * Build a mock of a GATT characteristic.
 * @param {Uint8Array} value - the value of the characteristic.
 * @returns {object} the mock characteristic.
 */
const makeCharacteristic = value => {
    const listeners = {};
    const characteristic = {
        value: new DataView(value.buffer, value.byteOffset, value.byteLength),
        startNotifications: () => Promise.resolve(),
        stopNotifications: () => Promise.resolve(),
        readValue: () => Promise.resolve(
            new DataView(value.buffer, value.byteOffset, value.byteLength)
        ),
        writeValue: written => {
            characteristic.written = new Uint8Array(written);
            return Promise.resolve();
        },
        writeValueWithResponse: written => {
            characteristic.written = new Uint8Array(written);
            return Promise.resolve();
        },
        addEventListener: (type, handler) => {
            listeners[type] = handler;
        },
        removeEventListener: type => {
            delete listeners[type];
        },
        emit: (type, event) => {
            if (listeners[type]) listeners[type](event);
        },
        written: null
    };
    return characteristic;
};

/**
 * Build a mock of a GATT service.
 * @param {object} characteristics - the characteristics of the service.
 * @returns {object} the mock service.
 */
const makeService = characteristics => ({
    getCharacteristic: uuid => {
        if (!characteristics[uuid]) {
            return Promise.reject(new Error(`Unknown characteristic ${uuid}`));
        }
        return Promise.resolve(characteristics[uuid]);
    }
});

/**
 * Build a mock of a Bluetooth device with its GATT server.
 * @param {object} options - the options of the device.
 * @returns {object} the mock device.
 */
const makeDevice = (options = {}) => {
    const characteristics = options.characteristics || {};
    const listeners = {};
    const device = {
        id: options.id || 'device-1',
        name: options.name || 'WeDo 2.0',
        gatt: {
            connected: false,
            connect: () => {
                device.gatt.connected = true;
                return Promise.resolve();
            },
            disconnect: () => {
                device.gatt.connected = false;
            },
            getPrimaryService: uuid => {
                if (uuid !== DEVICE_SERVICE && uuid !== IO_SERVICE) {
                    return Promise.reject(new Error(`Unknown service ${uuid}`));
                }
                return Promise.resolve(makeService(characteristics[uuid] || {}));
            }
        },
        addEventListener: (type, handler) => {
            listeners[type] = handler;
        },
        removeEventListener: type => {
            delete listeners[type];
        },
        emit: type => {
            if (listeners[type]) listeners[type]();
        }
    };
    return device;
};

/**
 * Install a mock of navigator.bluetooth.
 * @param {object} options - the options of the mock.
 * @returns {object} the mock.
 */
const mockBluetooth = (options = {}) => {
    const mock = {
        requestDevice: options.requestDevice || (() => Promise.resolve(makeDevice(options))),
        getAvailability: () => Promise.resolve(true)
    };
    global.navigator.bluetooth = mock;
    return mock;
};

const restoreBluetooth = () => {
    if (global.navigator) {
        delete global.navigator.bluetooth;
    }
};

test('Web Bluetooth is not supported when the browser has no navigator.bluetooth', t => {
    restoreBluetooth();
    t.equal(WebBluetoothSession.isSupported(), false);
    t.equal(WebBluetoothSession.getUnsupportedReason(), 'no-web-bluetooth');
    t.end();
});

test('Web Bluetooth is supported when the browser has navigator.bluetooth', t => {
    mockBluetooth();
    t.equal(WebBluetoothSession.isSupported(), true);
    t.equal(WebBluetoothSession.getUnsupportedReason(), '');
    restoreBluetooth();
    t.end();
});

test('requesting a peripheral asks the browser for a device and reports the picked one', async t => {
    const device = makeDevice();
    const requested = [];
    mockBluetooth({
        requestDevice: options => {
            requested.push(options);
            return Promise.resolve(device);
        }
    });

    const runtime = new Runtime();
    const events = [];
    runtime.on('PERIPHERAL_LIST_UPDATE', peripherals => events.push(['list', peripherals]));
    runtime.on('USER_PICKED_PERIPHERAL', peripherals => events.push(['picked', peripherals]));

    const session = new WebBluetoothSession(
        runtime,
        'wedo2',
        {
            filters: [{services: [DEVICE_SERVICE]}],
            optionalServices: [IO_SERVICE]
        },
        () => {}
    );

    await session.requestPeripheral();

    // All the services used by the extension have to be in optionalServices,
    // otherwise the browser does not give access to them.
    t.same(requested[0].optionalServices.sort(), [DEVICE_SERVICE, IO_SERVICE].sort());
    t.same(requested[0].filters, [{services: [DEVICE_SERVICE]}]);

    // Emitting both a list update and a pick would make the auto-scanning UI
    // connect to the same device twice.
    t.equal(events.length, 1, 'only the picked peripheral is reported');
    t.equal(events[0][0], 'picked');
    t.equal(events[0][1][device.id].name, 'WeDo 2.0');
    t.equal(events[0][1][device.id].peripheralId, device.id);
    restoreBluetooth();
});

test('the user closing the device chooser is not an error', async t => {
    const error = new Error('no device');
    error.name = 'NotFoundError';
    mockBluetooth({requestDevice: () => Promise.reject(error)});

    const runtime = new Runtime();
    const events = [];
    runtime.on('PERIPHERAL_SCAN_TIMEOUT', () => events.push('timeout'));
    runtime.on('PERIPHERAL_REQUEST_ERROR', () => events.push('error'));

    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();

    t.same(events, ['timeout']);
    restoreBluetooth();
});

test('a failure while asking for the device is reported as a request error', async t => {
    mockBluetooth({requestDevice: () => Promise.reject(new Error('boom'))});

    const runtime = new Runtime();
    const events = [];
    runtime.on('PERIPHERAL_REQUEST_ERROR', data => events.push(data));

    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();

    t.equal(events.length, 1);
    t.equal(events[0].extensionId, 'wedo2');
    restoreBluetooth();
});

test('connecting to the peripheral reports the connection and calls back', async t => {
    const device = makeDevice();
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const events = [];
    runtime.on('PERIPHERAL_CONNECTED', () => events.push('connected'));

    let connected = false;
    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {
        connected = true;
    });

    await session.requestPeripheral();
    await session.connectPeripheral(device.id);

    t.equal(session.isConnected(), true);
    t.equal(connected, true, 'the connect callback is called');
    t.same(events, ['connected']);
    restoreBluetooth();
});

test('writing converts the base64 message into bytes', async t => {
    const characteristic = makeCharacteristic(new Uint8Array([1, 2, 3]));
    const device = makeDevice({
        characteristics: {[IO_SERVICE]: {[INPUT_VALUES]: characteristic}}
    });
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();
    await session.connectPeripheral(device.id);

    await session.write(IO_SERVICE, INPUT_VALUES, Base64Util.uint8ArrayToBase64(new Uint8Array([10, 20])), 'base64');

    t.same(Array.from(characteristic.written), [10, 20]);
    restoreBluetooth();
});

test('notifications are given to the callback as base64', async t => {
    const characteristic = makeCharacteristic(new Uint8Array([0, 0]));
    const device = makeDevice({
        characteristics: {[IO_SERVICE]: {[INPUT_VALUES]: characteristic}}
    });
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();
    await session.connectPeripheral(device.id);

    const received = [];
    await session.startNotifications(IO_SERVICE, INPUT_VALUES, message => received.push(message));

    characteristic.value = new DataView(new Uint8Array([7, 8, 9]).buffer);
    // In the Web Bluetooth API the target of the event is the characteristic.
    characteristic.emit('characteristicvaluechanged', {target: characteristic});

    t.equal(received.length, 1);
    t.same(Array.from(Base64Util.base64ToUint8Array(received[0])), [7, 8, 9]);
    restoreBluetooth();
});

test('reading a characteristic returns its value', async t => {
    const characteristic = makeCharacteristic(new Uint8Array([4, 5]));
    const device = makeDevice({
        characteristics: {[IO_SERVICE]: {[INPUT_VALUES]: characteristic}}
    });
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();
    await session.connectPeripheral(device.id);

    const value = await session.read(IO_SERVICE, INPUT_VALUES);
    t.same(Array.from(new Uint8Array(value.buffer)), [4, 5]);
    restoreBluetooth();
});

test('the GATT operations do not overlap', async t => {
    let running = 0;
    let overlapped = false;
    const characteristic = makeCharacteristic(new Uint8Array([0]));
    const slowWrite = () => {
        running++;
        if (running > 1) overlapped = true;
        return new Promise(resolve => setTimeout(() => {
            running--;
            resolve();
        }, 10));
    };
    characteristic.writeValue = slowWrite;
    characteristic.writeValueWithResponse = slowWrite;

    const device = makeDevice({
        characteristics: {[IO_SERVICE]: {[INPUT_VALUES]: characteristic}}
    });
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();
    await session.connectPeripheral(device.id);

    await Promise.all([
        session.write(IO_SERVICE, INPUT_VALUES, Base64Util.uint8ArrayToBase64(new Uint8Array([1])), 'base64'),
        session.write(IO_SERVICE, INPUT_VALUES, Base64Util.uint8ArrayToBase64(new Uint8Array([2])), 'base64'),
        session.write(IO_SERVICE, INPUT_VALUES, Base64Util.uint8ArrayToBase64(new Uint8Array([3])), 'base64')
    ]);

    t.equal(overlapped, false, 'the writes are serialized');
    restoreBluetooth();
});

test('losing the GATT server disconnects the peripheral and reports it', async t => {
    const device = makeDevice();
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const events = [];
    runtime.on('PERIPHERAL_DISCONNECTED', () => events.push('disconnected'));
    runtime.on('PERIPHERAL_CONNECTION_LOST_ERROR', data => events.push(['lost', data.extensionId]));

    let reset = false;
    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {}, () => {
        reset = true;
    });
    await session.requestPeripheral();
    await session.connectPeripheral(device.id);

    device.emit('gattserverdisconnected');

    t.equal(session.isConnected(), false);
    t.equal(reset, true, 'the reset callback is called');
    t.same(events, ['disconnected', ['lost', 'wedo2']]);
    restoreBluetooth();
});

test('reconnecting connects to the same peripheral', async t => {
    const device = makeDevice();
    mockBluetooth({requestDevice: () => Promise.resolve(device)});

    const runtime = new Runtime();
    const events = [];
    runtime.on('PERIPHERAL_CONNECTED', () => events.push('connected'));

    const session = new WebBluetoothSession(runtime, 'wedo2', {}, () => {});
    await session.requestPeripheral();
    await session.connectPeripheral(device.id);
    session.disconnect();

    await session.reconnect();

    t.equal(session.isConnected(), true);
    t.same(events, ['connected', 'connected']);
    restoreBluetooth();
});
