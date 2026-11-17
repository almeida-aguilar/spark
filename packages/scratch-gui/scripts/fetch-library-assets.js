#!/usr/bin/env node

/**
 * Download the media library assets (costumes, backdrops, sounds, sprites)
 * referenced by `src/lib/libraries/*.json` into `static/library-assets/`.
 *
 * Spark has no asset server: the library is served from files bundled with the
 * application. This script fetches each unique asset once from Scratch's CDN
 * (the assets are published by the Scratch Foundation under CC BY-SA 2.0) and
 * stores them by their md5ext name, so the browser never contacts the network.
 *
 * Run from the scratch-gui package root:
 *   node scripts/fetch-library-assets.js
 *
 * Files already present are skipped, so the script can resume an interrupted
 * download.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const {createHash} = require('node:crypto');
const {optimizeDirectory} = require('./optimize-library-assets');

const CDN_HOST = 'cdn.assets.scratch.mit.edu';
const LIBRARIES_DIR = path.join(__dirname, '..', 'src', 'lib', 'libraries');
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'library-assets');
const MAX_CONCURRENT = 12;

const LIBRARY_FILES = ['costumes.json', 'backdrops.json', 'sounds.json', 'sprites.json'];

/**
 * Local (non-CDN) assets referenced by the libraries: the Spark mascot
 * costumes and its friends, whose source files are tracked in the repository.
 * @type {Array.<string>} - source paths, relative to the repository root.
 */
const LOCAL_ASSETS = [
    'packages/scratch-gui/src/lib/default-project/b19c8f264b235b65ba8a2e566edb9e18.svg', // Spark de frente
    'packages/scratch-gui/src/lib/default-project/3bb45ab9b1514b77d8f5d68257607e5e.svg', // Spark uwu
    'spark/brand/spark-blip.svg', // Blip
    'spark/brand/spark-quad.svg', // Quad (uwu)
    'spark/brand/spark-tria.svg' // Tria
];

/**
 * Collect the unique `md5ext` of every asset referenced by a library file,
 * including the costumes and sounds embedded in each sprite entry.
 * @param {string} file - library JSON file name.
 * @returns {string[]} the list of unique `md5.ext` identifiers.
 */
const collectMd5ext = file => {
    const entries = JSON.parse(fs.readFileSync(path.join(LIBRARIES_DIR, file), 'utf8'));
    const md5exts = new Set();
    const visit = entry => {
        if (entry.md5ext) {
            md5exts.add(entry.md5ext);
        } else if (entry.assetId && entry.dataFormat) {
            md5exts.add(`${entry.assetId}.${entry.dataFormat}`);
        }
    };
    for (const entry of entries) {
        visit(entry);
        for (const costume of entry.costumes || []) visit(costume);
        for (const sound of entry.sounds || []) visit(sound);
    }
    return Array.from(md5exts);
};

/**
 * Download one asset from the CDN.
 * @param {string} md5ext - the `md5.ext` name of the asset.
 * @returns {Promise<void>} resolved when the asset is saved.
 */
const download = md5ext => new Promise((resolve, reject) => {
    const url = `https://${CDN_HOST}/internalapi/asset/${md5ext}/get/`;
    https.get(url, response => {
        if (response.statusCode !== 200) {
            response.resume();
            reject(new Error(`${md5ext}: HTTP ${response.statusCode}`));
            return;
        }
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
            try {
                fs.writeFileSync(path.join(OUTPUT_DIR, md5ext), Buffer.concat(chunks));
                resolve();
            } catch (e) {
                reject(e);
            }
        });
        response.on('error', reject);
    }).on('error', reject);
});

const main = async () => {
    fs.mkdirSync(OUTPUT_DIR, {recursive: true});

    const all = new Set();
    for (const file of LIBRARY_FILES) {
        for (const md5ext of collectMd5ext(file)) {
            all.add(md5ext);
        }
    }

    const pending = Array.from(all).filter(md5ext => {
        const file = path.join(OUTPUT_DIR, md5ext);
        try {
            return fs.statSync(file).size === 0;
        } catch {
            return true;
        }
    });
    console.log(`biblioteca: ${all.size} assets únicos; por descargar: ${pending.length}`);

    let done = 0;
    let failed = 0;
    const failures = [];
    const queue = pending.slice();
    const worker = async () => {
        while (queue.length > 0) {
            const md5ext = queue.shift();
            try {
                await download(md5ext);
            } catch (e) {
                failed++;
                failures.push(e.message);
                continue;
            }
            done++;
            if (done % 100 === 0) console.log(`  ${done}/${pending.length}`);
        }
    };
    await Promise.all(Array.from({length: MAX_CONCURRENT}, worker));

    console.log(`descargados: ${done}; fallos: ${failed}`);
    if (failures.length > 0) {
        console.log(failures.slice(0, 10).join('\n'));
        process.exitCode = 1;
    }

    // Los assets locales de la marca no vienen del CDN: se copian desde sus
    // archivos fuente, nombrándolos con el md5 de su contenido (la biblioteca
    // referencia los assets por md5ext).
    const repoRoot = path.join(__dirname, '..', '..', '..');
    for (const localAsset of LOCAL_ASSETS) {
        const source = path.join(repoRoot, localAsset);
        const data = fs.readFileSync(source);
        const hash = createHash('md5').update(data);
        const md5ext = `${hash.digest('hex')}${path.extname(source)}`;
        const destination = path.join(OUTPUT_DIR, md5ext);
        if (fs.existsSync(destination)) continue;
        fs.writeFileSync(destination, data);
        console.log(`copiado: ${md5ext} (${path.basename(source)})`);
    }

    // Los nombres siguen siendo los md5 originales de Scratch: la optimización
    // cambia los bytes, pero no el formato ni las referencias de los .sb3.
    const stats = optimizeDirectory(OUTPUT_DIR);
    console.log(`optimizados: PNG ${stats.png}, SVG ${stats.svg}, WAV ${stats.wav}`);
};

main();
