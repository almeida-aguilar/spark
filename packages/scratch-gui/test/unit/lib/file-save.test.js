import saveFile, {forgetSavedFile} from '../../../src/lib/file-save';
import downloadBlob from '../../../src/lib/download-blob';

jest.mock('../../../src/lib/download-blob', () => jest.fn());

describe('file-save', () => {
    const blob = {
        stream: () => ({
            pipeTo: jest.fn(() => Promise.resolve())
        })
    };

    beforeEach(() => {
        forgetSavedFile();
        downloadBlob.mockClear();
        delete window.showSaveFilePicker;
    });

    test('without File System Access API, it downloads the blob', async () => {
        await saveFile('project.sb3', blob);

        expect(downloadBlob).toHaveBeenCalledWith('project.sb3', blob);
    });

    test('with the API, it asks for a file and writes to it', async () => {
        const writable = {streamTarget: true};
        const handle = {
            queryPermission: jest.fn(() => Promise.resolve('granted')),
            createWritable: jest.fn(() => Promise.resolve(writable))
        };
        const pipeTo = jest.fn(() => Promise.resolve());
        const streamingBlob = {stream: () => ({pipeTo})};
        window.showSaveFilePicker = jest.fn(() => Promise.resolve(handle));

        await saveFile('project.sb3', streamingBlob);

        expect(window.showSaveFilePicker).toHaveBeenCalledWith(
            expect.objectContaining({suggestedName: 'project.sb3'})
        );
        expect(handle.createWritable).toHaveBeenCalled();
        expect(pipeTo).toHaveBeenCalledWith(writable);
        expect(downloadBlob).not.toHaveBeenCalled();
    });

    test('it reuses the remembered file handle instead of asking again', async () => {
        const handle = {
            queryPermission: jest.fn(() => Promise.resolve('granted')),
            createWritable: jest.fn(() => Promise.resolve({}))
        };
        window.showSaveFilePicker = jest.fn(() => Promise.resolve(handle));
        const pipeTo = jest.fn(() => Promise.resolve());

        await saveFile('project.sb3', {stream: () => ({pipeTo})});
        await saveFile('project.sb3', {stream: () => ({pipeTo})});

        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(handle.createWritable).toHaveBeenCalledTimes(2);
    });

    test('when the user cancels the picker, nothing is downloaded', async () => {
        window.showSaveFilePicker = jest.fn(() =>
            Promise.reject(Object.assign(new Error('cancelled'), {name: 'AbortError'})));

        await saveFile('project.sb3', blob);

        expect(downloadBlob).not.toHaveBeenCalled();
    });

    test('when the handle is not granted, it falls back to downloading', async () => {
        const handle = {
            queryPermission: jest.fn(() => Promise.resolve('prompt')),
            createWritable: jest.fn()
        };
        window.showSaveFilePicker = jest.fn(() => Promise.resolve(handle));

        await saveFile('project.sb3', blob);

        expect(handle.createWritable).not.toHaveBeenCalled();
        expect(downloadBlob).toHaveBeenCalledWith('project.sb3', blob);
    });
});
