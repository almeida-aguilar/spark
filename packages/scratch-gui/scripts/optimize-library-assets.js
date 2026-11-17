#!/usr/bin/env node

/**
 * Losslessly recompress the local Scratch media library.
 *
 * The library files are addressed by the md5 of the ORIGINAL Scratch bytes, so
 * this script deliberately keeps their names. The bytes change (PNG deflate,
 * SVG whitespace, WAV ADPCM) but the format and extension do not, keeping
 * `.sb3` references and Scratch compatibility intact.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    CRC_TABLE[i] = value >>> 0;
}

const crc32 = buffer => {
    let crc = 0xffffffff;
    for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
};

/**
 * Replace all IDAT chunks with a single chunk compressed at the highest level.
 * All other chunks (including colour profiles and animation metadata) are kept.
 * @param {Buffer} input - original PNG file.
 * @returns {Buffer} optimized or original buffer.
 */
const optimizePng = input => {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!input.subarray(0, 8).equals(signature)) return input;

    const idat = [];
    let offset = 8;
    while (offset + 12 <= input.length) {
        const length = input.readUInt32BE(offset);
        const type = input.toString('ascii', offset + 4, offset + 8);
        const end = offset + 12 + length;
        if (end > input.length) return input;
        if (type === 'IDAT') idat.push(input.subarray(offset + 8, offset + 8 + length));
        offset = end;
    }
    if (idat.length === 0) return input;

    let raw;
    try {
        raw = zlib.inflateSync(Buffer.concat(idat));
    } catch {
        return input;
    }
    const compressed = zlib.deflateSync(raw, {level: 9, memLevel: 9});
    const idatChunk = {type: 'IDAT', data: compressed};
    const outputChunks = [];
    let replaced = false;
    offset = 8;
    while (offset + 12 <= input.length) {
        const length = input.readUInt32BE(offset);
        const type = input.toString('ascii', offset + 4, offset + 8);
        if (type === 'IDAT' && !replaced) {
            outputChunks.push(idatChunk);
            replaced = true;
        } else if (type !== 'IDAT') {
            outputChunks.push({type, data: input.subarray(offset + 8, offset + 8 + length)});
        }
        offset += 12 + length;
    }

    const size = 8 + outputChunks.reduce((sum, chunk) => sum + 12 + chunk.data.length, 0);
    const output = Buffer.allocUnsafe(size);
    signature.copy(output, 0);
    let position = 8;
    for (const chunk of outputChunks) {
        output.writeUInt32BE(chunk.data.length, position);
        output.write(chunk.type, position + 4, 'ascii');
        chunk.data.copy(output, position + 8);
        const crcInput = Buffer.concat([Buffer.from(chunk.type, 'ascii'), chunk.data]);
        output.writeUInt32BE(crc32(crcInput), position + 8 + chunk.data.length);
        position += 12 + chunk.data.length;
    }
    return output.length < input.length ? output : input;
};

/**
 * Remove XML comments and insignificant whitespace between tags. Metadata and
 * namespaces are kept because Scratch sanitizes and re-serializes costumes.
 * @param {Buffer} input - original SVG file.
 * @returns {Buffer} optimized or original buffer.
 */
const optimizeSvg = input => {
    const text = input.toString('utf8');
    const optimized = text
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/>\s+</g, '><')
        .trim();
    const output = Buffer.from(optimized, 'utf8');
    return output.length < input.length ? output : input;
};

const STEP_TABLE = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230,
    253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
    1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327,
    3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487,
    12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
];
const INDEX_TABLE = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
const SAMPLES_PER_BLOCK = 505;
const BLOCK_ALIGN = 256;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Encode one sample as a 4-bit IMA ADPCM code, matching Scratch's decoder.
 * @param {number} sample - PCM sample to encode.
 * @param {number} predictor - current ADPCM predictor.
 * @param {number} index - current step-table index.
 * @returns {number[]} [code, predictor, index]
 */
const encodeSample = (sample, predictor, index) => {
    const step = STEP_TABLE[index];
    let difference = sample - predictor;
    let code = 0;
    if (difference < 0) {
        code = 8;
        difference = -difference;
    }
    if (difference >= step) {
        code |= 4;
        difference -= step;
    }
    if (difference >= (step >> 1)) {
        code |= 2;
        difference -= step >> 1;
    }
    if (difference >= (step >> 2)) code |= 1;

    let delta = step >> 3;
    if (code & 4) delta += step;
    if (code & 2) delta += step >> 1;
    if (code & 1) delta += step >> 2;
    predictor = clamp(predictor + ((code & 8) ? -delta : delta), -32768, 32767);
    index = clamp(index + INDEX_TABLE[code], 0, STEP_TABLE.length - 1);
    return [code, predictor, index];
};

const encodeAdpcm = samples => {
    const blockCount = Math.ceil(samples.length / SAMPLES_PER_BLOCK);
    const data = Buffer.alloc(blockCount * BLOCK_ALIGN);
    for (let block = 0; block < blockCount; block++) {
        const start = block * SAMPLES_PER_BLOCK;
        const offset = block * BLOCK_ALIGN;
        let predictor = samples[start];
        data.writeInt16LE(predictor, offset);
        data.writeUInt8(0, offset + 2);
        data.writeUInt8(0, offset + 3);
        let index = 0;
        for (let pair = 0; pair < (SAMPLES_PER_BLOCK - 1) / 2; pair++) {
            const first = samples[start + 1 + (pair * 2)] ?? predictor;
            const second = samples[start + 2 + (pair * 2)] ?? predictor;
            let code;
            [code, predictor, index] = encodeSample(first, predictor, index);
            let secondCode;
            [secondCode, predictor, index] = encodeSample(second, predictor, index);
            data.writeUInt8(code | (secondCode << 4), offset + 4 + pair);
        }
    }
    return data;
};

const riffChunks = input => {
    if (input.toString('ascii', 0, 4) !== 'RIFF' || input.toString('ascii', 8, 12) !== 'WAVE') return null;
    const chunks = [];
    let offset = 12;
    while (offset + 8 <= input.length) {
        const type = input.toString('ascii', offset, offset + 4);
        const length = input.readUInt32LE(offset + 4);
        const dataStart = offset + 8;
        if (dataStart + length > input.length) return null;
        chunks.push({type, data: input.subarray(dataStart, dataStart + length)});
        offset = dataStart + length + (length & 1);
    }
    return chunks;
};

/**
 * Convert mono PCM WAV to IMA ADPCM, the format already used by most Scratch
 * library sounds. ADPCM WAV, stereo files and other formats are left untouched.
 * @param {Buffer} input - original WAV file.
 * @returns {Buffer} optimized or original buffer.
 */
const optimizeWav = input => {
    const chunks = riffChunks(input);
    if (!chunks) return input;
    const fmt = chunks.find(chunk => chunk.type === 'fmt ');
    const data = chunks.find(chunk => chunk.type === 'data');
    if (!fmt || !data || fmt.data.length < 16) return input;
    const format = fmt.data.readUInt16LE(0);
    const channels = fmt.data.readUInt16LE(2);
    const sampleRate = fmt.data.readUInt32LE(4);
    const bitsPerSample = fmt.data.readUInt16LE(14);
    if (format !== 1 || channels !== 1 || (bitsPerSample !== 16 && bitsPerSample !== 8)) return input;

    const sampleCount = Math.floor(data.data.length / (bitsPerSample / 8));
    if (sampleCount === 0) return input;
    const samples = new Int16Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
        samples[i] = bitsPerSample === 16 ?
            data.data.readInt16LE(i * 2) :
            (data.data.readUInt8(i) - 128) << 8;
    }
    const adpcmData = encodeAdpcm(samples);

    const newFmt = Buffer.alloc(20);
    newFmt.writeUInt16LE(0x11, 0); // WAVE_FORMAT_IMA_ADPCM
    newFmt.writeUInt16LE(1, 2);
    newFmt.writeUInt32LE(sampleRate, 4);
    newFmt.writeUInt32LE(Math.round(sampleRate * BLOCK_ALIGN / SAMPLES_PER_BLOCK), 8);
    newFmt.writeUInt16LE(BLOCK_ALIGN, 12);
    newFmt.writeUInt16LE(4, 14);
    newFmt.writeUInt16LE(2, 16); // cbSize
    newFmt.writeUInt16LE(SAMPLES_PER_BLOCK, 18);
    const fact = Buffer.alloc(4);
    fact.writeUInt32LE(sampleCount, 0);

    const outputChunks = [
        {type: 'fmt ', data: newFmt},
        {type: 'fact', data: fact},
        {type: 'data', data: adpcmData}
    ];
    for (const chunk of chunks) {
        if (chunk.type !== 'fmt ' && chunk.type !== 'data' && chunk.type !== 'fact') outputChunks.push(chunk);
    }
    const bodySize = 4 + outputChunks.reduce((sum, chunk) => sum + 8 + chunk.data.length + (chunk.data.length & 1), 0);
    const output = Buffer.alloc(8 + bodySize);
    output.write('RIFF', 0, 'ascii');
    output.writeUInt32LE(bodySize, 4);
    output.write('WAVE', 8, 'ascii');
    let offset = 12;
    for (const chunk of outputChunks) {
        output.write(chunk.type, offset, 'ascii');
        output.writeUInt32LE(chunk.data.length, offset + 4);
        chunk.data.copy(output, offset + 8);
        offset += 8 + chunk.data.length + (chunk.data.length & 1);
    }
    return output.length < input.length ? output : input;
};

/**
 * Optimize every supported asset in a directory. Files are only replaced when
 * the optimized version is smaller, so repeated runs are idempotent.
 * @param {string} directory - directory containing `<md5>.<ext>` files.
 * @returns {{png: number, svg: number, wav: number, bytesSaved: number}} stats.
 */
const optimizeDirectory = directory => {
    const stats = {png: 0, svg: 0, wav: 0, bytesSaved: 0};
    if (!fs.existsSync(directory)) return stats;
    for (const name of fs.readdirSync(directory)) {
        const extension = path.extname(name)
            .slice(1)
            .toLowerCase();
        if (!['png', 'svg', 'wav'].includes(extension)) continue;
        const file = path.join(directory, name);
        if (!fs.statSync(file).isFile()) continue;
        const original = fs.readFileSync(file);
        const optimize = {png: optimizePng, svg: optimizeSvg, wav: optimizeWav}[extension];
        const optimized = optimize(original);
        if (optimized === original) continue;
        fs.writeFileSync(file, optimized);
        stats[extension]++;
        stats.bytesSaved += original.length - optimized.length;
    }
    return stats;
};

module.exports = {optimizePng, optimizeSvg, optimizeWav, optimizeDirectory};

if (require.main === module) {
    const directory = path.join(__dirname, '..', 'static', 'library-assets');
    const stats = optimizeDirectory(directory);
    const megabytes = bytes => (bytes / (1024 * 1024)).toFixed(2);
    console.log(`PNG ${stats.png}, SVG ${stats.svg}, WAV ${stats.wav}; ${megabytes(stats.bytesSaved)} MiB ahorrados`);
}
