import {ScratchStorage} from '@scratch/scratch-storage';

import defaultProject from './default-project';
import {GUIStorage, TranslatorFunction} from '../gui-config';
import {buildLibraryAssetUrl} from './legacy-library-asset-url';
import IndexedDbHelper from './indexed-db-helper';

export class LegacyStorage implements GUIStorage {
    private projectHost?: string;
    private projectToken?: string;
    private assetHost?: string;
    private translator?: TranslatorFunction;

    readonly scratchStorage = new ScratchStorage();

    constructor () {
        // SPARK: los assets y los proyectos se cargan del navegador (IndexedDB).
        this.scratchStorage.addHelper(new IndexedDbHelper(this.scratchStorage));
        this.cacheDefaultProject(this.scratchStorage);
        this.addLocalWebStores(this.scratchStorage);
    }

    setProjectHost (host: string): void {
        this.projectHost = host;
    }

    setProjectToken (token: string): void {
        this.projectToken = token;
    }

    setProjectMetadata (projectId: string | null | undefined): void {
        const {RequestMetadata, setMetadata, unsetMetadata} = this.scratchStorage.scratchFetch;

        // If project ID is '0' or zero, it's not a real project ID. In that case, remove the project ID metadata.
        // Same if it's null undefined.
        if (projectId && projectId !== '0') {
            setMetadata(RequestMetadata.ProjectId, projectId);
        } else {
            unsetMetadata(RequestMetadata.ProjectId);
        }
    }

    setAssetHost (host: string): void {
        this.assetHost = host;
    }

    getLibraryAssetUrl (assetId: string, dataFormat: string): string {
        // Currently defaults to the legacy library asset host.
        // Consider changing this to use the asset host if we want to start serving library assets
        // from the asset host instead
        return buildLibraryAssetUrl(assetId, dataFormat);
    }

    setTranslatorFunction (translator: TranslatorFunction): void {
        this.translator = translator;

        this.cacheDefaultProject(this.scratchStorage);
    }

    // SPARK: sin mochila, sin variables en la nube y sin guardado en un
    // servidor: los proyectos se guardan en el navegador (ProjectStore).

    private cacheDefaultProject (storage: ScratchStorage) {
        const defaultProjectAssets = defaultProject(this.translator);
        defaultProjectAssets.forEach(asset => storage.builtinHelper._store(
            storage.AssetType[asset.assetType],
            storage.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }

    private addLocalWebStores (storage: ScratchStorage) {
        // SPARK: los únicos almacenes web son los que sirven archivos
        // empaquetados con la aplicación. No hay almacenes que apunten a los
        // servidores de Scratch.
        // Assets de la biblioteca (disfraces, fondos y sonidos): archivos
        // descargados por scripts/fetch-library-assets.js y empaquetados en
        // static/library-assets/. La URL debe ser absoluta: el cliente de
        // descarga de scratch-storage no resuelve rutas relativas.
        storage.addWebStore(
            [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
            asset => new URL(
                `static/library-assets/${asset.assetId}.${asset.dataFormat}`,
                window.location.href
            ).href
        );
    }

}
