const DATABASE_NAME = 'spark-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'assets';

/**
 * Local storage for assets (costume images, sounds, etc.), backed by
 * IndexedDB. Assets are stored by their id (usually the md5 of their data).
 *
 * When IndexedDB is not available (for example, in some private browsing
 * modes), the assets are kept in memory, so the application keeps working
 * (they are lost when the page is closed).
 *
 * Scratch uploaded assets to an asset server; Spark keeps them in the
 * browser, next to the projects (see project-store-local.js).
 */

let databasePromise = null;

/**
 * Open the database, if it is possible.
 * @returns {Promise.<IDBDatabase|null>} the database, or null.
 */
const openDatabase = () => {
    if (databasePromise) return databasePromise;

    databasePromise = new Promise(resolve => {
        if (typeof indexedDB === 'undefined' || indexedDB === null) {
            resolve(null);
            return;
        }
        let request;
        try {
            request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        } catch (e) {
            resolve(null);
            return;
        }
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, {keyPath: 'id'});
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });

    return databasePromise;
};

/**
 * Run a function with a transaction of the assets store.
 * @param {string} mode - the mode of the transaction ('readonly' or 'readwrite').
 * @param {function} action - the action to run with the object store.
 * @returns {Promise} resolved with the result of the action, or null when
 *   IndexedDB is not available.
 */
const withStore = (mode, action) => openDatabase().then(database => {
    if (!database) return null;
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let result;
        try {
            result = action(store);
        } catch (e) {
            reject(e);
            return;
        }
        transaction.oncomplete = () => {
            // Un IDBRequest sin result (clave no encontrada) se convierte en
            // null: devolver el request crudo haría creer al llamador que hay
            // un dato.
            const value = result ? result.result : null;
            resolve(typeof value === 'undefined' ? null : value);
        };
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
});

/** Assets that could not be written to IndexedDB, by id. */
const memoryAssets = {};

/**
 * Store an asset.
 * @param {string|Uint8Array} data - the data of the asset.
 * @param {string} assetId - the id of the asset (usually the md5 of the data).
 * @param {string} dataFormat - the file format of the asset (png, wav, ...).
 * @param {string} assetTypeName - the name of the asset's type ('ImageVector',
 *   'ImageBitmap', 'Sound', ...).
 * @returns {Promise.<string>} a promise for the id of the stored asset.
 */
const storeAsset = (data, assetId, dataFormat, assetTypeName) => {
    const entry = {
        id: assetId,
        assetTypeName: assetTypeName,
        dataFormat: dataFormat,
        data: data
    };
    memoryAssets[assetId] = entry;
    return withStore('readwrite', store => store.put(entry))
        .catch(() => null)
        .then(() => assetId);
};

/**
 * Load an asset.
 * @param {string} assetId - the id of the asset.
 * @returns {Promise.<object|null>} a promise for the stored asset, or null.
 */
const loadAsset = assetId => withStore('readonly', store => store.get(assetId))
    .then(result => {
        if (result === null || typeof result === 'undefined') {
            return memoryAssets[assetId] || null;
        }
        return result;
    })
    .catch(() => memoryAssets[assetId] || null);

export {
    storeAsset,
    loadAsset
};
