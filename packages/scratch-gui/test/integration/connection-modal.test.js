import path from 'path';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    clickText,
    clickXpath,
    findByText,
    getDriver,
    getLogs,
    loadUri
} = new SeleniumHelper();

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

// SPARK: Spark connects to the WeDo 2.0 hub through Web Bluetooth (phase 3),
// which is only available in Chromium based browsers. The test covers both
// cases: a browser with Web Bluetooth asks the user to start the search, and a
// browser without it explains which browsers are supported.
describe('Hardware extension connection modal', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('The connection modal of the WeDo 2.0 extension opens', async () => {
        await loadUri(uri);

        await clickXpath('//button[@title="Add Extension"]');

        await clickText('LEGO WeDo 2.0');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for modal to open

        const hasWebBluetooth = await driver.executeScript(
            'return typeof navigator.bluetooth !== "undefined";'
        );
        if (hasWebBluetooth) {
            // The browser can talk to Bluetooth devices: the user is asked to
            // start the search, which shows the device chooser.
            findByText('Start Searching');
        } else {
            // The browser cannot talk to Bluetooth devices: the modal explains
            // which browsers are supported.
            findByText('Use a browser that supports Bluetooth');
        }

        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });
});
