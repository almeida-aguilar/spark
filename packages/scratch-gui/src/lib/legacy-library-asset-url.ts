/** Directory where the media library assets are bundled, relative to the application. */
// SPARK: los assets de la biblioteca van empaquetados con la aplicación
// (scripts/fetch-library-assets.js), nunca desde los servidores de Scratch.
const LIBRARY_ASSET_PATH = 'static/library-assets';

/**
 * Build the URL a library asset is fetched from.
 * @param {string} assetId - the md5 of the asset.
 * @param {string} dataFormat - the asset's file extension.
 * @param {string} [host] - unused; kept for compatibility with the storage
 *   interface. Spark serves library assets from its own bundle.
 * @returns {string} - the URL to fetch the asset from.
 */
export const buildLibraryAssetUrl = (assetId: string, dataFormat: string, host?: string): string =>
    `${LIBRARY_ASSET_PATH}/${assetId}.${dataFormat}`;
