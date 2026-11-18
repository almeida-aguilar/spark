#!/usr/bin/env node
/**
 * SPARK (Fase 10): falla si hay recursos o dominios externos cargados por la app
 * o incluidos en el build generado. No considera identificadores de espacios de
 * nombres (xmlns), comentarios o enlaces de navegación al propio proyecto.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GUI = path.join(ROOT, 'packages', 'scratch-gui');

const SCAN_DIRS = [
    path.join(GUI, 'src'),
    path.join(GUI, 'static')
];

const SCAN_FILES = [
    path.join(GUI, 'webpack.config.js'),
    path.join(GUI, 'webpack.pages.config.js'),
    path.join(GUI, 'src', 'playground', 'index.ejs')
];

const BUILD_DIR = path.join(GUI, 'build');

const IGNORE_DIR_NAMES = new Set(['.git', 'node_modules', 'test-results', 'playwright-report']);

// Dominios/URLs permitidos cuando aparecen como recurso/enlace de la app.
const ALLOWED_URL_PATTERNS = [
    /^https?:\/\/github\.com\/almeida-aguilar\/spark(\/issues)?\/?$/i
];

const isAllowedUrl = url => ALLOWED_URL_PATTERNS.some(re => re.test(url));

const walk = (dir, out = []) => {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        if (IGNORE_DIR_NAMES.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
};

const shouldScanFile = file => {
    const ext = path.extname(file).toLowerCase();
    return new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.html', '.ejs', '.css']).has(ext);
};

const pushViolation = (violations, file, line, url, kind) => {
    if (isAllowedUrl(url)) return;
    violations.push({file: path.relative(ROOT, file), line, url, kind});
};

// Patrones de carga de recursos externos (atributos/llamadas), no comentarios ni xmlns.
const CHECKS = [
    {kind: 'script-src', re: /<script\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'iframe-src', re: /<iframe\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'link-href', re: /<link\b[^>]*\bhref\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'img-src', re: /<img\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'source-src', re: /<source\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'media-src', re: /<(?:audio|video)\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'object-data', re: /<object\b[^>]*\bdata\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'embed-src', re: /<embed\b[^>]*\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/gi},
    {kind: 'css-url', re: /url\(\s*["']?(https?:\/\/[^"')\s]+)["']?\s*\)/gi},
    {kind: 'fetch', re: /\bfetch\(\s*["'`](https?:\/\/[^"'`]+)["'`]/gi},
    {kind: 'import-scripts', re: /\bimportScripts\(\s*["'`](https?:\/\/[^"'`]+)["'`]/gi},
    {kind: 'xhr-open', re: /\.open\(\s*["'`](?:GET|POST|PUT|DELETE|PATCH)["'`]\s*,\s*["'`](https?:\/\/[^"'`]+)["'`]/gi}
];

const scanFile = (file, violations) => {
    if (!shouldScanFile(file)) return;
    let content;
    try {
        content = fs.readFileSync(file, 'utf8');
    } catch (e) {
        return;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
        // Ignora líneas de comentario JS de una sola línea.
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
            // Aun así revisamos etiquetas HTML literales en JSX/EJS, poco comunes en comentarios.
        }
        for (const check of CHECKS) {
            check.re.lastIndex = 0;
            let m;
            while ((m = check.re.exec(line)) !== null) {
                pushViolation(violations, file, idx + 1, m[1], check.kind);
            }
        }
    });
};

const collectTargets = () => {
    const files = new Set(SCAN_FILES.filter(f => fs.existsSync(f)));
    for (const dir of SCAN_DIRS) {
        for (const f of walk(dir)) files.add(f);
    }
    for (const f of walk(BUILD_DIR)) files.add(f);
    return [...files];
};

const main = () => {
    const violations = [];
    for (const file of collectTargets()) scanFile(file, violations);
    if (violations.length) {
        console.error('External resources/domains detected in app/build:');
        for (const v of violations) {
            console.error(`- ${v.file}:${v.line} [${v.kind}] -> ${v.url}`);
        }
        process.exit(1);
    }
    console.log('OK: no external resource loads/domains found in scanned app/build files.');
};

main();
