import { describe, expect, it } from 'vitest';
import { deflateSync } from 'fflate';
import {
    __测试__从Zip中央目录提取首张图片,
    __测试__从Zip本地文件头提取首张图片,
    __测试__从Zip提取首张图片
} from '../services/ai/imageTasks';

const 写Uint16LE = (target: Uint8Array, offset: number, value: number) => {
    target[offset] = value & 0xff;
    target[offset + 1] = (value >>> 8) & 0xff;
};

const 写Uint32LE = (target: Uint8Array, offset: number, value: number) => {
    target[offset] = value & 0xff;
    target[offset + 1] = (value >>> 8) & 0xff;
    target[offset + 2] = (value >>> 16) & 0xff;
    target[offset + 3] = (value >>> 24) & 0xff;
};

const 构建带DataDescriptor的Zip = (fileName: string, fileBytes: Uint8Array): Uint8Array => {
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(fileName);
    const compressed = deflateSync(fileBytes);
    const localHeaderLength = 30 + nameBytes.length;
    const descriptorLength = 16;
    const centralOffset = localHeaderLength + compressed.length + descriptorLength;
    const centralLength = 46 + nameBytes.length;
    const endLength = 22;
    const zip = new Uint8Array(centralOffset + centralLength + endLength);

    写Uint32LE(zip, 0, 0x04034b50);
    写Uint16LE(zip, 4, 20);
    写Uint16LE(zip, 6, 0x08);
    写Uint16LE(zip, 8, 8);
    写Uint16LE(zip, 26, nameBytes.length);
    zip.set(nameBytes, 30);
    zip.set(compressed, localHeaderLength);

    const descriptorOffset = localHeaderLength + compressed.length;
    写Uint32LE(zip, descriptorOffset, 0x08074b50);
    写Uint32LE(zip, descriptorOffset + 8, compressed.length);
    写Uint32LE(zip, descriptorOffset + 12, fileBytes.length);

    写Uint32LE(zip, centralOffset, 0x02014b50);
    写Uint16LE(zip, centralOffset + 4, 20);
    写Uint16LE(zip, centralOffset + 6, 20);
    写Uint16LE(zip, centralOffset + 8, 0x08);
    写Uint16LE(zip, centralOffset + 10, 8);
    写Uint32LE(zip, centralOffset + 20, compressed.length);
    写Uint32LE(zip, centralOffset + 24, fileBytes.length);
    写Uint16LE(zip, centralOffset + 28, nameBytes.length);
    写Uint32LE(zip, centralOffset + 42, 0);
    zip.set(nameBytes, centralOffset + 46);

    const endOffset = centralOffset + centralLength;
    写Uint32LE(zip, endOffset, 0x06054b50);
    写Uint16LE(zip, endOffset + 8, 1);
    写Uint16LE(zip, endOffset + 10, 1);
    写Uint32LE(zip, endOffset + 12, centralLength);
    写Uint32LE(zip, endOffset + 16, centralOffset);

    return zip;
};

const 构建只有本地文件头的Zip = (fileName: string, fileBytes: Uint8Array): Uint8Array => {
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(fileName);
    const compressed = deflateSync(fileBytes);
    const localHeaderLength = 30 + nameBytes.length;
    const descriptorLength = 16;
    const zip = new Uint8Array(localHeaderLength + compressed.length + descriptorLength);

    写Uint32LE(zip, 0, 0x04034b50);
    写Uint16LE(zip, 4, 20);
    写Uint16LE(zip, 6, 0x08);
    写Uint16LE(zip, 8, 8);
    写Uint16LE(zip, 26, nameBytes.length);
    zip.set(nameBytes, 30);
    zip.set(compressed, localHeaderLength);

    const descriptorOffset = localHeaderLength + compressed.length;
    写Uint32LE(zip, descriptorOffset, 0x08074b50);
    写Uint32LE(zip, descriptorOffset + 8, compressed.length);
    写Uint32LE(zip, descriptorOffset + 12, fileBytes.length);

    return zip;
};

describe('NovelAI ZIP image response parsing', () => {
    it('extracts image_0.png from a streamed ZIP using the central directory sizes', () => {
        const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
        const zipBytes = 构建带DataDescriptor的Zip('image_0.png', pngBytes);

        const result = __测试__从Zip中央目录提取首张图片(zipBytes);

        expect(result?.fileName).toBe('image_0.png');
        expect(Array.from(result?.imageBytes || [])).toEqual(Array.from(pngBytes));
    });

    it('extracts image_0.png from a local-header-only ZIP stream', () => {
        const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 5, 6, 7, 8]);
        const zipBytes = 构建只有本地文件头的Zip('image_0.png', pngBytes);

        const directResult = __测试__从Zip本地文件头提取首张图片(zipBytes);
        const fallbackResult = __测试__从Zip提取首张图片(zipBytes);

        expect(directResult?.fileName).toBe('image_0.png');
        expect(Array.from(directResult?.imageBytes || [])).toEqual(Array.from(pngBytes));
        expect(Array.from(fallbackResult?.imageBytes || [])).toEqual(Array.from(pngBytes));
    });
});
