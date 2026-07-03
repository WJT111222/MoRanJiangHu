import { test, expect } from '@playwright/test';

const baseUrl = process.env.E2E_SOURCE_BASE_URL || 'http://127.0.0.1:5173';

test('opening dynamic world stage action stays scoped in the browser bundle', async ({ page }) => {
  test.setTimeout(30000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem('moranjianghu.releaseNotesSuppressDate', new Date().toISOString().slice(0, 10));
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const mod = await import('/utils/queueStageActions.ts');
    const common = {
      isOpeningQueue: true,
      hasReroll: true,
      hasRetryLatestVariableGeneration: true,
      hasQuickRestart: true
    };

    return {
      openingStory: mod.获取队列阶段重新生成动作({ ...common, stageId: 'opening-story' }),
      openingPolish: mod.获取队列阶段重新生成动作({ ...common, stageId: 'opening-polish' }),
      openingVariable: mod.获取队列阶段重新生成动作({ ...common, stageId: 'variable' }),
      openingWorld: mod.获取队列阶段重新生成动作({ ...common, stageId: 'world' }),
      openingPlanning: mod.获取队列阶段重新生成动作({ ...common, stageId: 'planning' }),
      openingMap: mod.获取队列阶段重新生成动作({ ...common, stageId: 'opening-map' }),
      normalWorld: mod.获取队列阶段重新生成动作({
        stageId: 'world',
        isOpeningQueue: false,
        hasReroll: true,
        hasRetryLatestVariableGeneration: true,
        hasQuickRestart: true
      })
    };
  });

  expect(result).toEqual({
    openingStory: 'quick-opening-all',
    openingPolish: null,
    openingVariable: null,
    openingWorld: null,
    openingPlanning: null,
    openingMap: null,
    normalWorld: null
  });
});
