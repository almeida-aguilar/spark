// SPARK: nombres de las extensiones que Spark no soporta, para poder avisar al
// usuario con un nombre legible en lugar del identificador interno.
const unsupportedExtensionNames = {
    microbit: 'micro:bit',
    makeymakey: 'Makey Makey',
    gdxfor: 'Go Direct Force & Acceleration',
    ev3: 'LEGO MINDSTORMS EV3',
    boost: 'LEGO BOOST',
    text2speech: 'Text to Speech',
    translate: 'Translate',
    faceSensing: 'Face Sensing'
};

/**
 * Get the readable names of the extensions that Spark does not support.
 * @param {Array.<string>} extensionIDs - the IDs of the unsupported extensions.
 * @returns {string} the names, separated by commas.
 */
const getUnsupportedExtensionNames = extensionIDs => (
    extensionIDs
        .map(id => unsupportedExtensionNames[id] || id)
        .join(', ')
);

export {
    getUnsupportedExtensionNames,
    unsupportedExtensionNames
};
