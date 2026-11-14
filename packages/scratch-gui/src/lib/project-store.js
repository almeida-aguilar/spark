/**
 * Interfaz de almacenamiento de proyectos.
 *
 * Spark no tiene servidor: los proyectos se guardan en el navegador. Esta
 * interfaz permite que la aplicación no dependa de cómo se guardan, de modo
 * que en el futuro se pueda añadir otra implementación (por ejemplo, una
 * sincronizada con un servidor) sin reescribir la interfaz.
 *
 * Una implementación debe ofrecer estos métodos:
 *
 *  - load(id): devuelve una promesa con el proyecto guardado (o null si no
 *    existe).
 *  - save(id, projectData): guarda el proyecto y devuelve una promesa.
 *  - list(): devuelve una promesa con la lista de proyectos guardados
 *    (id, nombre y fecha de modificación).
 *  - remove(id): borra un proyecto guardado.
 */
class ProjectStore {
    /**
     * Load a saved project.
     * @param {string} id - the identifier of the project.
     * @returns {Promise.<object|null>} the saved project, or null.
     */
    load (id) { // eslint-disable-line no-unused-vars
        return Promise.reject(new Error('Not implemented'));
    }

    /**
     * Save a project.
     * @param {string} id - the identifier of the project.
     * @param {object} projectData - the data of the project.
     * @returns {Promise} resolved when the project is saved.
     */
    save (id, projectData) { // eslint-disable-line no-unused-vars
        return Promise.reject(new Error('Not implemented'));
    }

    /**
     * List the saved projects.
     * @returns {Promise.<Array>} the list of saved projects.
     */
    list () {
        return Promise.reject(new Error('Not implemented'));
    }

    /**
     * Remove a saved project.
     * @param {string} id - the identifier of the project.
     * @returns {Promise} resolved when the project is removed.
     */
    remove (id) { // eslint-disable-line no-unused-vars
        return Promise.reject(new Error('Not implemented'));
    }
}

export default ProjectStore;
