import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';

const rootDir = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(rootDir, 'data', 'presetItemImages.ts');
const feedbackPath = path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json');
const outputDir = path.join(rootDir, '.tmp-preset-image2');

const deeparkBaseUrl = process.env.DEEPARK_IMAGE_BASE_URL || 'https://image.deepark.tech';
const deeparkCookie = process.env.DEEPARK_COOKIE || '';
const openaiImageBaseUrl = process.env.MORAN_GPT_IMAGE2_BASE_URL || '';
const openaiImageApiKey = process.env.MORAN_GPT_IMAGE2_API_KEY || '';
const nodeimageApiKey = process.env.NODEIMAGE_API_KEY || process.env.NODE_IMAGE_API_KEY || '';
const alt111666AuthToken = process.env.MORAN_111666_AUTH_TOKEN || '';
const s3Endpoint = (process.env.MORAN_OSS_ENDPOINT || 'https://s3.hi168.com').replace(/\/+$/, '');
const s3Bucket = process.env.MORAN_OSS_BUCKET || '';
const s3AccessKey = process.env.MORAN_OSS_ACCESS_KEY || '';
const s3SecretKey = process.env.MORAN_OSS_SECRET_KEY || '';
const s3Region = process.env.MORAN_OSS_REGION || 'auto';
const s3Prefix = (process.env.MORAN_OSS_PRESET_PREFIX || 'MoRanJiangHu/preset-items').replace(/^\/+|\/+$/g, '');
const s3CacheControl = process.env.MORAN_OSS_PRESET_CACHE_CONTROL || 'public, max-age=300, stale-while-revalidate=86400';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const reverse = args.includes('--reverse');
const allEntries = args.includes('--all-entries');
const reportArg = args.find(arg => arg.startsWith('--report='));
const reportFileName = (reportArg?.slice('--report='.length) || 'regenerate-report.json').replace(/[\\/]/g, '-');
const reportPath = path.join(outputDir, reportFileName);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = Math.max(1, Number(limitArg?.split('=')[1] || 1) || 1);
const startNameArg = args.find(arg => arg.startsWith('--start-name='));
const startName = (startNameArg?.slice('--start-name='.length) || '').trim();
const skipNames = new Set(args
  .filter(arg => arg.startsWith('--skip-name='))
  .map(arg => arg.slice('--skip-name='.length).trim())
  .filter(Boolean));
const onlyNames = new Set(args
  .filter(arg => arg.startsWith('--only-name='))
  .map(arg => arg.slice('--only-name='.length).trim())
  .filter(Boolean));
const existingUrlArg = args.find(arg => arg.startsWith('--existing-url='));
const existingUrl = (existingUrlArg?.slice('--existing-url='.length) || '').trim();
const existingNameArg = args.find(arg => arg.startsWith('--existing-name='));
const existingName = (existingNameArg?.slice('--existing-name='.length) || '').trim();
const categoriesArg = args.find(arg => arg.startsWith('--categories='));
const targetCategories = (categoriesArg?.slice('--categories='.length) || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);
const hostArg = args.find(arg => arg.startsWith('--host='));
const uploadHost = (hostArg?.slice('--host='.length) || 'nodeimage').trim().toLowerCase();
const providerArg = args.find(arg => arg.startsWith('--provider='));
const generationProvider = (providerArg?.slice('--provider='.length) || (openaiImageBaseUrl ? 'openai' : 'deepark')).trim().toLowerCase();
const concurrencyArg = args.find(arg => arg.startsWith('--concurrency='));
const concurrency = Math.max(1, Math.min(2, Number(concurrencyArg?.split('=')[1] || 2) || 2));

if (generationProvider === 'deepark' && !deeparkCookie && !existingUrl) {
  throw new Error('Missing DEEPARK_COOKIE environment variable.');
}
if (generationProvider === 'openai' && (!openaiImageBaseUrl || !openaiImageApiKey) && !existingUrl) {
  throw new Error('Missing MORAN_GPT_IMAGE2_BASE_URL or MORAN_GPT_IMAGE2_API_KEY environment variable.');
}
if (uploadHost === 'nodeimage' && !nodeimageApiKey) {
  throw new Error('Missing NODEIMAGE_API_KEY environment variable.');
}
if (uploadHost === '111666' && !alt111666AuthToken) {
  throw new Error('Missing MORAN_111666_AUTH_TOKEN environment variable.');
}
if (uploadHost === 'hi168' && (!s3Bucket || !s3AccessKey || !s3SecretKey)) {
  throw new Error('Missing MORAN_OSS_BUCKET, MORAN_OSS_ACCESS_KEY, or MORAN_OSS_SECRET_KEY environment variable.');
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const retryAsync = async (label, runner, attempts = 3) => {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await runner(attempt);
    } catch (error) {
      lastError = error;
      const message = error?.message || String(error);
      if (attempt >= attempts || !/fetch failed|ECONNRESET|ETIMEDOUT|timed out|HTTP 429|HTTP 5\d\d/i.test(message)) {
        break;
      }
      const delay = Math.min(30000, 3000 * attempt);
      console.warn(`[retry] ${label} attempt ${attempt}/${attempts} failed: ${message}; waiting ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
};

const ensureOutputDir = async () => {
  await fs.mkdir(outputDir, { recursive: true });
};

const withTimeout = async (factory, ms, label) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${ms}ms`)), ms);
  try {
    return await factory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const apiJson = async (pathOrUrl, options = {}) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${deeparkBaseUrl}${pathOrUrl}`;
  return withTimeout(async (signal) => {
    const response = await fetch(url, {
      method: options.method || 'GET',
      signal,
      headers: {
        cookie: deeparkCookie,
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 240)}`);
    return payload;
  }, options.timeoutMs || 60000, `request ${pathOrUrl}`);
};

const readReport = async () => {
  try {
    return JSON.parse(await fs.readFile(reportPath, 'utf8'));
  } catch {
    return { generatedAt: '', entries: [] };
  }
};

const writeReport = async (entries) => {
  await ensureOutputDir();
  await fs.writeFile(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    entries
  }, null, 2), 'utf8');
};

const collectPresetEntries = async () => {
  const source = await fs.readFile(registryPath, 'utf8');
  const marker = '// ─── 结构化物品库自动生成';
  const markerIndex = source.indexOf(marker);
  const entryPattern = /\{ 名称: '([^']+)', 类型: '([^']+)', 品质: '([^']+)', 图片URL: '([^']+)' \}/g;
  const entries = [];
  let match = null;
  while ((match = entryPattern.exec(source))) {
    if (!allEntries && markerIndex >= 0 && match.index < markerIndex) continue;
    entries.push({
      名称: match[1],
      类型: match[2],
      品质: match[3],
      图片URL: match[4],
      index: match.index
    });
  }
  const startIndex = startName ? Math.max(0, entries.findIndex(entry => entry.名称 === startName)) : 0;
  let filtered = entries.slice(startIndex).filter(entry => !skipNames.has(entry.名称));
  if (onlyNames.size > 0) {
    filtered = filtered.filter(entry => onlyNames.has(entry.名称));
  }
  if (targetCategories.length > 0) {
    const names = await collectCategoryNames(targetCategories);
    filtered = filtered.filter(entry => names.has(entry.名称));
  }
  if (reverse) filtered.reverse();
  return filtered;
};

const collectCategoryNames = async (categories) => {
  const raw = JSON.parse(await fs.readFile(feedbackPath, 'utf8'));
  const categorySet = new Set(categories);
  const names = [];
  const seen = new Set();
  for (const item of Array.isArray(raw) ? raw : []) {
    const category = String(item?.category || '').trim();
    const name = String(item?.name || '').trim();
    if (!categorySet.has(category) || !name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return new Set(names);
};

const collectAllPresetEntries = async () => {
  const savedStartName = startName;
  const source = await fs.readFile(registryPath, 'utf8');
  const marker = '// ─── 结构化物品库自动生成';
  const markerIndex = source.indexOf(marker);
  const entryPattern = /\{ 名称: '([^']+)', 类型: '([^']+)', 品质: '([^']+)', 图片URL: '([^']+)' \}/g;
  const entries = [];
  let match = null;
  while ((match = entryPattern.exec(source))) {
    if (!allEntries && markerIndex >= 0 && match.index < markerIndex) continue;
    entries.push({
      名称: match[1],
      类型: match[2],
      品质: match[3],
      图片URL: match[4],
      index: match.index
    });
  }
  void savedStartName;
  return entries;
};

const itemPrompt = (item) => {
  const englishNames = {
    智能手机: 'modern smartphone',
    急救包: 'red and white first aid kit',
    录音笔: 'digital voice recorder',
    笔记本电脑: 'laptop computer',
    防割手套: 'cut-resistant gloves',
    银行卡: 'bank card',
    古玉残佩: 'broken ancient jade pendant',
    现金信封: 'envelope of cash',
    合同文件: 'contract documents',
    证件夹: 'document ID holder',
    数据U盘: 'USB flash drive',
    维修工具箱: 'repair tool box',
    车钥匙: 'car key',
    电子元件包: 'electronics components kit',
    多功能工具钳: 'multitool pliers',
    备用电池组: 'spare battery pack',
    防身喷雾: 'pepper spray canister',
    伸缩警棍: 'telescopic baton',
    轻便夹克: 'lightweight jacket',
    运动鞋: 'sneakers',
    防护口罩: 'protective face mask',
    电脑维修手册: 'computer repair manual',
    急救手册: 'first aid manual',
    便携检测仪: 'portable detector device',
    防护服: 'protective suit',
    异常样本盒: 'sealed anomaly sample case',
    灵能探测器: 'paranormal energy detector',
    银戒指: 'silver ring',
    灵气抑制贴: 'small adhesive suppression patch',
    怀表: 'pocket watch',
    罐头包: 'pack of canned food',
    净水片: 'water purification tablets',
    手摇电筒: 'hand-crank flashlight',
    弩机组件: 'crossbow mechanism parts',
    抗生素散盒: 'box of antibiotics',
    饮水瓶: 'water bottle',
    汽油桶: 'red gasoline can',
    压缩饼干: 'compressed biscuit pack',
    医用绷带: 'medical bandage roll',
    止血带: 'tourniquet',
    过滤水壶: 'water filter pitcher',
    干电池组: 'dry cell battery pack',
    净水滤芯: 'water filter cartridge',
    太阳能充电板: 'portable solar charging panel',
    弹药盒: 'ammunition box',
    护目镜: 'protective goggles',
    防毒面具: 'gas mask',
    撬棍: 'crowbar',
    战术背心: 'tactical vest',
    消音弩: 'silent crossbow',
    求生手册: 'survival manual',
    营地通行证: 'camp access pass',
    无线电台: 'portable radio transceiver',
    防水火柴: 'waterproof matches',
    感染检测卡: 'infection test card'
  };
  const englishName = englishNames[item.名称] || item.名称;
  const materialHint = item.名称.includes('木') ? 'wooden'
    : item.名称.includes('竹') ? 'bamboo'
      : item.名称.includes('铁') ? 'dark iron'
        : item.名称.includes('钢') ? 'polished steel'
          : '';
  return [
    `Crisp 1024 square RPG inventory icon: ${englishName}.`,
    materialHint ? `${materialHint} material.` : '',
    'Single object centered, full object visible, high-resolution realistic product detail, deep charcoal dark studio background, cinematic rim light, crisp edges, subtle grounded shadow.',
    'No text, no label, no person, no UI frame.'
  ].filter(Boolean).join(' ');
};

const createGeneration = async (item) => {
  const clientTaskId = `msjh_preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await apiJson('/api/creation-tasks/image-generations', {
    method: 'POST',
    body: {
      client_task_id: clientTaskId,
      prompt: itemPrompt(item),
      model: 'gpt-image-2',
      image_resolution: '1024x1024',
      quality: 'high',
      output_format: 'png',
      visibility: 'private',
      n: 1
    }
  });
  return clientTaskId;
};

const pollGeneration = async (taskId) => {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    await sleep(attempt < 3 ? 2000 : 5000);
    const payload = await apiJson(`/api/creation-tasks?ids=${encodeURIComponent(taskId)}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      timeoutMs: 30000
    });
    const item = Array.isArray(payload?.items) ? payload.items[0] : null;
    const status = String(item?.status || '').toLowerCase();
    if (status === 'success' || status === 'succeeded' || status === 'completed') {
      const imageUrl = Array.isArray(item?.data) ? item.data.find(output => output?.url)?.url : '';
      if (!imageUrl) throw new Error(`task ${taskId} succeeded without image url`);
      return { task: item, imageUrl };
    }
    if (status === 'failed' || status === 'error' || status === 'cancelled') {
      throw new Error(item?.error || item?.error_message || `task ${taskId} failed`);
    }
  }
  throw new Error(`task ${taskId} timed out`);
};

const generateOpenAIImage = async (item) => withTimeout(async (signal) => {
  const normalizedBase = openaiImageBaseUrl.replace(/\/$/, '').replace(/\/v1$/i, '');
  const endpoint = `${normalizedBase}/v1/images/generations`;
  const safeName = item.名称.replace(/[^\p{Letter}\p{Number}_-]+/gu, '-');
  const requestPath = path.join(outputDir, `image-request-${Date.now()}-${safeName}.json`);
  const responsePath = path.join(outputDir, `image-response-${Date.now()}-${safeName}.json`);
  await fs.writeFile(requestPath, JSON.stringify({
    model: 'gpt-image-2',
    prompt: itemPrompt(item),
    size: '1024x1024',
    quality: 'high',
    n: 1
  }), 'utf8');
  await new Promise((resolve, reject) => {
    const child = execFile('curl.exe', [
      '--retry', '2',
      '--retry-delay', '3',
      '--connect-timeout', '30',
      '--max-time', '900',
      '-sS',
      endpoint,
      '-H', `Authorization: Bearer ${openaiImageApiKey}`,
      '-H', 'Content-Type: application/json',
      '--data-binary', `@${requestPath}`,
      '-o', responsePath
    ], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.trim() || error.message));
        return;
      }
      resolve(String(stdout || ''));
    });
    signal.addEventListener('abort', () => {
      child.kill();
      reject(signal.reason || new Error('generation aborted'));
    }, { once: true });
  });
  const text = await fs.readFile(responsePath, 'utf8');
  await fs.rm(requestPath, { force: true }).catch(() => undefined);
  await fs.rm(responsePath, { force: true }).catch(() => undefined);
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (payload?.error) {
    const message = payload?.error?.message || text.slice(0, 240);
    throw new Error(`image API error: ${message}`);
  }
  const output = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (output?.b64_json) {
    const bytes = Uint8Array.from(Buffer.from(output.b64_json, 'base64'));
    return {
      task: payload,
      imageUrl: output.url || '',
      image: { bytes, contentType: 'image/png', ext: 'png' }
    };
  }
  if (output?.url) {
    return { task: payload, imageUrl: output.url };
  }
  throw new Error(`image API response did not contain image data`);
}, 930000, 'openai image generation');

const generateImage = async (item) => {
  if (generationProvider === 'openai') {
    return retryAsync(`generate ${item.名称}`, () => generateOpenAIImage(item), 4);
  }
  return retryAsync(`generate ${item.名称}`, async () => {
    const taskId = await createGeneration(item);
    const generated = await pollGeneration(taskId);
    return { ...generated, taskId };
  }, 3);
};

const sniffImageType = (bytes, fallbackContentType = '') => {
  if (bytes?.[0] === 0xff && bytes?.[1] === 0xd8 && bytes?.[2] === 0xff) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (bytes?.[0] === 0x89 && bytes?.[1] === 0x50 && bytes?.[2] === 0x4e && bytes?.[3] === 0x47) return { contentType: 'image/png', ext: 'png' };
  if (/jpeg/i.test(fallbackContentType)) return { contentType: 'image/jpeg', ext: 'jpg' };
  return { contentType: 'image/png', ext: 'png' };
};

const downloadImage = async (url) => withTimeout(async (signal) => {
  const response = await fetch(url, {
    signal,
    headers: {
      cookie: deeparkCookie,
      'user-agent': 'Mozilla/5.0',
      'cache-control': 'no-cache'
    }
  });
  if (!response.ok) throw new Error(`download HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const type = sniffImageType(bytes, response.headers.get('content-type') || 'image/png');
  return { bytes, ...type };
}, 60000, 'download image');

const extractStrings = (value, output = []) => {
  if (typeof value === 'string') {
    output.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(item => extractStrings(item, output));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(item => extractStrings(item, output));
  }
  return output;
};

const extractNodeImageUrl = (payload) => {
  const strings = extractStrings(payload);
  return strings.find(value => /^https?:\/\/[^ "'<>]+nodeimage\.com\/[^ "'<>]+/i.test(value))
    || strings.find(value => /^https?:\/\/[^ "'<>]+\.(?:png|jpg|jpeg|webp)(?:\?[^ "'<>]*)?$/i.test(value))
    || '';
};

const uploadToNodeimage = async (item, image) => withTimeout(async (signal) => {
  const form = new FormData();
  const safeName = item.名称.replace(/[^\p{Letter}\p{Number}_-]+/gu, '-');
  form.append('image', new Blob([image.bytes], { type: image.contentType }), `preset-${safeName}.${image.ext}`);
  const response = await fetch('https://api.nodeimage.com/api/upload', {
    method: 'POST',
    signal,
    headers: { 'X-API-Key': nodeimageApiKey },
    body: form
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) throw new Error(`nodeimage HTTP ${response.status}: ${text.slice(0, 240)}`);
  const nodeimageUrl = extractNodeImageUrl(payload);
  if (!nodeimageUrl) throw new Error(`nodeimage response did not contain image URL: ${text.slice(0, 240)}`);
  return { nodeimageUrl, payload };
}, 90000, 'upload nodeimage');

const uploadTo111666 = async (item, image) => withTimeout(async (signal) => {
  const safeName = item.名称.replace(/[^\p{Letter}\p{Number}_-]+/gu, '-');
  const filePath = path.join(outputDir, `upload-${Date.now()}-${safeName}.${image.ext}`);
  await fs.writeFile(filePath, image.bytes);
  const text = await new Promise((resolve, reject) => {
    const child = execFile('curl.exe', [
      '--retry', '3',
      '--retry-delay', '2',
      '--connect-timeout', '20',
      '--max-time', '180',
      '-sS',
      '-F', `image=@${filePath}`,
      'https://i.111666.best/image',
      '-H', `Auth-Token: ${alt111666AuthToken}`
    ], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.trim() || error.message));
        return;
      }
      resolve(String(stdout || ''));
    });
    signal.addEventListener('abort', () => {
      child.kill();
      reject(signal.reason || new Error('upload aborted'));
    }, { once: true });
  });
  await fs.rm(filePath, { force: true }).catch(() => undefined);
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  const src = typeof payload?.src === 'string' ? payload.src.trim() : '';
  if (!src) throw new Error(`111666 response did not contain src: ${text.slice(0, 240)}`);
  return {
    nodeimageUrl: src.startsWith('http') ? src : `https://i.111666.best${src}`,
    payload
  };
}, 90000, 'upload 111666');


const normalizeS3Key = (key) => key.replace(/^\/+/, '').replace(/\/+/g, '/');
const encodeS3Key = (key) => normalizeS3Key(key).split('/').map(part => encodeURIComponent(part)).join('/');
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();
const hmacHex = (key, value) => crypto.createHmac('sha256', key).update(value).digest('hex');
const sha256Hex = (body) => crypto.createHash('sha256').update(body).digest('hex');
const formatAmzDate = (date) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
};
const s3SigningKey = (dateStamp) => {
  const kDate = hmac(Buffer.from(`AWS4${s3SecretKey}`, 'utf8'), dateStamp);
  const kRegion = hmac(kDate, s3Region);
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
};
const s3ObjectUrl = (key) => new URL(`${s3Endpoint}/${encodeURIComponent(s3Bucket)}/${encodeS3Key(key)}`);
const buildS3SignedHeaders = ({ method, url, body, contentType }) => {
  const { amzDate, dateStamp } = formatAmzDate(new Date());
  const bodyHash = sha256Hex(body);
  const canonicalHeaders = [
    `cache-control:${s3CacheControl}\n`,
    `content-type:${contentType}\n`,
    `host:${url.host}\n`,
    'x-amz-acl:public-read\n',
    `x-amz-content-sha256:${bodyHash}\n`,
    `x-amz-date:${amzDate}\n`
  ].join('');
  const signedHeaders = 'cache-control;content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    method,
    url.pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    bodyHash
  ].join('\n');
  const credentialScope = `${dateStamp}/${s3Region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');
  const signature = hmacHex(s3SigningKey(dateStamp), stringToSign);
  return {
    'Cache-Control': s3CacheControl,
    'Content-Type': contentType,
    'x-amz-acl': 'public-read',
    'X-Amz-Content-Sha256': bodyHash,
    'X-Amz-Date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${s3AccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
};
const putS3Object = ({ url, headers, body, signal }) => new Promise((resolve, reject) => {
  const transport = url.protocol === 'http:' ? http : https;
  const request = transport.request(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Length': body.byteLength },
    timeout: 90000
  }, (response) => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if ((response.statusCode || 0) < 200 || (response.statusCode || 0) >= 300) {
        reject(new Error(`hi168 PUT failed (${response.statusCode}): ${text.slice(0, 240)}`));
      } else {
        resolve({ text, status: response.statusCode || 0 });
      }
    });
  });
  request.on('timeout', () => request.destroy(new Error('hi168 PUT timed out')));
  request.on('error', reject);
  signal.addEventListener('abort', () => request.destroy(signal.reason || new Error('upload aborted')), { once: true });
  request.end(body);
});
const uploadToHi168 = async (item, image) => withTimeout(async (signal) => {
  const itemName = String(Object.values(item || {})[0] || 'item');
  const safeName = itemName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'item';
  const key = normalizeS3Key(`${s3Prefix}/${safeName}.${image.ext}`);
  const url = s3ObjectUrl(key);
  const body = Buffer.from(image.bytes);
  await putS3Object({
    url,
    body,
    signal,
    headers: buildS3SignedHeaders({ method: 'PUT', url, body, contentType: image.contentType })
  });
  return { nodeimageUrl: url.toString(), payload: { key } };
}, 90000, 'upload hi168');

const uploadHostedImage = async (item, image) => (
  retryAsync(`upload ${item.名称}`, () => (
    uploadHost === '111666'
      ? uploadTo111666(item, image)
      : uploadHost === 'hi168'
        ? uploadToHi168(item, image)
        : uploadToNodeimage(item, image)
  ), 4)
);

const replaceRegistryUrls = async (mapping) => {
  let source = await fs.readFile(registryPath, 'utf8');
  for (const entry of mapping) {
    source = source.split(entry.oldUrl).join(entry.nodeimageUrl);
  }
  await fs.writeFile(registryPath, source, 'utf8');
};

const runPool = async (items, worker) => {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
};

await ensureOutputDir();
const previousReport = await readReport();
const entries = Array.isArray(previousReport.entries) ? [...previousReport.entries] : [];
const completedNames = new Set(entries.filter(entry => entry?.nodeimageUrl).map(entry => entry.name));
const presetEntries = await collectPresetEntries();
const allPresetEntries = existingName ? await collectAllPresetEntries() : presetEntries;
const selected = existingUrl && existingName ? [] : presetEntries
  .filter(entry => !completedNames.has(entry.名称))
  .slice(0, limit);

if (existingUrl && existingName) {
  const existingItem = allPresetEntries.find(entry => entry.名称 === existingName);
  if (!existingItem) throw new Error(`Cannot find preset item ${existingName}`);
  const image = await downloadImage(existingUrl);
  const uploaded = await uploadHostedImage(existingItem, image);
  entries.push({
    name: existingItem.名称,
    type: existingItem.类型,
    quality: existingItem.品质,
    oldUrl: existingItem.图片URL,
    generatedUrl: existingUrl,
    nodeimageUrl: uploaded.nodeimageUrl,
    status: 'success'
  });
  console.log(`[uploaded existing] ${existingItem.名称} -> ${uploaded.nodeimageUrl}`);
}

console.log(`Selected ${selected.length} preset images; apply=${apply}; concurrency=${concurrency}`);
await runPool(selected, async (item) => {
  const startedAt = Date.now();
  try {
    console.log(`[generate] ${item.名称}`);
    const generated = await generateImage(item);
    const image = generated.image || await downloadImage(generated.imageUrl);
    const uploaded = await uploadHostedImage(item, image);
    entries.push({
      name: item.名称,
      type: item.类型,
      quality: item.品质,
      oldUrl: item.图片URL,
      taskId: generated.taskId || '',
      provider: generationProvider,
      generatedUrl: generated.imageUrl,
      nodeimageUrl: uploaded.nodeimageUrl,
      durationMs: Date.now() - startedAt,
      status: 'success'
    });
    await writeReport(entries);
    console.log(`[success] ${item.名称} -> ${uploaded.nodeimageUrl}`);
  } catch (error) {
    entries.push({
      name: item.名称,
      type: item.类型,
      quality: item.品质,
      oldUrl: item.图片URL,
      error: error?.message || String(error),
      durationMs: Date.now() - startedAt,
      status: 'failed'
    });
    await writeReport(entries);
    console.error(`[failed] ${item.名称}: ${error?.message || String(error)}`);
  }
});

await writeReport(entries);
const successEntries = entries.filter(entry => entry?.status === 'success' && entry.oldUrl && entry.nodeimageUrl);
if (apply) {
  await replaceRegistryUrls(successEntries);
  console.log(`Updated ${successEntries.length} preset image URLs in ${path.relative(rootDir, registryPath)}.`);
} else {
  console.log(`Dry run completed with ${successEntries.length} generated image URLs.`);
}
