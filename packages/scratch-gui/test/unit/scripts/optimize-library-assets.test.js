import {Buffer} from 'buffer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';

import ADPCMSoundDecoder from 'scratch-audio/src/ADPCMSoundDecoder';

import {optimizeDirectory, optimizePng, optimizeSvg, optimizeWav} from '../../../scripts/optimize-library-assets';

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

const pngChunk = (type, data) => {
    const header = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const result = Buffer.allocUnsafe(data.length + 12);
    result.writeUInt32BE(data.length, 0);
    header.copy(result, 4);
    result.writeUInt32BE(crc32(header), data.length + 8);
    return result;
};

const pngChunks = buffer => {
    const chunks = [];
    let offset = 8;
    while (offset + 12 <= buffer.length) {
        const length = buffer.readUInt32BE(offset);
        chunks.push({
            type: buffer.toString('ascii', offset + 4, offset + 8),
            data: buffer.subarray(offset + 8, offset + 8 + length),
            crc: buffer.readUInt32BE(offset + 8 + length)
        });
        offset += length + 12;
    }
    return chunks;
};

const buildPng = raw => {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(32, 0);
    ihdr.writeUInt32BE(32, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // RGB
    const deflated = zlib.deflateSync(raw, {level: 0});
    const middle = Math.floor(deflated.length / 2);
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', deflated.subarray(0, middle)),
        pngChunk('IDAT', deflated.subarray(middle)),
        pngChunk('IEND', Buffer.alloc(0))
    ]);
};

const buildPcmWav = (sampleCount, sampleRate = 22050) => {
    const dataLength = sampleCount * 2;
    const wav = Buffer.alloc(44 + dataLength);
    wav.write('RIFF', 0, 'ascii');
    wav.writeUInt32LE(36 + dataLength, 4);
    wav.write('WAVE', 8, 'ascii');
    wav.write('fmt ', 12, 'ascii');
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20); // PCM
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36, 'ascii');
    wav.writeUInt32LE(dataLength, 40);
    for (let i = 0; i < sampleCount; i++) {
        wav.writeInt16LE(Math.round(20000 * Math.sin((2 * Math.PI * 440 * i) / sampleRate)), 44 + (i * 2));
    }
    return wav;
};

describe('optimize-library-assets', () => {
    test('PNG: recompresses IDAT without dropping other chunks or pixels', () => {
        const raw = Buffer.alloc(32 * (1 + (32 * 3)));
        for (let i = 0; i < raw.length; i++) raw[i] = i * 17 % 251;
        const original = buildPng(raw);

        const optimized = optimizePng(original);
        const chunks = pngChunks(optimized);

        expect(optimized.length).toBeLessThan(original.length);
        expect(chunks.map(({type}) => type)).toEqual(['IHDR', 'IDAT', 'IEND']);
        expect(chunks.every(chunk => chunk.crc ===
            crc32(Buffer.concat([Buffer.from(chunk.type, 'ascii'), chunk.data])))).toBe(true);
        expect(zlib.inflateSync(chunks[1].data)).toEqual(raw);
        expect(optimizePng(optimized)).toEqual(optimized);
        expect(optimizePng(Buffer.from('not a png'))).toEqual(Buffer.from('not a png'));
    });

    test('SVG: removes comments and inter-tag whitespace but keeps text', () => {
        const original = Buffer.from('<svg><!-- comment -->\n  <rect/>\n  <text> hola </text>\n</svg>');
        expect(optimizeSvg(original).toString()).toBe('<svg><rect/><text> hola </text></svg>');
        expect(optimizeSvg(optimizeSvg(original))).toEqual(optimizeSvg(original));

        const unchanged = Buffer.from('<svg></svg>');
        expect(optimizeSvg(unchanged)).toBe(unchanged);
    });

    test('WAV: converts mono PCM to Scratch-compatible IMA ADPCM', async () => {
        const original = buildPcmWav(1000);
        const optimized = optimizeWav(original);

        expect(optimized.length).toBeLessThan(original.length);
        expect(optimized.toString('ascii', 12, 16)).toBe('fmt ');
        expect(optimized.readUInt16LE(20)).toBe(0x11); // IMA ADPCM
        expect(optimized.readUInt16LE(22)).toBe(1); // mono
        expect(optimized.readUInt16LE(32)).toBe(256); // block align
        expect(optimized.readUInt16LE(34)).toBe(4); // bits per sample
        expect(optimized.readUInt16LE(38)).toBe(505); // samples per block
        expect(optimizeWav(optimized)).toBe(optimized);

        const decoded = await new Promise((resolve, reject) => {
            const context = {
                createBuffer: (channels, length, sampleRate) => {
                    const data = new Float32Array(length);
                    resolve({data, sampleRate});
                    return {getChannelData: () => data};
                }
            };
            const arrayBuffer = optimized.buffer.slice(optimized.byteOffset, optimized.byteOffset + optimized.length);
            new ADPCMSoundDecoder(context).decode(arrayBuffer)
                .catch(reject);
        });
        expect(decoded.sampleRate).toBe(22050);
        expect(decoded.data.length).toBeGreaterThanOrEqual(1000);
        expect(decoded.data[0]).toBeCloseTo(0, 2);
    });

    test('optimizeDirectory: is idempotent and ignores other file types', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'spark-assets-'));
        try {
            fs.writeFileSync(path.join(directory, 'a.svg'), '<svg><!-- x -->\n  <rect/>\n</svg>');
            fs.writeFileSync(path.join(directory, 'b.txt'), 'leave me alone');
            const first = optimizeDirectory(directory);
            expect(first).toEqual({png: 0, svg: 1, wav: 0, bytesSaved: expect.any(Number)});
            expect(fs.readFileSync(path.join(directory, 'b.txt'), 'utf8')).toBe('leave me alone');
            expect(optimizeDirectory(directory)).toEqual({png: 0, svg: 0, wav: 0, bytesSaved: 0});
        } finally {
            fs.rmSync(directory, {recursive: true, force: true});
        }
    });
});
