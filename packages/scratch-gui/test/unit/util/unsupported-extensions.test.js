import {getUnsupportedExtensionNames} from '../../../src/lib/unsupported-extensions';

describe('getUnsupportedExtensionNames', () => {
    test('uses the readable name of the extension', () => {
        expect(getUnsupportedExtensionNames(['microbit'])).toBe('micro:bit');
        expect(getUnsupportedExtensionNames(['ev3'])).toBe('LEGO MINDSTORMS EV3');
    });

    test('falls back to the id when the extension is unknown', () => {
        expect(getUnsupportedExtensionNames(['someExtension'])).toBe('someExtension');
    });

    test('lists several extensions', () => {
        expect(getUnsupportedExtensionNames(['microbit', 'makeymakey']))
            .toBe('micro:bit, Makey Makey');
    });
});
