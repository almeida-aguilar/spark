import {createStore, combineReducers, compose, Store} from 'redux';
import localesReducer, {initLocale, localesInitialState, addLocaleMessages} from '../reducers/locales';
import locales, {isRtl} from 'scratch-l10n';
import {getInitialLocale} from './detect-locale';
import {GUIConfig} from '../gui-config';
import log from './log.js';
import {loadLocaleMessages} from './spark-l10n/locale-loader';

interface WindowWithDevtools {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
}

const composeEnhancers = (window as WindowWithDevtools).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// TypeScript doesn't know about require here, and we don't want to change behavior, so...
declare function require (path: '../reducers/gui'): typeof import('../reducers/gui');
declare function require (path: '@scratch/scratch-paint'): typeof import('@scratch/scratch-paint');
declare function require (path: '../legacy-config'): typeof import('../legacy-config');

export interface EditorStateParams {
    localesOnly?: boolean;
    isFullScreen?: boolean;
    isPlayerOnly?: boolean;
    showTelemetryModal?: boolean;
    isEmbedded?: boolean;
    locale?: string;
}

/**
 * Manages an editor's Redux state.
 *
 * To be used in tandem with an AppStateHOC component to be provided to the editor.
 */
export class EditorState {
    /**
     * The redux store that this class wraps.
     */
    public readonly store: Store<unknown>;

    constructor (params: EditorStateParams, configFactory: () => GUIConfig) {
        let initialState = {};
        let reducers = {};
        let enhancer;

        let initializedLocales = localesInitialState;

        let locale = 'en';
        const supportedLocaleCodes = Object.keys(locales);
        if (params.locale) {
            if (supportedLocaleCodes.includes(params.locale)) {
                locale = params.locale;
            } else {
                log.warn(`Unsupported locale ${params.locale}, falling back to en`);
            }
        } else {
            locale = getInitialLocale(supportedLocaleCodes);
        }

        if (locale !== 'en') {
            initializedLocales = initLocale(initializedLocales, locale);
        }

        // SPARK: aplica lang/dir inicial (fase 7, RTL)
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
            document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
        }

        if (params.localesOnly) {
            // Used for instantiating minimal state for the unsupported
            // browser modal
            reducers = {locales: localesReducer};
            initialState = {locales: initializedLocales};
            enhancer = composeEnhancers();
        } else {
            // You are right, this is gross. But it's necessary to avoid
            // importing unneeded code that will crash unsupported browsers.
            const guiRedux = require('../reducers/gui');
            const guiReducer = guiRedux.default;
            const {
                buildGuiMiddleware,
                buildInitialState,
                initFullScreen,
                initPlayer,
                initTelemetryModal,
                initEmbedded
            } = guiRedux;
            const {ScratchPaintReducer} = require('@scratch/scratch-paint');

            const configOrLegacy = configFactory ?
                configFactory() :
                require('../legacy-config').legacyConfig;

            let initializedGui = buildInitialState(configOrLegacy);
            if (params.isFullScreen || params.isPlayerOnly || params.isEmbedded) {
                if (params.isFullScreen) {
                    initializedGui = initFullScreen(initializedGui);
                }
                if (params.isPlayerOnly) {
                    initializedGui = initPlayer(initializedGui);
                }
                if (params.isEmbedded) {
                    initializedGui = initEmbedded(initializedGui);
                }
            } else if (params.showTelemetryModal) {
                initializedGui = initTelemetryModal(initializedGui);
            }
            reducers = {
                locales: localesReducer,
                scratchGui: guiReducer,
                scratchPaint: ScratchPaintReducer
            };
            initialState = {
                locales: initializedLocales,
                scratchGui: initializedGui
            };
            enhancer = composeEnhancers(buildGuiMiddleware());
        }
        const reducer = combineReducers(reducers);
        this.store = createStore(reducer, initialState, enhancer);

        // SPARK: carga diferida del idioma inicial (fase 7)
        loadLocaleMessages(locale).then(messages => {
            this.store.dispatch(addLocaleMessages(locale, messages));
        }).catch(err => {
            log.error(`Could not load locale ${locale}`, err);
        });
    }

    dispatch (action) {
        this.store.dispatch(action);
    }
}
