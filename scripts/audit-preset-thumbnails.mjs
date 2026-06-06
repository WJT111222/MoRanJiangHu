import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const defaultFeedbackPath = path.join(rootDir, 'public', 'assets', 'item-preset-feedback-data.json');

const args = process.argv.slice(2);
const argValue = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
};

const liveBase = argValue('live-base', '').replace(/\/+$/, '');
const sourceArg = argValue('source', liveBase ? `${liveBase}/assets/item-preset-feedback-data.json` : defaultFeedbackPath);
const reportPath = argValue('report', '');
const timeoutMs = Math.max(1000, Number(argValue('timeout-ms', '15000')) || 15000);
const concurrency = Math.max(1, Math.min(64, Number(argValue('concurrency', '24')) || 24));
const checkSourceOnFail = args.includes('--check-source-on-fail');
const jsonOnly = args.includes('--json');
const browserMode = args.includes('--browser');
const pageUrl = argValue('page-url', liveBase ? `${liveBase}/item-preset-feedback` : '');

const readFeedbackData = async () => {
  if (/^https?:\/\//i.test(sourceArg)) {
    const response = await fetch(sourceArg, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) throw new Error(`Feedback data fetch failed (${response.status}): ${sourceArg}`);
    return response.json();
  }
  return JSON.parse(await fs.readFile(path.resolve(rootDir, sourceArg), 'utf8'));
};

const headImage = async (url) => {
  if (!url) return { ok: false, error: 'missing url' };
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeoutMs)
    });
    const contentType = response.headers.get('content-type') || '';
    const length = response.headers.get('content-length') || '';
    const imageLike = /^image\//i.test(contentType);
    return {
      ok: response.ok && imageLike,
      status: response.status,
      contentType,
      length,
      imageLike
    };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
};

const feedback = await readFeedbackData();
if (!Array.isArray(feedback)) {
  throw new Error('Feedback data must be an array.');
}

const uniqueItems = [];
const seenThumbs = new Set();
for (const item of feedback) {
  const name = String(item?.name || '').trim();
  const thumbSrc = String(item?.thumbSrc || '').trim();
  if (!name || !thumbSrc || seenThumbs.has(thumbSrc)) continue;
  seenThumbs.add(thumbSrc);
  uniqueItems.push({
    name,
    id: String(item?.id || ''),
    category: String(item?.category || ''),
    type: String(item?.type || ''),
    quality: String(item?.quality || ''),
    thumbSrc,
    src: String(item?.src || '').trim()
  });
}

let index = 0;
const results = [];

const worker = async () => {
  while (index < uniqueItems.length) {
    const item = uniqueItems[index];
    index += 1;
    const thumb = await headImage(item.thumbSrc);
    const source = !thumb.ok && checkSourceOnFail ? await headImage(item.src) : null;
    results.push({ ...item, thumb, source });
  }
};

await Promise.all(Array.from({ length: Math.min(concurrency, uniqueItems.length) }, worker));

let browserFailed = [];
if (browserMode) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    if (pageUrl) {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs * 4 });
      await page.waitForTimeout(1000);
    } else {
      await page.setContent('<!doctype html><meta charset="utf-8"><title>preset thumbnail audit</title>');
    }
    browserFailed = await page.evaluate(async ({ entries, concurrency, timeoutMs }) => {
      let current = 0;
      const failed = [];
      const loadOne = (entry) => new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => {
          failed.push({ name: entry.name, thumbSrc: entry.thumbSrc, error: 'timeout' });
          resolve(false);
        }, timeoutMs);
        img.onload = () => {
          clearTimeout(timer);
          resolve(true);
        };
        img.onerror = () => {
          clearTimeout(timer);
          failed.push({ name: entry.name, thumbSrc: entry.thumbSrc, error: 'onerror' });
          resolve(false);
        };
        img.src = entry.thumbSrc;
      });
      const worker = async () => {
        while (current < entries.length) {
          const entry = entries[current];
          current += 1;
          await loadOne(entry);
        }
      };
      await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, worker));
      return failed;
    }, { entries: uniqueItems, concurrency, timeoutMs });
  } finally {
    await browser.close();
  }
}

const failed = results
  .filter((item) => !item.thumb.ok)
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
const statusCounts = failed.reduce((acc, item) => {
  const key = item.thumb.status ? String(item.thumb.status) : (item.thumb.error || 'unknown');
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const summary = {
  source: sourceArg,
  pageUrl: browserMode ? pageUrl : '',
  feedbackEntries: feedback.length,
  uniqueThumbs: uniqueItems.length,
  thumbFailed: failed.length,
  browserThumbFailed: browserFailed.length,
  statusCounts
};

const output = { summary, failed, browserFailed };
if (reportPath) {
  const resolvedReportPath = path.resolve(rootDir, reportPath);
  await fs.mkdir(path.dirname(resolvedReportPath), { recursive: true });
  await fs.writeFile(resolvedReportPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

if (jsonOnly) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(JSON.stringify(summary, null, 2));
  if (failed.length) {
    console.log(JSON.stringify(failed.slice(0, 50), null, 2));
  }
}

if (failed.length || browserFailed.length) {
  process.exitCode = 1;
}
