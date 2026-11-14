import LocalProjectStore from './project-store-local';

let store = null;

/**
 * Get the store used to save the projects.
 *
 * Spark only has the local implementation: everything is kept in the browser.
 * The indirection makes it possible to add another implementation (a server,
 * for instance) without changing the code that uses the store.
 * @returns {ProjectStore} the project store.
 */
const getProjectStore = () => {
    if (!store) {
        store = new LocalProjectStore();
    }
    return store;
};

export default getProjectStore;
