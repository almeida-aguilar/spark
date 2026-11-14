// Script de preparación del paquete scratch-gui.
// SPARK: la descarga del firmware de micro:bit (que venía de los servidores de
// Scratch) se ha eliminado junto con la extensión micro:bit, para que el build
// no dependa de la red.
import {fileURLToPath} from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = path.join(__dirname, '..');

const prepare = async () => {
    console.info('Nothing to prepare');
};

prepare().then(
    () => {
        console.info('Prepare script complete');
        process.exit(0);
    },
    e => {
        console.error(e);
        process.exit(1);
    }
);
