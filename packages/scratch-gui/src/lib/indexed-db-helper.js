import {Helper} from '@scratch/scratch-storage';

import {storeAsset, loadAsset} from './local-assets';
import getProjectStore from './project-store-provider';

/**
 * A scratch-storage helper that loads assets from the browser.
 *
 * Images and sounds are loaded from the local asset store (IndexedDB, see
 * local-assets.js). Projects are loaded from the local project store (see
 * project-store-local.js). Scratch used HTTP helpers that pointed to its
 * asset and project servers; Spark has no servers, so everything comes from
 * the browser.
 *
 * This helper does not implement `store`: the save flow (project-saver-hoc)
 * writes to the local stores directly.
 */
class IndexedDbHelper extends Helper {
    load (assetType, assetId, dataFormat) {
        if (assetType.name === 'Project') {
            return getProjectStore().getEntry(assetId)
                .then(entry => {
                    if (entry === null || typeof entry === 'undefined') {
                        // Un helper no puede resolver con null: la cadena de
                        // carga de scratch-storage solo continúa con el
                        // siguiente helper si éste rechaza.
                        throw new Error(`Project ${assetId} not found in the local store`);
                    }
                    const asset = new this.parent.Asset(
                        assetType,
                        assetId,
                        this.parent.DataFormat.JSON,
                        entry.projectData
                    );
                    // El título no va dentro del proyecto (sb3): se lleva en la
                    // entrada del almacén. El cargador de proyectos lo usa para
                    // restaurar el título del editor.
                    asset.title = entry.title;
                    return asset;
                });
        }
        return loadAsset(assetId).then(entry => {
            if (entry === null || typeof entry === 'undefined') {
                // Igual que en la rama de proyectos: rechazar para que
                // ScratchStorage siga con el siguiente helper.
                throw new Error(`Asset ${assetId} not found in the local store`);
            }
            return new this.parent.Asset(
                entry.assetTypeName ?
                    this.parent.AssetType[entry.assetTypeName] : assetType,
                assetId,
                entry.dataFormat || dataFormat,
                entry.data
            );
        });
    }
}

export default IndexedDbHelper;
