#!/usr/bin/env node
/**
 * SPARK (Fase 10): comprobación automatizada de cumplimiento de licencias de
 * dependencias de producción. Verifica que THIRD_PARTY_LICENSES.md esté
 * actualizado respecto al lockfile y que no haya dependencias sin licencia
 * identificable o con licencias no permitidas.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GENERATOR = path.join(ROOT, 'scripts', 'generate-third-party-licenses.js');
const COMMITTED = path.join(ROOT, 'THIRD_PARTY_LICENSES.md');

const ALLOWED_LICENSE_PATTERNS = [
    /^0BSD$/i,
    /^Apache-2\.0$/i,
    /^Apache 2\.0$/i,
    /^Apache License, Version 2\.0$/i,
    /^BSD$/i,
    /^BSD-2-Clause$/i,
    /^BSD-3-Clause$/i,
    /^BlueOak-1\.0\.0$/i,
    /^CC-BY-3\.0$/i,
    /^CC0-1\.0$/i,
    /^ISC$/i,
    /^MIT$/i,
    /^MIT-0$/i,
    /^MIT\/X11$/i,
    /^Unlicense$/i,
    /^Zlib$/i,
    /^Python-2\.0$/i,
    /^AGPL-3\.0-only$/i,
    /^AGPL-3\.0-or-later$/i,
    /^LGPL-3\.0-or-later$/i,
    /^\(MIT AND Zlib\)$/i,
    /^\(MIT OR Apache-2\.0\)$/i,
    /^\(MIT OR GPL-3\.0-or-later\)$/i,
    /^\(MPL-2\.0 OR Apache-2\.0\)$/i,
    /^\(Unlicense OR Apache-2\.0\)$/i,
    /^Apache-2\.0 AND MIT$/i,
    /^not declared \(see LICENSE/i,
    /^not declared \(see LICENCE/i
];

const isAllowedLicense = license =>
    ALLOWED_LICENSE_PATTERNS.some(re => re.test(license.trim()));

const parseLicenseSections = content => {
    const sections = [];
    const lines = content.split(/\r?\n/);
    let current = null;
    for (const line of lines) {
        const m = line.match(/^## (.+)$/);
        if (m) {
            current = m[1].trim();
            sections.push(current);
        }
    }
    return sections;
};

const main = () => {
    if (!fs.existsSync(COMMITTED)) {
        console.error('Missing THIRD_PARTY_LICENSES.md');
        process.exit(1);
    }

    // Verifica que el archivo esté actualizado con el generador.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-licenses-'));
    const tmpOut = path.join(tmpDir, 'THIRD_PARTY_LICENSES.md');
    let generatorSrc = fs.readFileSync(GENERATOR, 'utf8');
    // Redirige la salida y fija la raíz del repo (el script temporal vive fuera de scripts/).
    generatorSrc = generatorSrc
        .replace(
            "const ROOT = path.resolve(__dirname, '..');",
            `const ROOT = ${JSON.stringify(ROOT)};`
        )
        .replace(
            "const OUTPUT = path.join(ROOT, 'THIRD_PARTY_LICENSES.md');",
            `const OUTPUT = ${JSON.stringify(tmpOut)};`
        );
    if (!generatorSrc.includes(tmpOut) || !generatorSrc.includes(JSON.stringify(ROOT))) {
        console.error('Could not patch license generator for verification.');
        process.exit(1);
    }
    const tmpScript = path.join(tmpDir, 'generate.js');
    fs.writeFileSync(tmpScript, generatorSrc);
    try {
        execFileSync(process.execPath, [tmpScript], {cwd: ROOT, stdio: 'inherit'});
    } catch (e) {
        console.error('Failed to generate THIRD_PARTY_LICENSES.md for verification.');
        process.exit(1);
    }
    const generated = fs.readFileSync(tmpOut, 'utf8');
    const committed = fs.readFileSync(COMMITTED, 'utf8');
    if (generated !== committed) {
        console.error('THIRD_PARTY_LICENSES.md is out of date. Regenerate with:');
        console.error('  node scripts/generate-third-party-licenses.js');
        process.exit(1);
    }

    // Verifica que todas las licencias listadas sean aceptables/identificables.
    const licenses = parseLicenseSections(committed);
    const disallowed = licenses.filter(l => !isAllowedLicense(l));
    const unknown = licenses.filter(l => /UNKNOWN/i.test(l));
    if (unknown.length || disallowed.length) {
        if (unknown.length) {
            console.error('Dependencies with UNKNOWN license declarations:');
            for (const l of unknown) console.error(`- ${l}`);
        }
        if (disallowed.length) {
            console.error('Dependencies with disallowed/unrecognized license declarations:');
            for (const l of disallowed) console.error(`- ${l}`);
        }
        process.exit(1);
    }

    console.log('OK: dependency licenses are compliant and THIRD_PARTY_LICENSES.md is up to date.');
};

main();
