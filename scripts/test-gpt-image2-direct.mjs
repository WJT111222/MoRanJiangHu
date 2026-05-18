#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const readArg = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const apiBase = readArg('api-base', process.env.GPT_IMAGE_API_BASE || 'https://123887766.xyz/v1').replace(/\/+$/, '');
const model = readArg('model', process.env.GPT_IMAGE_MODEL || 'gpt-image-2');
const out = readArg('out', 'output/gpt-image2-direct-test/test.png');
const prompt = readArg(
  'prompt',
  'photorealistic product photo of a single snake gallbladder used as a wuxia medicine ingredient, small dark green oval organ in a shallow ceramic dish, warm parchment background, isolated inventory item, clean silhouette, no text, no labels, no watermark'
);
const normalizeSecret = (value = '') => String(value).trim().replace(/^["']|["']$/g, '');
const apiKey = normalizeSecret(process.env.GPT_IMAGE_API_KEY || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || '');

if (!apiKey) {
  throw new Error('Missing GPT_IMAGE_API_KEY / IMAGE_API_KEY / OPENAI_API_KEY environment variable.');
}

const startedAt = Date.now();
const response = await fetch(`${apiBase}/images/generations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model,
    prompt,
    size: readArg('size', '1024x1024'),
    n: 1
  })
});

const responseText = await response.text();
if (!response.ok) {
  throw new Error(`Image request failed: ${response.status} ${responseText.slice(0, 600)}`);
}

const payload = JSON.parse(responseText);
const item = payload?.data?.[0];
let imageBytes;
if (item?.b64_json) {
  imageBytes = Buffer.from(item.b64_json, 'base64');
} else if (item?.url) {
  const imageResponse = await fetch(item.url);
  if (!imageResponse.ok) {
    throw new Error(`Image download failed: ${imageResponse.status}`);
  }
  imageBytes = Buffer.from(await imageResponse.arrayBuffer());
} else {
  throw new Error(`Image response has no b64_json or url. Keys: ${Object.keys(item || {}).join(', ')}`);
}

await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, imageBytes);
await fs.writeFile(
  path.join(path.dirname(out), 'response-summary.json'),
  JSON.stringify({
    ok: true,
    apiBase,
    model,
    seconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
    bytes: imageBytes.length,
    responseKeys: Object.keys(item || {})
  }, null, 2),
  'utf8'
);

console.log(JSON.stringify({
  ok: true,
  seconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  bytes: imageBytes.length,
  out
}, null, 2));
