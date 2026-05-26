import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { deflateSync } from 'fflate';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'output', 'novelai-zip-render-e2e');
const serverUrl = 'http://127.0.0.1:4186';
let serverProcess;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return c >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint32BE = (target, offset, value) => {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
};

const writeUint16LE = (target, offset, value) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
};

const writeUint32LE = (target, offset, value) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
};

const pngChunk = (type, payload) => {
  const typeBytes = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + payload.length);
  writeUint32BE(chunk, 0, payload.length);
  typeBytes.copy(chunk, 4);
  payload.copy(chunk, 8);
  writeUint32BE(chunk, 8 + payload.length, crc32(Buffer.concat([typeBytes, payload])));
  return chunk;
};

const createVisiblePng = (width = 160, height = 112) => {
  const ihdr = Buffer.alloc(13);
  writeUint32BE(ihdr, 0, width);
  writeUint32BE(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = rowStart + 1 + x * 4;
      const inFrame = x > 10 && x < width - 10 && y > 10 && y < height - 10;
      raw[i] = inFrame ? 236 - Math.floor((x / width) * 90) : 34;
      raw[i + 1] = inFrame ? 94 + Math.floor((y / height) * 100) : 22;
      raw[i + 2] = inFrame ? 128 + Math.floor((x / width) * 80) : 58;
      raw[i + 3] = 255;
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
};

const createLocalHeaderOnlyZip = (fileName, fileBytes) => {
  const nameBytes = Buffer.from(fileName, 'utf8');
  const compressed = Buffer.from(deflateSync(fileBytes));
  const localHeaderLength = 30 + nameBytes.length;
  const descriptorLength = 16;
  const zip = Buffer.alloc(localHeaderLength + compressed.length + descriptorLength);

  writeUint32LE(zip, 0, 0x04034b50);
  writeUint16LE(zip, 4, 20);
  writeUint16LE(zip, 6, 0x08);
  writeUint16LE(zip, 8, 8);
  writeUint16LE(zip, 26, nameBytes.length);
  nameBytes.copy(zip, 30);
  compressed.copy(zip, localHeaderLength);

  const descriptorOffset = localHeaderLength + compressed.length;
  writeUint32LE(zip, descriptorOffset, 0x08074b50);
  writeUint32LE(zip, descriptorOffset + 8, compressed.length);
  writeUint32LE(zip, descriptorOffset + 12, fileBytes.length);
  return zip;
};

const waitForServer = async () => {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(serverUrl, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Vite dev server did not start in time');
};

test.beforeAll(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  serverProcess = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
    'vite',
    '--host', '127.0.0.1',
    '--port', '4186',
    '--strictPort'
  ], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    env: { ...process.env, BROWSER: 'none' }
  });
  await waitForServer();
});

test.afterAll(async () => {
  serverProcess?.kill();
});

test('renders a NovelAI ZIP image extracted by the browser runtime', async ({ page }) => {
  const pngBytes = createVisiblePng();
  const zipBytes = createLocalHeaderOnlyZip('image_0.png', pngBytes);

  await page.goto(serverUrl);
  const result = await page.evaluate(async ({ zipPayload }) => {
    const module = await import('/services/ai/imageTasks.ts');
    const zipBytesInBrowser = new Uint8Array(zipPayload);
    const calls = [];
    window.fetch = async (input, init) => {
      calls.push(String(input));
      return new Response(zipBytesInBrowser.slice(), {
        status: 200,
        headers: { 'content-type': 'application/zip' }
      });
    };

    const image = await module.generateImageByPrompt('1girl, solo, wuxia portrait, visible e2e proof', {
      id: 'novelai-browser-e2e',
      名称: 'NovelAI Browser E2E',
      供应商: 'openai_compatible',
      协议覆盖: 'auto',
      baseUrl: 'https://image.novelai.net',
      apiKey: 'test-token',
      model: 'nai-diffusion-4-5-full',
      图片后端类型: 'novelai',
      图片接口路径: '/ai/generate-image',
      图片响应格式: 'url'
    }, undefined, { 尺寸: '160x112' });

    document.body.innerHTML = `
      <main style="min-height: 100vh; display: grid; place-items: center; background: #1a1224; color: white; font-family: sans-serif;">
        <section style="display: grid; gap: 12px; justify-items: center;">
          <h1 style="font-size: 18px; margin: 0;">NovelAI ZIP extracted image</h1>
          <img id="novelai-result" src="${image.图片URL}" style="width: 320px; height: 224px; image-rendering: pixelated; border: 4px solid #ffffff; background: #000;" />
        </section>
      </main>
    `;
    const img = document.querySelector('#novelai-result');
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('extracted image did not render'));
    });

    return {
      dataUrl: image.图片URL,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      fetchUrl: calls[0] || ''
    };
  }, { zipPayload: Array.from(zipBytes) });

  expect(result.fetchUrl).toContain('/api/novelai/ai/generate-image');
  expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
  expect(result.naturalWidth).toBe(160);
  expect(result.naturalHeight).toBe(112);

  const extractedPath = path.join(outputDir, 'extracted-image.png');
  fs.writeFileSync(extractedPath, Buffer.from(result.dataUrl.split(',')[1], 'base64'));
  await page.locator('#novelai-result').screenshot({
    path: path.join(outputDir, 'browser-render.png')
  });
});
