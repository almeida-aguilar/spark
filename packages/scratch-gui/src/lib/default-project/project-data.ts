import projectDataMessages from './messages';
import sharedMessages from '../shared-messages';
import {MessageObject, TranslatorFunction} from '../../gui-config';

const messages = {...projectDataMessages, ...sharedMessages};

// use the default message if a translation function is not passed
const defaultTranslator = (msgObj: MessageObject) => msgObj.defaultMessage;

/**
 * Generate a localized version of the default project
 * @param {function} translateFunction a function to use for translating the default names
 * @returns {object} the project data json for the default project
 */
const projectData = (translateFunction?: TranslatorFunction): object => {
    const translator = translateFunction || defaultTranslator;
    return ({
        targets: [
            {
                isStage: true,
                name: 'Stage',
                variables: {
                    '`jEk@4|i[#Fk?(8x)AV.-my variable': [
                        translator(messages.variable),
                        0
                    ]
                },
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: '6ff4a5332e871b56709bdf08fe61c23c', // SPARK: fondo neutro
                        name: translator(messages.backdrop, {index: 1}),
                        md5ext: '6ff4a5332e871b56709bdf08fe61c23c.svg', // SPARK:
                        dataFormat: 'svg',
                        rotationCenterX: 240,
                        rotationCenterY: 180
                    }
                ],
                sounds: [
                    {
                        assetId: '83a9787d4cb6f3b7632b4ddfebf74367',
                        name: translator(messages.pop),
                        dataFormat: 'wav',
                        format: '',
                        rate: 11025,
                        sampleCount: 258,
                        md5ext: '83a9787d4cb6f3b7632b4ddfebf74367.wav'
                    }
                ],
                volume: 100
            },
            {
                isStage: false,
                name: translator(messages.sprite, {index: 1}),
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: 'b19c8f264b235b65ba8a2e566edb9e18', // SPARK: mascota de frente
                        name: translator(messages.costume, {index: 1}),
                        bitmapResolution: 1,
                        md5ext: 'b19c8f264b235b65ba8a2e566edb9e18.svg', // SPARK:
                        dataFormat: 'svg',
                        rotationCenterX: 60,
                        rotationCenterY: 63
                    },
                    {
                        assetId: '3bb45ab9b1514b77d8f5d68257607e5e', // SPARK: mascota uwu
                        name: translator(messages.costume, {index: 2}),
                        bitmapResolution: 1,
                        md5ext: '3bb45ab9b1514b77d8f5d68257607e5e.svg', // SPARK:
                        dataFormat: 'svg',
                        rotationCenterX: 60,
                        rotationCenterY: 63
                    }
                ],
                sounds: [
                    {
                        assetId: 'a6fb2e45f2bce6fa260599687ff34140', // SPARK: bip neutro
                        name: translator(messages.bip),
                        dataFormat: 'wav',
                        format: '',
                        rate: 22050,
                        sampleCount: 6174,
                        md5ext: 'a6fb2e45f2bce6fa260599687ff34140.wav' // SPARK:
                    }
                ],
                volume: 100,
                visible: true,
                x: 0,
                y: 0,
                size: 100,
                direction: 90,
                draggable: false,
                rotationStyle: 'all around'
            }
        ],
        meta: {
            semver: '3.0.0',
            vm: '0.1.0',
            agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36' // eslint-disable-line @stylistic/max-len
        }
    });
};


export default projectData;
