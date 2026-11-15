import React from 'react';
import {Provider} from 'react-redux';
import {IntlProvider} from 'react-intl';
import configureStore from 'redux-mock-store';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {LoadingState} from '../../../src/reducers/project-state';
import getProjectStore from '../../../src/lib/project-store-provider';
import ContinueProjectModal from '../../../src/containers/continue-project-modal.jsx';

jest.mock('../../../src/lib/project-store-provider', () => ({
    __esModule: true,
    default: jest.fn()
}));

describe('ContinueProjectModal', () => {
    const mockStore = configureStore();
    let store;

    const renderModal = () => render(
        <Provider store={store}>
            <IntlProvider locale="en">
                <ContinueProjectModal />
            </IntlProvider>
        </Provider>
    );

    beforeEach(() => {
        store = mockStore({
            scratchGui: {
                projectChanged: false,
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                }
            }
        });
        window.localStorage.clear();
        window.location.hash = '';
    });

    test('offers to continue when there is a saved last project', async () => {
        window.localStorage.setItem('spark.lastProjectId', 'local-123');
        getProjectStore.mockReturnValue({
            getEntry: () => Promise.resolve({id: 'local-123'})
        });

        renderModal();

        await waitFor(() => expect(
            screen.getByText('Continue where you left off?')
        ).not.toBeNull());
    });

    test('continue loads the last project', async () => {
        window.localStorage.setItem('spark.lastProjectId', 'local-123');
        getProjectStore.mockReturnValue({
            getEntry: () => Promise.resolve({id: 'local-123'})
        });

        renderModal();
        await waitFor(() => expect(
            screen.getByText('Continue where you left off?')
        ).not.toBeNull());

        fireEvent.click(screen.getByText('Continue'));
        const actions = store.getActions();
        expect(actions.some(action => action.projectId === 'local-123')).toBe(true);
    });

    test('new project dismisses the dialog without setting a project id', async () => {
        window.localStorage.setItem('spark.lastProjectId', 'local-123');
        getProjectStore.mockReturnValue({
            getEntry: () => Promise.resolve({id: 'local-123'})
        });

        renderModal();
        await waitFor(() => expect(
            screen.getByText('Continue where you left off?')
        ).not.toBeNull());

        fireEvent.click(screen.getByText('New project'));
        expect(store.getActions().some(action => action.projectId === 'local-123')).toBe(false);
        expect(screen.queryByText('Continue where you left off?')).toBeNull();
    });

    test('does not offer anything when there is no last project', () => {
        getProjectStore.mockReturnValue({
            getEntry: () => Promise.resolve(null)
        });

        renderModal();

        expect(screen.queryByText('Continue where you left off?')).toBeNull();
    });

    test('does not offer anything when the project already changed', () => {
        store = mockStore({
            scratchGui: {
                projectChanged: true,
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                }
            }
        });
        window.localStorage.setItem('spark.lastProjectId', 'local-123');
        getProjectStore.mockReturnValue({
            getEntry: () => Promise.resolve({id: 'local-123'})
        });

        renderModal();

        expect(screen.queryByText('Continue where you left off?')).toBeNull();
    });

    test('does not offer anything when a project is open by hash', () => {
        window.location.hash = '#local-456';
        window.localStorage.setItem('spark.lastProjectId', 'local-123');
        getProjectStore.mockReturnValue({
            getEntry: () => Promise.resolve({id: 'local-123'})
        });

        renderModal();

        expect(screen.queryByText('Continue where you left off?')).toBeNull();
    });

    afterEach(() => {
        cleanup();
    });
});
