/**
 * 迁移 msjh 代理预设图到 nodeimage 图床。
 *
 * 背景：
 * - registry (data/presetItemImages.ts) 与 feedback
 *   (public/assets/item-preset-feedback-data.json) 里的预设物品原图当前指向
 *   https://msjh.bacon159.pp.ua/api/preset-image/<中文名>.png（走 Cloudflare + OpenList + OneDrive，国内慢）。
 * - 本脚本把这些原图迁移到 nodeimage（cdn.nodeimage.com，国内无代理更快）。
 *
 * 关键点：
 * - 只迁移原图 PNG，排除 thumbs/*.webp 缩略图。
 * - 下载走 OpenList 直连源（159.138.7.126:5244），比公网 msjh 代理快 5-10 倍。
 * - nodeimage 列表端点用 API Key 会 401（需 NodeSeek 登录 session），无法用 API 查已传列表；
 *   因此用本地报告 output/nodeimage-msjh-preset-migration.json 做去重与断点续传。
 * - API Key 从环境变量 NODEIMAGE_API_KEY 读取，OpenList token 从 MORAN_OPENLIST_AUTH_TOKEN 读取，
 *   都不写进仓库文件。
 *
 * 用法：
 *   node scripts/migrate-preset-images-msjh-nodeimage.mjs                 # dry run，只上传不回填
 *   node scripts/migrate-preset-images-msjh-nodeimage.mjs --apply         # 上传并回填 registry+feedback
 *   node scripts/migrate-preset-images-msjh-nodeimage.mjs --limit=5       # 只处理前 5 张（试跑）
 *   node scripts/migrate-preset-images-msjh-nodeimage.mjs --concurrency=4 # 并发数
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(rootDir, 'data', 'presetItemImages.ts');
const feedbackPath = path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json');
const outputDir = path.join(rootDir, 'output');
const reportPath = path.join(outputDir, 'nodeimage-msjh-preset-migration.json');

const uploadUrl = 'https://api.nodeimage.com/api/upload';
const openlistBase = process.env.MORAN_OPENLIST_DIRECT_BASE_URL || 'http://159.138.7.126:5244';
const openlistDir = '/Onedrive/MoRanJiangHu/preset-items';

// 只匹配 msjh 代理原图 PNG，排除 thumbs/*.webp。
const msjhPngPattern = /https:\/\/msjh\.bacon159\.pp\.ua\/api\/preset-image\/(?!thumbs\/)[^'"\s,}]+?\.png/g;

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const concurrencyArg = process.argv.find(arg => arg.startsWith('--concurrency='));
const concurrency = Math.max(1, Number(concurrencyArg?.split('=')[1] || 4) || 4);
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Math.max(0, Number(limitArg.split('=')[1]) || 0) : 0;

const apiKey = process.env.NODEIMAGE_API_KEY || process.env.NODE_IMAGE_API_KEY || '';
if (!apiKey) {
  throw new Error('Missing NODEIMAGE_API_KEY environment variable.');
}
const openlistToken = process.env.MORAN_OPENLIST_AUTH_TOKEN || '';
if (!openlistToken) {
  throw new Error('Missing MORAN_OPENLIST_AUTH_TOKEN environment variable.');
}

const ensureOutput = async () => {
  await fs.mkdir(outputDir, { recursive: true });
};

const readReport = async () => {
  try {
    return JSON.parse(await fs.readFile(reportPath, 'utf8'));
  } catch {
    return { generatedAt: '', entries: [] };
  }
};

const writeReport = async (entries) => {
  await ensureOutput();
  const payload = JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'nodeimage',
    origin: 'msjh-preset-image',
    entries
  }, null, 2);
  const tempPath = `${reportPath}.tmp`;
  await fs.writeFile(tempPath, payload, 'utf8');
  await fs.rename(tempPath, reportPath).catch(async () => {
    await fs.rm(reportPath, { force: true }).catch(() => undefined);
    await fs.rename(tempPath, reportPath);
  });
};

const collectUrls = async () => {
  const files = [registryPath, feedbackPath];
  const urls = new Set();
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    for (const match of text.matchAll(msjhPngPattern)) {
      urls.add(match[0]);
    }
  }
  return Array.from(urls);
};

// 从 msjh URL 解出文件名，例如 .../preset-image/%E9%9D%92%E9%92%A2%E5%89%91.png -> 青钢剑.png
const filenameFromUrl = (url) => {
  const pathname = new URL(url).pathname;
  const encoded = pathname.replace(/^.*\/preset-image\//, '');
  return decodeURIComponent(encoded);
};

const withTimeout = async (promiseFactory, ms, label) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${ms}ms`)), ms);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

// 一次性拉取 OpenList 目录，构造 {文件名 -> sign} 映射。
const fetchSignMap = async () => {
  const response = await withTimeout(async (signal) => {
    return fetch(`${openlistBase}/api/fs/list`, {
      method: 'POST',
      signal,
      headers: { 'Authorization': openlistToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: openlistDir, page: 1, per_page: 10000, refresh: false })
    });
  }, 30000, 'openlist-list');
  const json = await response.json();
  if (json?.code !== 200 || !Array.isArray(json?.data?.content)) {
    throw new Error(`OpenList list failed: ${JSON.stringify(json).slice(0, 240)}`);
  }
  const map = new Map();
  for (const item of json.data.content) {
    if (item && !item.is_dir && typeof item.name === 'string') {
      map.set(item.name, item.sign || '');
    }
  }
  return map;
};

const sniffImageType = (bytes) => {
  if (bytes?.[0] === 0xff && bytes?.[1] === 0xd8 && bytes?.[2] === 0xff) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (bytes?.[0] === 0x89 && bytes?.[1] === 0x50 && bytes?.[2] === 0x4e && bytes?.[3] === 0x47) return { contentType: 'image/png', ext: 'png' };
  if (
    bytes?.[0] === 0x52 && bytes?.[1] === 0x49 && bytes?.[2] === 0x46 && bytes?.[3] === 0x46
    && bytes?.[8] === 0x57 && bytes?.[9] === 0x45 && bytes?.[10] === 0x42 && bytes?.[11] === 0x50
  ) return { contentType: 'image/webp', ext: 'webp' };
  return { contentType: 'image/png', ext: 'png' };
};

// 从 OpenList 直连源下载原图。
const downloadFromOpenList = async (filename, signMap) => {
  if (!signMap.has(filename)) throw new Error(`filename not found in OpenList dir: ${filename}`);
  const sign = signMap.get(filename);
  const url = `${openlistBase}/p${openlistDir}/${encodeURIComponent(filename)}${sign ? `?sign=${sign}` : ''}`;
  return withTimeout(async (signal) => {
    const response = await fetch(url, { signal, headers: { 'cache-control': 'no-cache' } });
    if (!response.ok) throw new Error(`download HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0) throw new Error('download returned 0 bytes');
    const sniffed = sniffImageType(bytes);
    return { bytes, contentType: sniffed.contentType, ext: sniffed.ext };
  }, 60000, 'download');
};

const extractStrings = (value, output = []) => {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) for (const item of value) extractStrings(item, output);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) extractStrings(item, output);
  return output;
};

const extractNodeImageUrl = (payload) => {
  // nodeimage 成功响应: { success, links: { direct: "https://cdn.nodeimage.com/i/xxx.png", ... } }
  const direct = payload?.links?.direct;
  if (typeof direct === 'string' && direct) return direct;
  const strings = extractStrings(payload);
  return strings.find(value => /^https?:\/\/[^ "'<>]*nodeimage\.com\/[^ "'<>]+/i.test(value)) || '';
};

const uploadImage = async (filename, image) => {
  return withTimeout(async (signal) => {
    const form = new FormData();
    const blob = new Blob([image.bytes], { type: image.contentType });
    form.append('image', blob, filename);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      signal,
      headers: { 'X-API-Key': apiKey },
      body: form
    });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
    if (!response.ok) throw new Error(`upload HTTP ${response.status}: ${text.slice(0, 240)}`);
    const nodeimageUrl = extractNodeImageUrl(payload);
    if (!nodeimageUrl) throw new Error(`upload response has no image URL: ${text.slice(0, 240)}`);
    return { nodeimageUrl, payload };
  }, 90000, 'upload');
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadImageWithRetry = async (filename, image) => {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await uploadImage(filename, image);
    } catch (error) {
      lastError = error;
      const message = error?.message || String(error);
      if (!/HTTP 429|请求过于频繁|too many/i.test(message) || attempt === 5) break;
      await sleep(65000);
    }
  }
  throw lastError;
};

const runPool = async (items, worker) => {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item, index, items.length);
    }
  });
  await Promise.all(workers);
};

const replaceInFile = async (file, mapping) => {
  let source = await fs.readFile(file, 'utf8');
  let changed = 0;
  for (const [oldUrl, newUrl] of mapping.entries()) {
    if (!source.includes(oldUrl)) continue;
    source = source.split(oldUrl).join(newUrl);
    changed += 1;
  }
  await fs.writeFile(file, source, 'utf8');
  return changed;
};

await ensureOutput();
const report = await readReport();
const previous = new Map((report.entries || [])
  .filter(entry => entry?.oldUrl && entry?.nodeimageUrl)
  .map(entry => [entry.oldUrl, entry]));
const allUrls = await collectUrls();
const pending = allUrls.filter(url => !previous.has(url)).slice(0, limit || undefined);
const entries = [...previous.values()];
const failed = [];

console.log(`Preset image URLs: ${allUrls.length}; already uploaded: ${previous.size}; pending: ${pending.length}; concurrency=${concurrency}; apply=${apply}`);

let signMap = new Map();
if (pending.length > 0) {
  signMap = await fetchSignMap();
  console.log(`OpenList sign map: ${signMap.size} files`);
}

await runPool(pending, async (oldUrl, done, total) => {
  const startedAt = Date.now();
  const filename = filenameFromUrl(oldUrl);
  try {
    const image = await downloadFromOpenList(filename, signMap);
    const uploaded = await uploadImageWithRetry(filename, image);
    const entry = {
      oldUrl,
      filename,
      nodeimageUrl: uploaded.nodeimageUrl,
      bytes: image.bytes.length,
      contentType: image.contentType,
      durationMs: Date.now() - startedAt
    };
    entries.push(entry);
    previous.set(oldUrl, entry);
    console.log(`[${done}/${total}] ${filename} -> ${uploaded.nodeimageUrl} (${Math.round(image.bytes.length / 1024)} KiB)`);
  } catch (error) {
    const entry = { oldUrl, filename, error: error?.message || String(error), durationMs: Date.now() - startedAt };
    failed.push(entry);
    entries.push(entry);
    console.warn(`[${done}/${total}] ${filename} failed: ${entry.error}`);
  }
  await writeReport(entries);
});

const successful = entries.filter(entry => entry?.oldUrl && entry?.nodeimageUrl);
const mapping = new Map(successful.map(entry => [entry.oldUrl, entry.nodeimageUrl]));
let changedFiles = [];
if (apply) {
  changedFiles = [
    { path: path.relative(rootDir, registryPath).replace(/\\/g, '/'), changed: await replaceInFile(registryPath, mapping) },
    { path: path.relative(rootDir, feedbackPath).replace(/\\/g, '/'), changed: await replaceInFile(feedbackPath, mapping) }
  ];
}

await writeReport(entries);
console.log(JSON.stringify({
  totalOldUrls: allUrls.length,
  uploaded: successful.length,
  failed: failed.length,
  apply,
  changedFiles,
  report: path.relative(rootDir, reportPath).replace(/\\/g, '/')
}, null, 2));
