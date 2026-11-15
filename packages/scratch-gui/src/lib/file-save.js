import downloadBlob from './download-blob';

/**
 * SPARK: guardado de archivos en el ordenador.
 *
 * En Chromium se usa la File System Access API: la primera vez se pide el
 * archivo con un selector y después se guarda sobre el mismo archivo; en el
 * resto de navegadores (o si el usuario cancela el selector) se recurre a
 * la descarga clásica.
 *
 * El handle del archivo se recuerda durante la sesión; al recargar la
 * página se volverá a pedir el archivo.
 */
let lastFileHandle = null;

const supportsFileSystemAccess = () =>
    typeof window !== 'undefined' &&
    typeof window.showSaveFilePicker === 'function';

/**
 * Check whether the stored handle can be written to without a new prompt.
 * @param {FileSystemFileHandle} handle - the remembered file handle.
 * @returns {Promise.<boolean>} true when the handle is granted for writing.
 */
const isWritable = handle => {
    if (!handle.queryPermission) return Promise.resolve(false);
    return handle.queryPermission({mode: 'readwrite'})
        .then(permission => permission === 'granted')
        .catch(() => false);
};

/**
 * Write the blob into a file through a file handle.
 * @param {FileSystemFileHandle} handle - the target file.
 * @param {Blob} blob - the content to write.
 * @returns {Promise} resolved when the write is complete.
 */
const writeFile = (handle, blob) =>
    handle.createWritable().then(writable => blob.stream().pipeTo(writable));

/**
 * Save a blob as a file on the user's computer.
 * @param {string} filename - the suggested file name for the first save.
 * @param {Blob} blob - the content to save.
 * @returns {Promise} resolved when the content is saved or downloaded.
 */
const saveFile = (filename, blob) => {
    if (!supportsFileSystemAccess()) {
        return Promise.resolve(downloadBlob(filename, blob));
    }
    const pick = lastFileHandle ?
        Promise.resolve(lastFileHandle) :
        window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: 'Scratch 3 project',
                accept: {'application/x.scratch.sb3': ['.sb3']}
            }]
        });
    return pick
        .then(handle => isWritable(handle).then(granted => {
            if (!granted) {
                return downloadBlob(filename, blob);
            }
            lastFileHandle = handle;
            return writeFile(handle, blob);
        }))
        .catch(err => {
            if (err && err.name === 'AbortError') {
                // El usuario canceló el selector; no se descarga nada.
                return;
            }
            lastFileHandle = null;
            return downloadBlob(filename, blob);
        });
};

/**
 * Olvida el archivo recordado, para que el próximo guardado vuelva a pedir
 * el destino. Usada en las pruebas.
 */
export const forgetSavedFile = () => {
    lastFileHandle = null;
};

export default saveFile;
