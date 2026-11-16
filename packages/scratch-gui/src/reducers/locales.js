import {isRtl} from 'scratch-l10n';

const UPDATE_LOCALES = 'scratch-gui/locales/UPDATE_LOCALES';
const SELECT_LOCALE = 'scratch-gui/locales/SELECT_LOCALE';
const ADD_LOCALE_MESSAGES = 'scratch-gui/locales/ADD_LOCALE_MESSAGES'; // SPARK: carga diferida

const initialState = {
    isRtl: false,
    locale: 'en',
    // SPARK: los mensajes se cargan por idioma bajo demanda (fase 7)
    messagesByLocale: {},
    messages: {}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SELECT_LOCALE: {
        const messages = state.messagesByLocale[action.locale] || state.messages;
        return Object.assign({}, state, {
            isRtl: isRtl(action.locale),
            locale: action.locale,
            messagesByLocale: state.messagesByLocale,
            messages: messages
        });
    }
    case UPDATE_LOCALES:
        return Object.assign({}, state, {
            isRtl: state.isRtl,
            locale: state.locale,
            messagesByLocale: action.messagesByLocale,
            messages: action.messagesByLocale[state.locale] || state.messages
        });
    case ADD_LOCALE_MESSAGES: {
        const messagesByLocale = Object.assign({}, state.messagesByLocale, {
            [action.locale]: action.messages
        });
        return Object.assign({}, state, {
            messagesByLocale: messagesByLocale,
            messages: state.locale === action.locale ? action.messages : state.messages
        });
    }
    default:
        return state;
    }
};

const selectLocale = function (locale) {
    return {
        type: SELECT_LOCALE,
        locale: locale
    };
};

const setLocales = function (localesMessages) {
    return {
        type: UPDATE_LOCALES,
        messagesByLocale: localesMessages
    };
};

const addLocaleMessages = function (locale, messages) {
    return {
        type: ADD_LOCALE_MESSAGES,
        locale: locale,
        messages: messages
    };
};

const initLocale = function (currentState, locale) {
    const messages = currentState.messagesByLocale[locale] || currentState.messages;
    return Object.assign(
        {},
        currentState,
        {
            isRtl: isRtl(locale),
            locale: locale,
            messagesByLocale: currentState.messagesByLocale,
            messages: messages
        }
    );
};
export {
    reducer as default,
    initialState as localesInitialState,
    initLocale,
    selectLocale,
    setLocales,
    addLocaleMessages
};
