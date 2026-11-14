import React from 'react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import MenuBar from '../../../src/components/menu-bar/menu-bar';
import {menuInitialState} from '../../../src/reducers/menus';
import {LoadingState} from '../../../src/reducers/project-state';
import {DEFAULT_MODE} from '../../../src/lib/settings/color-mode';
import {fireEvent} from '@testing-library/react';

import {PLATFORM} from '../../../src/lib/platform';

import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import VM from '@scratch/scratch-vm';
import {MenuRefProvider} from '../../../src/contexts/menu-ref-context.jsx';

describe('MenuBar Component', () => {
    const store = configureStore()({
        locales: {
            isRtl: false,
            locale: 'en-US'
        },
        scratchGui: {
            menus: menuInitialState,
            projectState: {
                loadingState: LoadingState.NOT_LOADED
            },
            settings: {
                colorMode: DEFAULT_MODE
            },
            timeTravel: {
                year: 'NOW'
            },
            vm: new VM(),
            platform: {
                platform: PLATFORM.WEB
            }
        }
    });

    const getComponent = function (props = {}) {
        return (<Provider store={store}>
            <MenuRefProvider>
                <MenuBar {...props} />
            </MenuRefProvider>
        </Provider>);
    };

    // SPARK: el botón de "About Spark" es fijo: no depende de un manejador
    // externo, siempre está en el menú y abre el diálogo propio.
    test('menu bar has an About Spark button', () => {
        const {container} = renderWithIntl(getComponent());
        const button = Array.from(container.querySelectorAll('button'))
            .find(b => b.textContent.includes('About Spark'));
        expect(button).toBeTruthy();
    });

    describe('triggering About button handler', () => {
        test('clicking on About button opens the About Spark dialog', () => {
            const onClickAbout = jest.fn();
            const {container} = renderWithIntl(getComponent({onClickAbout}));
            const button = Array.from(container.querySelectorAll('button'))
                .find(b => b.textContent.includes('About Spark'));

            fireEvent.click(button);
            // SPARK: abre el diálogo propio; no se usa el manejador externo.
            // (react-modal lo monta fuera del contenedor, en document.body)
            const modal = document.querySelector('.scratch-editor-modal');
            expect(modal).toBeTruthy();
            expect(onClickAbout).not.toHaveBeenCalled();
        });
    
        test('not clicking on About button does not call the handler', () => {
            const onClickAbout = jest.fn();
            const {container} = renderWithIntl(getComponent({onClickAbout}));
            const button = container.querySelector('button[aria-label="About menu"]');
    
            expect(onClickAbout).toHaveBeenCalledTimes(0);
        });
    });
});
