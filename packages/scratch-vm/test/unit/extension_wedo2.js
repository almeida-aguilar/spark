const test = require('tap').test;
const formatMessage = require('format-message');
const Scratch3WeDo2Blocks = require('../../src/extensions/scratch3_wedo2');

const runtime = {
    on: () => {},
    registerPeripheralExtension: () => {}
};

test('the light color menu is translated with the active locale', t => {
    formatMessage.setup({
        locale: 'es',
        translations: {
            es: {
                'wedo2.lightColor.pink': 'rosa',
                'wedo2.lightColor.purple': 'morado',
                'wedo2.lightColor.blue': 'azul',
                'wedo2.lightColor.cyan': 'cian',
                'wedo2.lightColor.teal': 'verde azulado',
                'wedo2.lightColor.green': 'verde',
                'wedo2.lightColor.yellow': 'amarillo',
                'wedo2.lightColor.orange': 'naranja',
                'wedo2.lightColor.red': 'rojo',
                'wedo2.lightColor.white': 'blanco'
            }
        },
        missingTranslation: 'ignore'
    });

    const extension = new Scratch3WeDo2Blocks(runtime);
    const items = extension.getInfo().menus.LIGHT_COLOR_INDEX.items;

    t.equal(items[0].text, 'rosa');
    t.equal(items[1].text, 'morado');
    t.equal(items[4].text, 'verde azulado');
    t.equal(items[9].text, 'blanco');

    formatMessage.setup({locale: 'en', translations: {}, missingTranslation: 'ignore'});
    t.end();
});
