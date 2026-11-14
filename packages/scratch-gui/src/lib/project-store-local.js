import ProjectStore from './project-store';

const DATABASE_NAME = 'spark-projects';
const DATABASE_VERSION = 1;
const STORE_NAME = 'projects';

/**
 * A project store that keeps the projects in the browser, using IndexedDB.
 *
 * When IndexedDB is not available (for example, in some private browsing
 * modes), the projects are kept in memory, so the application keeps working
 * (they are lost when the page is closed).
 */
class LocalProjectStore extends ProjectStore {
    constructor () {
        super();
        this._memory = {};
        this._database = null;
        this._databasePromise = null;
    }

    /**
     * Open the database, if it is possible.
     * @returns {Promise.<IDBDatabase|null>} the database, or null.
     * @private
     */
    _openDatabase () {
        if (this._databasePromise) return this._databasePromise;

        this._databasePromise = new Promise(resolve => {
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
            request.onsuccess = () => {
                this._database = request.result;
                resolve(this._database);
            };
            request.onerror = () => resolve(null);
        });

        return this._databasePromise;
    }

    /**
     * Run a function with a transaction of the projects store.
     * @param {string} mode - the mode of the transaction ('readonly' or 'readwrite').
     * @param {function} action - the action to run with the object store.
     * @returns {Promise} resolved with the result of the action.
     * @private
     */
    _withStore (mode, action) {
        return this._openDatabase().then(database => {
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
                transaction.oncomplete = () => resolve(
                    result && typeof result.result !== 'undefined' ? result.result : result
                );
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(transaction.error);
            });
        });
    }

    /**
     * Load a saved project.
     * @param {string} id - the identifier of the project.
     * @returns {Promise.<object|null>} the saved project, or null.
     */
    load (id) {
        return this.getEntry(id).then(entry => (
            entry === null || typeof entry === 'undefined' ?
                null : entry.projectData
        ));
    }

    /**
     * Load the full entry of a saved project (id, title, data and date).
     * @param {string} id - the identifier of the project.
     * @returns {Promise.<object|null>} the entry, or null.
     */
    getEntry (id) {
        return this._withStore('readonly', store => store.get(id))
            .then(result => {
                if (result === null || typeof result === 'undefined') {
                    return this._memory[id] || null;
                }
                return result;
            })
            .catch(() => this._memory[id] || null);
    }

    /**
     * Save a project.
     * @param {string|null} id - the identifier of the project; when null, a
     *   new id is generated (for example, when saving a new project or a copy).
     * @param {object} projectData - the data of the project.
     * @param {string} [title] - the title of the project.
     * @returns {Promise.<{id: string}>} resolved with the saved entry.
     */
    save (id, projectData, title = '') {
        const entry = {
            id: id || `local-${Date.now().toString(36)}-${
                Math.random()
                    .toString(36)
                    .slice(2, 8)
            }`,
            title: title,
            projectData: projectData,
            modified: Date.now()
        };
        this._memory[id] = entry;
        return this._withStore('readwrite', store => store.put(entry))
            .catch(() => null)
            .then(() => entry);
    }

    /**
     * List the saved projects.
     * @returns {Promise.<Array>} the list of saved projects.
     */
    list () {
        return this._withStore('readonly', store => store.getAll())
            .then(result => {
                if (!result) {
                    return Object.keys(this._memory).map(id => this._memory[id]);
                }
                return result;
            })
            .catch(() => Object.keys(this._memory).map(id => this._memory[id]));
    }

    /**
     * Remove a saved project.
     * @param {string} id - the identifier of the project.
     * @returns {Promise} resolved when the project is removed.
     */
    remove (id) {
        delete this._memory[id];
        return this._withStore('readwrite', store => store.delete(id))
            .catch(() => null)
            .then(() => null);
    }
}

export default LocalProjectStore;
