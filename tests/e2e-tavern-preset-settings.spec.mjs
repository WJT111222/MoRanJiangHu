import { test, expect } from '@playwright/test';

const localPreset = {
  prompts: [
    {
      identifier: 'main',
      name: 'Main',
      role: 'system',
      content: 'E2E local tavern preset'
    }
  ],
  prompt_order: [
    {
      character_id: 100001,
      order: [{ identifier: 'main', enabled: true }]
    }
  ]
};

const localEntry = {
  id: 'local-upload-e2e',
  名称: '玩家上传 E2E',
  预设: localPreset,
  角色ID: 100001,
  导入时间: 1760000000000,
  来源: '玩家自行上传'
};

const seedGameSettings = async (page) => {
  await page.evaluate(async ({ localEntry, localPreset }) => {
    const request = indexedDB.open('WuxiaGameDB', 3);
    const db = await new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('image_assets')) db.createObjectStore('image_assets', { keyPath: 'id' });
      };
    });

    await new Promise((resolve, reject) => {
      const tx = db.transaction(['settings'], 'readwrite');
      tx.objectStore('settings').put({
        key: 'game_settings',
        value: {
          启用酒馆预设模式: true,
          酒馆预设列表: [localEntry],
          当前酒馆预设ID: localEntry.id,
          酒馆预设: localPreset,
          酒馆预设名称: localEntry.名称,
          酒馆预设角色ID: localEntry.角色ID
        },
        version: 2,
        updatedAt: Date.now(),
        category: 'gameplay'
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, { localEntry, localPreset });
};

const openTavernPresetSettings = async (page) => {
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByRole('button', { name: '酒馆预设' }).click();
  await expect(page.getByRole('heading', { name: '酒馆预设' })).toBeVisible();
};

const presetSelect = (page) => page
  .locator('xpath=//label[normalize-space(.)="当前预设"]/following-sibling::select[1]')
  .filter({ visible: true })
  .first();

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('moranjianghu.releaseNotesSuppressDate', new Date().toISOString().slice(0, 10));
    document.documentElement.dataset.theme = 'day';
  });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await seedGameSettings(page);
  await page.reload({ waitUntil: 'networkidle' });
});

test('tavern preset dropdown keeps workshop presets and protects deletion flows', async ({ page }) => {
  test.setTimeout(45000);
  await openTavernPresetSettings(page);

  const select = presetSelect(page);
  await expect(select.locator('option[value="workshop:tavern-preset-izumi-0623"]')).toHaveCount(1);
  await expect(select.locator('option[value="local-upload-e2e"]')).toHaveCount(1);

  await expect
    .poll(async () => await select.locator('option').evaluateAll((options) => options.map((option) => option.textContent || '')), { timeout: 20000 })
    .toContainEqual(expect.stringContaining('双人成行v10.0_青云上_MoRan墨染江湖净化完整版'));

  const doublePresetOptionValue = await select.locator('option').evaluateAll((options) => {
    const option = options.find((item) => (item.textContent || '').includes('双人成行v10.0_青云上_MoRan墨染江湖净化完整版'));
    return option?.value || '';
  });
  expect(doublePresetOptionValue).toMatch(/^workshop:/);

  await expect(page.getByText('这里只切换已加入列表的预设').filter({ visible: true }).first()).toBeVisible();

  await expect.poll(async () => {
    await select.selectOption('workshop:tavern-preset-izumi-0623');
    return await select.inputValue();
  }, { timeout: 10000 }).toBe('workshop:tavern-preset-izumi-0623');

  await page.getByRole('button', { name: '删除当前预设' }).click();
  await expect(page.getByText('创意工坊预设不可删除。')).toBeVisible();
  await expect(select.locator('option[value="workshop:tavern-preset-izumi-0623"]')).toHaveCount(1);

  await select.selectOption('local-upload-e2e');
  let dismissedMessage = '';
  page.once('dialog', async (dialog) => {
    dismissedMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: '删除当前预设' }).click();
  expect(dismissedMessage).toContain('确定删除本地上传的酒馆预设');
  await expect(select.locator('option[value="local-upload-e2e"]')).toHaveCount(1);

  let acceptedMessage = '';
  page.once('dialog', async (dialog) => {
    acceptedMessage = dialog.message();
    await dialog.accept();
  });
  await page.getByRole('button', { name: '删除当前预设' }).click();
  expect(acceptedMessage).toContain('确定删除本地上传的酒馆预设');

  await expect(select.locator('option[value="local-upload-e2e"]')).toHaveCount(0);
  await expect(select.locator('option[value="workshop:tavern-preset-izumi-0623"]')).toHaveCount(1);
});
