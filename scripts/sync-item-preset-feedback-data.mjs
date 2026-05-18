import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'presetItemImages.ts');
const outputPath = path.join(root, 'public', 'assets', 'item-preset-feedback-data.json');

const source = fs.readFileSync(sourcePath, 'utf8');
const itemPattern = /\{\s*名称:\s*'([^']+)'\s*,\s*类型:\s*'([^']+)'\s*,\s*品质:\s*'([^']+)'\s*,\s*图片URL:\s*'([^']+)'\s*\}/g;

const items = [];
const seen = new Set();
for (const match of source.matchAll(itemPattern)) {
  const [, name, type, quality, src] = match;
  if (seen.has(name)) continue;
  seen.add(name);
  items.push({
    name,
    type,
    quality,
    src,
    source: /^https?:\/\//i.test(src) ? '远程图' : '本地',
  });
}

if (!items.length) {
  throw new Error(`No preset item images parsed from ${sourcePath}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
console.log(`Synced ${items.length} item preset feedback entries to ${outputPath}`);
