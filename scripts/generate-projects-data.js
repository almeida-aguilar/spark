#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(ROOT, 'projects');
const OUTPUT_FILE = path.join(PROJECTS_DIR, 'projects-data.json');

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

const unquote = value => {
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
};

const parseScalar = raw => {
    const value = unquote(raw.trim());
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value !== '' && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
    }
    return value;
};

const parseFrontMatter = content => {
    const match = content.match(FRONT_MATTER_RE);
    if (!match) return null;

    const lines = match[1].split(/\r?\n/);
    const data = {};
    let currentArrayKey = null;

    for (const line of lines) {
        if (!line.trim() || line.trim().startsWith('#')) continue;

        const arrayItem = line.match(/^\s*-\s+(.*)$/);
        if (arrayItem && currentArrayKey) {
            if (!Array.isArray(data[currentArrayKey])) data[currentArrayKey] = [];
            data[currentArrayKey].push(parseScalar(arrayItem[1]));
            continue;
        }

        const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
        if (!kv) {
            currentArrayKey = null;
            continue;
        }

        const key = kv[1];
        const rawValue = kv[2].trim();

        if (rawValue === '') {
            data[key] = [];
            currentArrayKey = key;
            continue;
        }

        currentArrayKey = null;

        // Inline array: [a, b, "c d"]
        if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
            const inner = rawValue.slice(1, -1).trim();
            if (!inner) {
                data[key] = [];
            } else {
                data[key] = inner.split(',').map(item => parseScalar(item.trim()));
            }
            continue;
        }

        data[key] = parseScalar(rawValue);
    }

    return data;
};

const main = () => {
    if (!fs.existsSync(PROJECTS_DIR)) {
        throw new Error(`Projects directory not found: ${PROJECTS_DIR}`);
    }

    const files = fs.readdirSync(PROJECTS_DIR)
        .filter(name => name.endsWith('.md') && name.toLowerCase() !== 'readme.md')
        .sort();

    const projects = [];

    for (const file of files) {
        const fullPath = path.join(PROJECTS_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const meta = parseFrontMatter(content);
        if (!meta) {
            continue;
        }

        const slug = path.basename(file, '.md');
        const peripherals = Array.isArray(meta.peripherals) ?
            meta.peripherals :
            (meta.peripherals ? [meta.peripherals] : []);
        const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);

        projects.push({
            slug,
            title: meta.title || slug,
            difficulty_construction: meta.difficulty_construction || '',
            difficulty_code: meta.difficulty_code || '',
            peripherals,
            description: meta.description || '',
            tags,
            image: meta.image || '',
            video_youtube: meta.video_youtube || '',
            source: `projects/${file}`
        });
    }

    fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(projects, null, 2)}\n`, 'utf8');
    console.log(`Generated ${projects.length} project(s) -> ${path.relative(ROOT, OUTPUT_FILE)}`);
};

try {
    main();
} catch (err) {
    console.error(err.message || err);
    process.exit(1);
}
