import projectData from './project-data';
import {TranslatorFunction} from '../../gui-config';


import popWav from '!arraybuffer-loader!./83a9787d4cb6f3b7632b4ddfebf74367.wav?';
// SPARK: el sprite por defecto usa la mascota Spark y un bip neutro en lugar del gato
import bipWav from '!arraybuffer-loader!./a6fb2e45f2bce6fa260599687ff34140.wav?';
import backdrop from '!raw-loader!./6ff4a5332e871b56709bdf08fe61c23c.svg?';
import costume1 from '!raw-loader!./b19c8f264b235b65ba8a2e566edb9e18.svg?';
import costume2 from '!raw-loader!./3bb45ab9b1514b77d8f5d68257607e5e.svg?';


declare function require (path: 'fastestsmallesttextencoderdecoder'): {TextEncoder: typeof TextEncoder};

const defaultProject = (translator?: TranslatorFunction) => {
    let _TextEncoder: typeof TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('fastestsmallesttextencoderdecoder').TextEncoder;
    } else {
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        // TODO: This is weird - the ids are annotated by scratch-storage to be strigns, but
        //       this one is an int. May have implications on checking with `!` and in conditions,
        //       so leaving it as is for now.
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: '83a9787d4cb6f3b7632b4ddfebf74367',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(popWav)
    }, {
        id: 'a6fb2e45f2bce6fa260599687ff34140', // SPARK: bip neutro en lugar de "Meow"
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(bipWav)
    }, {
        id: '6ff4a5332e871b56709bdf08fe61c23c', // SPARK: fondo neutro
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }, {
        id: 'b19c8f264b235b65ba8a2e566edb9e18', // SPARK: mascota de frente
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume1)
    }, {
        id: '3bb45ab9b1514b77d8f5d68257607e5e', // SPARK: mascota uwu
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(costume2)
    }];
};

export default defaultProject;
