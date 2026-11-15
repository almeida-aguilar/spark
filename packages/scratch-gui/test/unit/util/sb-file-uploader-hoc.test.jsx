import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from '@scratch/scratch-vm';
import {fireEvent} from '@testing-library/react';

import SBFileUploaderHOC from '../../../src/lib/sb-file-uploader-hoc.jsx';
import {IntlProvider} from 'react-intl';

describe('SBFileUploaderHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        const Component = () => <div />;
        return SBFileUploaderHOC(Component);
    };

    const unwrappedInstance = () => {
        const WrappedComponent = getContainer();
        // default starting state: looking at a project you created, not logged in
        const wrapper = renderWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                requestProjectUpload={jest.fn()}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
                store={store}
            />
        );
        return wrapper;
    };

    beforeEach(() => {
        vm = new VM();
        store = mockStore({
            scratchGui: {
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                },
                vm: {}
            },
            locales: {
                locale: 'en'
            }
        });
    });

    test('if isLoadingUpload becomes true, without fileToUpload set, will call cancelFileUpload', () => {
        const mockedCancelFileUpload = jest.fn();
        const WrappedComponent = getContainer();
        const {rerender} = renderWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    projectChanged
                    canSave={false}
                    cancelFileUpload={mockedCancelFileUpload}
                    closeFileMenu={jest.fn()}
                    isLoadingUpload
                    requestProjectUpload={jest.fn()}
                    store={store}
                    userOwnsProject={false}
                    vm={vm}
                    onLoadingFinished={jest.fn()}
                    onLoadingStarted={jest.fn()}
                    onUpdateProjectTitle={jest.fn()}
                />
            </IntlProvider>
        );
        expect(mockedCancelFileUpload).toHaveBeenCalled();
    });

    test('files larger than the limit are rejected before reading', () => {
        const mockedCancelFileUpload = jest.fn();
        const mockedAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
        const captured = {};
        const Component = props => {
            captured.onStartSelectingFileUpload = props.onStartSelectingFileUpload;
            return <div />;
        };
        const WrappedComponent = SBFileUploaderHOC(Component);
        const {rerender} = renderWithIntl(
            <WrappedComponent
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                isShowingWithoutId
                loadingState={LoadingState.SHOWING_WITHOUT_ID}
                projectChanged={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );

        // Open the file chooser and pick an oversized file
        captured.onStartSelectingFileUpload();
        const input = document.querySelector('input[type=file]');
        expect(input).not.toBeNull();
        const oversizedFile = {name: 'big.sb3', size: 501 * 1024 * 1024};
        Object.defineProperty(input, 'files', {value: [oversizedFile]});
        fireEvent(input, new Event('change'));

        // The upload state is entered; then the file is rejected before reading
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    canSave={false}
                    cancelFileUpload={mockedCancelFileUpload}
                    closeFileMenu={jest.fn()}
                    isLoadingUpload
                    isShowingWithoutId
                    loadingState={LoadingState.LOADING_VM_FILE_UPLOAD}
                    projectChanged={false}
                    requestProjectUpload={jest.fn()}
                    store={store}
                    userOwnsProject={false}
                    vm={vm}
                    onLoadingFinished={jest.fn()}
                    onLoadingStarted={jest.fn()}
                    onUpdateProjectTitle={jest.fn()}
                />
            </IntlProvider>
        );

        expect(mockedCancelFileUpload).toHaveBeenCalled();
        expect(mockedAlert).toHaveBeenCalled();
        expect(document.querySelector('input[type=file]')).toBeNull();
        mockedAlert.mockRestore();
    });

    test('files within the limit start loading', () => {
        const mockedCancelFileUpload = jest.fn();
        const mockedAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
        const captured = {};
        const Component = props => {
            captured.onStartSelectingFileUpload = props.onStartSelectingFileUpload;
            return <div />;
        };
        const WrappedComponent = SBFileUploaderHOC(Component);
        const {rerender} = renderWithIntl(
            <WrappedComponent
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                isShowingWithoutId
                loadingState={LoadingState.SHOWING_WITHOUT_ID}
                projectChanged={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );

        captured.onStartSelectingFileUpload();
        const input = document.querySelector('input[type=file]');
        const regularFile = new File(['project data'], 'project.sb3');
        Object.defineProperty(input, 'files', {value: [regularFile]});
        fireEvent(input, new Event('change'));

        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    canSave={false}
                    cancelFileUpload={mockedCancelFileUpload}
                    closeFileMenu={jest.fn()}
                    isLoadingUpload
                    isShowingWithoutId
                    loadingState={LoadingState.LOADING_VM_FILE_UPLOAD}
                    projectChanged={false}
                    requestProjectUpload={jest.fn()}
                    store={store}
                    userOwnsProject={false}
                    vm={vm}
                    onLoadingFinished={jest.fn()}
                    onLoadingStarted={jest.fn()}
                    onUpdateProjectTitle={jest.fn()}
                />
            </IntlProvider>
        );

        expect(mockedCancelFileUpload).not.toHaveBeenCalled();
        expect(mockedAlert).not.toHaveBeenCalled();
        // The input stays in the DOM: the file is pending to be read
        expect(document.querySelector('input[type=file]')).not.toBeNull();
        mockedAlert.mockRestore();
    });
});
