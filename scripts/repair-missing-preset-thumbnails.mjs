import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const rootDir = path.resolve(import.meta.dirname, '..');
const feedbackPath = path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json');

const args = process.argv.slice(2);
const argValue = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
};

const apply = args.includes('--apply');
const namesArg = argValue('names', '');
const selectedNames = namesArg
  ? new Set(namesArg.split(',').map((item) => item.trim()).filter(Boolean))
  : null;
const baseUrl = (process.env.MORAN_OPENLIST_BASE_URL || 'https://openlist.bacon.de5.net').replace(/\/+$/, '');
const authToken = process.env.MORAN_OPENLIST_AUTH_TOKEN || '';
const thumbsDir = '/Onedrive/MoRanJiangHu/preset-items/thumbs';
const timeoutMs = Math.max(10000, Number(argValue('timeout-ms', '90000')) || 90000);
const thumbSize = Math.max(160, Math.min(640, Number(argValue('size', '360')) || 360));
const thumbQuality = Math.max(0.45, Math.min(0.92, Number(argValue('quality', '0.78')) || 0.78));

if (apply && !authToken) {
  throw new Error('Missing MORAN_OPENLIST_AUTH_TOKEN.');
}

const listThumbFiles = async () => {
  const response = await fetch(`${baseUrl}/api/fs/list`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: thumbsDir,
      password: '',
      page: 1,
      per_page: 2000,
      refresh: false
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`OpenList list failed: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.code !== 200) throw new Error(`OpenList list rejected: ${JSON.stringify(payload).slice(0, 240)}`);
  return new Set((payload.data?.content || [])
    .filter((item) => !item.is_dir && item.name)
    .map((item) => String(item.name)));
};

const downloadImage = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`download failed ${response.status}: ${url}`);
  const contentType = response.headers.get('content-type') || 'image/png';
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, contentType };
};

const makeThumbnail = async (page, source) => {
  const base64 = source.bytes.toString('base64');
  const dataUrl = `data:${source.contentType};base64,${base64}`;
  const thumbDataUrl = await page.evaluate(async ({ dataUrl: input, size, quality }) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('thumbnail image decode failed'));
      img.src = input;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, size, size);
    const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const x = Math.round((size - width) / 2);
    const y = Math.round((size - height) / 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, x, y, width, height);
    return canvas.toDataURL('image/webp', quality);
  }, { dataUrl, size: thumbSize, quality: thumbQuality });
  return Buffer.from(thumbDataUrl.split(',')[1] || '', 'base64');
};

const uploadThumb = (filePath, fileName) => {
  const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const targetPath = `${thumbsDir}/${fileName}`;
  const result = spawnSync(curl, [
    '--fail',
    '--silent',
    '--show-error',
    '--location',
    '--retry', '5',
    '--retry-delay', '3',
    '--retry-all-errors',
    '--max-time', String(Math.ceil(timeoutMs / 1000)),
    '-X', 'PUT',
    '-H', `Authorization: ${authToken}`,
    '-H', `File-Path: ${targetPath}`,
    '-H', 'Content-Type: image/webp',
    '-H', 'Cache-Control: public, max-age=31536000, immutable',
    '--data-binary', `@${filePath}`,
    `${baseUrl}/api/fs/put`
  ], {
    cwd: rootDir,
    encoding: 'utf8',
    timeout: timeoutMs + 60000
  });
  if (result.status !== 0) {
    throw new Error(`OpenList upload failed for ${fileName}: ${(result.stderr || result.stdout || '').slice(0, 500)}`);
  }
  const payload = JSON.parse(result.stdout || '{}');
  if (payload?.code !== 200) {
    throw new Error(`OpenList upload rejected for ${fileName}: ${(result.stdout || '').slice(0, 500)}`);
  }
};

const feedback = JSON.parse(await fs.readFile(feedbackPath, 'utf8'));
const byName = new Map();
for (const item of feedback) {
  const name = String(item?.name || '').trim();
  const src = String(item?.src || '').trim();
  if (!name || !src || byName.has(name)) continue;
  if (selectedNames && !selectedNames.has(name)) continue;
  byName.set(name, { name, src, fileName: `${name}.webp` });
}

const existing = await listThumbFiles();
const missing = [...byName.values()]
  .filter((item) => !existing.has(item.fileName))
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

console.log(JSON.stringify({
  apply,
  candidates: byName.size,
  missing: missing.map((item) => item.fileName),
  thumbSize,
  thumbQuality
}, null, 2));

if (!apply || !missing.length) {
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  for (const item of missing) {
    const source = await downloadImage(item.src);
    const thumb = await makeThumbnail(page, source);
    const outPath = path.join(rootDir, 'output', 'preset-thumbs', item.fileName);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, thumb);
    uploadThumb(outPath, item.fileName);
    console.log(`[thumb] ${item.name}: ${source.bytes.length} -> ${thumb.length}`);
  }
} finally {
  await browser.close();
}
