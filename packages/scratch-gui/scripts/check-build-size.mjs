#!/usr/bin/env node

/**
 * Check that the generated PWA stays inside the size budget documented in
 * docs/PWA_SIZE_BUDGET.md. Run after `npm run build:pwa` (or `npm run build`).
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(__dirname, '..', 'build');
const budget = JSON.parse(fs.readFileSync(path.join(__dirname, 'size-budget.json'), 'utf8'));

const fileSize = relativePath => {
    const file = path.join(buildDir, relativePath.split('?')[0]);
    try {
        return fs.statSync(file).size;
    } catch {
        return 0;
    }
};

const walk = directory => {
    let total = 0;
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) total += walk(file);
        else total += fs.statSync(file).size;
    }
    return total;
};

const html = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match => match[1]);
const initialBundleBytes = scripts.reduce((sum, script) => sum + fileSize(script), 0);

const sw = fs.readFileSync(path.join(buildDir, 'sw.js'), 'utf8');
const precacheUrls = [...sw.matchAll(/['"]url['"]\s*:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
const precacheBytes = precacheUrls.reduce((sum, url) => sum + fileSize(url), 0);

const libraryDir = path.join(buildDir, 'static', 'library-assets');
const libraryAssetsBytes = fs.existsSync(libraryDir) ? walk(libraryDir) : 0;
const buildBytes = walk(buildDir);

const metrics = {initialBundleBytes, precacheBytes, libraryAssetsBytes, buildBytes};
const format = bytes => `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;

console.log('Métricas de la PWA:');
for (const [key, value] of Object.entries(metrics)) {
    console.log(`  ${key}: ${format(value)} (${value} bytes)`);
}

let failed = false;
for (const [key, limit] of Object.entries(budget.limits)) {
    if (metrics[key] > limit) {
        console.error(`Límite superado: ${key} <= ${format(limit)}, obtenido ${format(metrics[key])}`);
        failed = true;
    }
}
if (failed) process.exitCode = 1;
