/* eslint-env jest */
import {getSparkMessages} from '../../../../src/lib/spark-l10n/spark-messages';

describe('spark-messages', () => {
    test('Spanish (Spain) translates the new wedo2 blocks and the light colors', () => {
        const messages = getSparkMessages('es');

        expect(messages['wedo2.turnLightOff']).toBe('apagar luz');
        expect(messages['wedo2.setLightColourByIndex']).toBe('fijar color de la luz a [COLOR_INDEX]');
        expect(messages['wedo2.setLightColourPicker']).toBe('fijar color de la luz a [COLOR]');
        expect(messages['wedo2.whenHubButtonPressed']).toBe('al presionar el botón del hub');
        expect(messages['wedo2.hubButtonPressed']).toBe('¿botón del hub presionado?');

        expect(messages['wedo2.lightColor.pink']).toBe('rosa');
        expect(messages['wedo2.lightColor.purple']).toBe('morado');
        expect(messages['wedo2.lightColor.teal']).toBe('verde azulado');
        expect(messages['wedo2.lightColor.white']).toBe('blanco');
    });

    test('Spanish (Latin America) translates the new wedo2 blocks and the light colors', () => {
        const messages = getSparkMessages('es-419');

        expect(messages['wedo2.turnLightOff']).toBe('apagar luz');
        expect(messages['wedo2.setLightColourByIndex']).toBe('fijar color de la luz a [COLOR_INDEX]');
        expect(messages['wedo2.whenHubButtonPressed']).toBe('al presionar el botón del hub');

        expect(messages['wedo2.lightColor.pink']).toBe('rosa');
        expect(messages['wedo2.lightColor.purple']).toBe('morado');
        expect(messages['wedo2.lightColor.teal']).toBe('verde azulado');
        expect(messages['wedo2.lightColor.white']).toBe('blanco');
    });

    test('Spanish (Latin America) translates Spark menu bar labels', () => {
        const messages = getSparkMessages('es-419');

        expect(messages['spark.menuBar.projects']).toBe('Proyectos');
        expect(messages['spark.menuBar.about']).toBe('Acerca de Spark');
        expect(messages['spark.menuBar.save']).toBe('Guardar');
    });

    test('Spanish translates core GUI labels missing from upstream scratch-l10n', () => {
        const esMessages = getSparkMessages('es');
        const es419Messages = getSparkMessages('es-419');

        expect(esMessages['gui.sharedMessages.loadFromComputerTitle']).toBe('Cargar desde tu ordenador');
        expect(esMessages['gui.menuBar.theme']).toBe('Tema');
        expect(esMessages['gui.menuBar.colorMode']).toBe('Modo de color');

        expect(es419Messages['gui.sharedMessages.loadFromComputerTitle']).toBe('Cargar desde tu computadora');
        expect(es419Messages['gui.menuBar.theme']).toBe('Tema');
        expect(es419Messages['gui.menuBar.colorMode']).toBe('Modo de color');
    });

    test('unknown locales fall back to the English strings', () => {
        const messages = getSparkMessages('fr');

        expect(messages['wedo2.turnLightOff']).toBe('turn light off');
        expect(messages['wedo2.lightColor.pink']).toBe('pink');
    });
});
