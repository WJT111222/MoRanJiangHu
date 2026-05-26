import { test, expect } from '@playwright/test';
import { E2E_PARTNER_NAME, E2E_PLAYER_NAME } from './e2e-novel-injection-preseed.mjs';

test('novel injection options preseed object storage, names, CNB backend, and memory data', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_BASE_URL || 'http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.addScriptTag({ path: 'tests/e2e-novel-injection-preseed-browser.js' });

  const preseed = await page.evaluate(async ({ env }) => {
    return await window.__moranPreseedNovelInjectionE2E({
      objectStorage: {
        endpoint: env.MORAN_OSS_ENDPOINT || 'https://s3.hi168.com',
        bucket: env.MORAN_OSS_BUCKET || 'e2e-bucket-placeholder',
        accessKey: env.MORAN_OSS_ACCESS_KEY || 'e2e-access-key-placeholder',
        secretKey: env.MORAN_OSS_SECRET_KEY || 'e2e-secret-key-placeholder',
        username: env.MORAN_OSS_USERNAME || '红楼遗梦',
        prefix: env.MORAN_OSS_PREFIX || 'MoRanJiangHu'
      },
      registryBaseUrl: env.MORAN_E2E_REGISTRY_BASE_URL || window.location.origin,
      connectToken: env.CNB_IMAGE_BACKEND_CONNECT_TOKEN || '',
      cnbBackendUrl: env.MORAN_E2E_CNB_SMALL_BACKEND_URL || '',
      aiBaseUrl: env.MORAN_E2E_AI_BASE_URL || 'https://example.invalid/v1',
      aiApiKey: env.MORAN_E2E_AI_API_KEY || 'e2e-placeholder',
      aiModel: env.MORAN_E2E_AI_MODEL || 'e2e-model'
    });
  }, {
    env: {
      MORAN_OSS_ENDPOINT: process.env.MORAN_OSS_ENDPOINT || '',
      MORAN_OSS_BUCKET: process.env.MORAN_OSS_BUCKET || '',
      MORAN_OSS_ACCESS_KEY: process.env.MORAN_OSS_ACCESS_KEY || '',
      MORAN_OSS_SECRET_KEY: process.env.MORAN_OSS_SECRET_KEY || '',
      MORAN_OSS_USERNAME: process.env.MORAN_OSS_USERNAME || '',
      MORAN_OSS_PREFIX: process.env.MORAN_OSS_PREFIX || '',
      MORAN_E2E_REGISTRY_BASE_URL: process.env.MORAN_E2E_REGISTRY_BASE_URL || '',
      MORAN_E2E_CNB_SMALL_BACKEND_URL: process.env.MORAN_E2E_CNB_SMALL_BACKEND_URL || '',
      MORAN_E2E_AI_BASE_URL: process.env.MORAN_E2E_AI_BASE_URL || '',
      MORAN_E2E_AI_API_KEY: process.env.MORAN_E2E_AI_API_KEY || '',
      MORAN_E2E_AI_MODEL: process.env.MORAN_E2E_AI_MODEL || '',
      CNB_IMAGE_BACKEND_CONNECT_TOKEN: process.env.CNB_IMAGE_BACKEND_CONNECT_TOKEN || ''
    }
  });

  expect(preseed.playerName).toBe(E2E_PLAYER_NAME);
  expect(preseed.partnerName).toBe(E2E_PARTNER_NAME);

  const state = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('WuxiaGameDB', 3);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
    const getSetting = (key) => new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const req = tx.objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result?.value);
      req.onerror = () => reject(req.error);
    });
    const api = await getSetting('api_settings');
    const objectStorage = await getSetting('object_storage_sync_settings');
    const datasets = await getSetting('novel_decomposition_datasets');
    return {
      objectEndpoint: objectStorage?.endpoint || '',
      objectBucket: objectStorage?.bucket || '',
      cnbBackendUrl: api?.功能模型占位?.文生图模型API地址 || '',
      preserveOriginal: api?.功能模型占位?.小说拆分主剧情保留原文注入,
      optimizeLength: api?.功能模型占位?.小说拆分主剧情字数优化,
      rawText: datasets?.[0]?.分段列表?.[0]?.原文内容 || '',
      roles: datasets?.[0]?.分段列表?.[0]?.登场角色 || []
    };
  });

  expect(state.objectEndpoint).toContain('s3.hi168.com');
  expect(state.objectBucket.length).toBeGreaterThan(0);
  expect(state.preserveOriginal).toBe(true);
  expect(state.optimizeLength).toBe(false);
  expect(state.rawText).toContain('红楼遗梦');
  expect(state.roles).toContain(E2E_PLAYER_NAME);
  expect(state.roles).toContain(E2E_PARTNER_NAME);
});
