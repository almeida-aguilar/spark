// SPARK: carga diferida de mensajes por idioma (fase 7). Evita importar el
// bundle monolítico editor-msgs de scratch-l10n en el arranque.
import {getSparkMessages} from './spark-messages';

const loaded = {};

/**
 * Carga y combina los mensajes del editor para un locale (interfaz,
// extensiones, editor de pintura y bloques) junto con las cadenas propias de
 * Spark. El resultado se cachea en memoria.
 * @param {string} locale
 * @returns {Promise<object>}
 */
const loadLocaleMessages = async locale => {
    if (loaded[locale]) return loaded[locale];

    // Los JSON por locale se resuelven desde scratch-l10n; webpack genera chunks
    // separados por idioma para no inflar el bundle inicial.
    const [iface, extensions, paint, blocks] = await Promise.all([
        import(/* webpackChunkName: "locale-interface-[request]" */ `scratch-l10n/editor/interface/${locale}.json`),
        import(/* webpackChunkName: "locale-extensions-[request]" */ `scratch-l10n/editor/extensions/${locale}.json`),
        import(/* webpackChunkName: "locale-paint-[request]" */ `scratch-l10n/editor/paint-editor/${locale}.json`),
        import(/* webpackChunkName: "locale-blocks-[request]" */ `scratch-l10n/editor/blocks/${locale}.json`)
    ]);

    const normalize = mod => (mod && mod.default) ? mod.default : mod;

    // Las cadenas de Spark se mezclan al final; para idiomas sin traducción
    // propia getSparkMessages incluye el retroceso a inglés.
    const messages = Object.assign(
        {},
        normalize(iface),
        normalize(extensions),
        normalize(paint),
        normalize(blocks),
        getSparkMessages(locale)
    );

    loaded[locale] = messages;
    return messages;
};

const isLocaleLoaded = locale => Object.prototype.hasOwnProperty.call(loaded, locale);

const getLoadedMessages = locale => loaded[locale];

export {loadLocaleMessages, isLocaleLoaded, getLoadedMessages};
