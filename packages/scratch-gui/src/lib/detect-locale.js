/**
 * @file
 * Utility function to detect locale from the browser setting or parameter on the URL.
 */

import queryString from 'query-string';

// SPARK: idioma recordado por el usuario (fase 7)
const LOCALE_STORAGE_KEY = 'spark:locale';

const getPersistedLocale = supportedLocales => {
    try {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored && supportedLocales.includes(stored)) return stored;
    } catch (e) {
        // localStorage no disponible (p. ej. navegación privada con restricciones)
    }
    return null;
};

const setPersistedLocale = locale => {
    try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (e) {
        // ignorar si no se puede persistir
    }
};

/**
 * look for language setting in the browser. Check against supported locales.
 * If there's a parameter in the URL, override the browser setting
 * @param {Array.string} supportedLocales An array of supported locale codes.
 * @returns {string} the preferred locale
 */
const detectLocale = supportedLocales => {
    let locale = 'en'; // default
    let browserLocale = window.navigator.userLanguage || window.navigator.language;
    browserLocale = browserLocale.toLowerCase();
    // try to set locale from browserLocale
    if (supportedLocales.includes(browserLocale)) {
        locale = browserLocale;
    } else {
        browserLocale = browserLocale.split('-')[0];
        if (supportedLocales.includes(browserLocale)) {
            locale = browserLocale;
        }
    }

    const queryParams = queryString.parse(location.search);
    // Flatten potential arrays and remove falsy values
    const potentialLocales = [].concat(queryParams.locale, queryParams.lang).filter(l => l);
    if (!potentialLocales.length) {
        return locale;
    }

    const urlLocale = potentialLocales[0].toLowerCase();
    if (supportedLocales.includes(urlLocale)) {
        return urlLocale;
    }

    return locale;
};

/**
 * Devuelve el idioma inicial: preferencia guardada, si no la detección del
 * navegador/URL.
 * @param {Array.string} supportedLocales
 * @returns {string}
 */
const getInitialLocale = supportedLocales => {
    const persisted = getPersistedLocale(supportedLocales);
    if (persisted) return persisted;
    return detectLocale(supportedLocales);
};

export {
    detectLocale,
    getInitialLocale,
    getPersistedLocale,
    setPersistedLocale,
    LOCALE_STORAGE_KEY
};
