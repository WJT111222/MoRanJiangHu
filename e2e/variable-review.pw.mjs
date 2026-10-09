import { test, expect } from '@playwright/test';

// 在本地Vite（默认4173）上运行；使用已安装Chrome，无真实AI/云端写入。
test.use({ channel: 'chrome', baseURL: process.env.VARIABLE_REVIEW_TEST_URL || 'http://127.0.0.1:4173' });
const completedBody = '卡尔走进大厅，介绍自己是长期同行的旅人。';
const repair = `<说明>状态：需要修复\n正文中的卡尔尚未记录，建议补充档案。</说明><命令>push 社交 = ${JSON.stringify({ id: 'NPC-CARL', 姓名: '卡尔', 性别: '男', 身份: '旅人', 简介: '背景资料'.repeat(300) })}</命令>`;
async function enterGame(page, theme) {
    await page.goto('/');
    await page.waitForFunction(() => !!document.querySelector('button'));
    await page.evaluate(async ({ theme, completedBody }) => {
        const db = await import('/services/dbService.ts');
        const transforms = await import('/hooks/useGame/stateTransforms.ts');
        const api = await import('/utils/apiConfig.ts');
        const settings = api.规范化接口设置({ configs: [{ id: 'review-test', name: '本地测试', baseUrl: 'https://review.test/v1', apiKey: 'test-key', model: 'test-model', 供应商: 'openai' }], currentConfigId: 'review-test', activeConfigId: 'review-test', 功能模型占位: { 变量计算独立模型开关: false, 变量计算渠道ID: 'review-test', 变量计算使用模型: 'test-model' } });
        await db.保存设置('api_settings', settings);
        await db.保存设置('app_theme', theme);
        await db.保存存档({ 类型: 'manual', 时间戳: Date.now(), 游戏时间: '1:01:01:08:00',
            角色数据: transforms.规范化角色物品容器映射({ 姓名: '林岳', 性别: '男', 年龄: 18, 金钱: { 金元宝: 100 }, 物品列表: [] }),
            环境信息: { 时间: '1:01:01:08:00', 大地点: '城中', 中地点: '广场', 小地点: '客栈', 具体地点: '大厅' },
            社交: [], 世界: {}, 战斗: { 是否战斗中: false, 敌方: [] }, 玩家门派: {}, 任务列表: [], 约定列表: [], 剧情: {}, 剧情规划: {},
            历史记录: [{ role: 'user', content: '走进大厅', timestamp: 1 }, { role: 'assistant', content: completedBody, timestamp: 2, structuredResponse: { logs: [{ sender: '旁白', text: completedBody }], tavern_commands: [] } }],
            记忆系统: { 即时记忆: [], 短期记忆: [], 中期记忆: [], 长期记忆: [], 回忆档案: [] }, 元数据: { 主角姓名: '林岳', 历史记录条数: 2, 游戏回合数: 1 }
        });
    }, { theme, completedBody });
    await page.reload();
    const releaseClose = page.getByRole('button', { name: '关闭更新日志' });
    if (await releaseClose.isVisible().catch(() => false)) await releaseClose.click();
    await page.getByRole('button', { name: '本地游玩' }).click();
    await page.getByRole('button', { name: '重入江湖' }).click();
    const series = page.getByText(/时间树.*个节点/).first();
    await series.waitFor(); await series.click();
    const load = page.getByRole('button', { name: '读取最新存档' });
    if (await load.isVisible().catch(() => false)) await load.click();
    await page.getByRole('button', { name: '读取', exact: true }).click();
    await expect(page.getByText(completedBody, { exact: false }).first()).toBeVisible();
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
    const direct = page.getByRole('button', { name: '变量管理', exact: true }).first();
    if (await direct.isVisible().catch(() => false)) await direct.click();
    else {
        await page.getByRole('button', { name: /设置$/ }).first().click();
        await page.getByRole('button', { name: '变量', exact: true }).first().click();
    }
    await page.getByRole('button', { name: '变量审查', exact: true }).click();
}
for (const mobile of [false, true]) for (const theme of ['day', 'ink']) {
    test(`${mobile ? '手机' : '桌面'} ${theme}：实际游戏审查、布局、确认保存`, async ({ page }) => {
        await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
        await page.route('https://review.test/**', async route => {
            if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
            const body = JSON.parse(route.request().postData() || '{}');
            const headers = { 'access-control-allow-origin': '*' };
            await route.fulfill(body.stream ? { headers, contentType: 'text/event-stream', body: `data: ${JSON.stringify({ choices: [{ delta: { content: repair } }] })}\n\ndata: [DONE]\n\n` } : { headers, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: repair } }] }) });
        });
        await enterGame(page, theme);
        const dialog = page.getByRole('dialog', { name: '变量审查' });
        await page.getByLabel('玩家备注（可选）').fill('重点检查正文中的 NPC');
        if (mobile) {
            // 缩小可视窗口模拟键盘占位，底部操作仍在窗口内。
            await page.setViewportSize({ width: 390, height: 420 });
            const footer = await dialog.locator('.variable-review-footer').boundingBox();
            expect(footer.y + footer.height).toBeLessThanOrEqual(420);
            await page.setViewportSize({ width: 390, height: 844 });
        }
        await page.getByRole('button', { name: '开始审查' }).click();
        await expect(dialog.getByText(/实际变量变化（/)).toBeVisible();
        await dialog.getByText('展开对象 / 长内容').last().click();
        await dialog.getByText(/命令诊断：/).click();
        expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
        expect(await dialog.locator('.variable-review-body').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
        if (theme === 'day') {
            const colors = await dialog.evaluate(el => ({ foreground: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
            expect(colors.foreground).toBe('rgb(56, 46, 36)'); expect(colors.background).toBe('rgb(255, 250, 240)');
        }
        await page.screenshot({ path: `/tmp/variable-review-${mobile ? 'mobile' : 'desktop'}-${theme}.png` });
        const apply = page.getByRole('button', { name: '应用修复', exact: true });
        await expect(apply).toBeEnabled(); await apply.click();
        await expect(dialog.getByText(/变量修复已应用，共修改/)).toBeVisible();
        const saved = await page.evaluate(async () => {
            const db = await import('/services/dbService.ts'); const database = await db.初始化数据库();
            const entries = await new Promise((resolve, reject) => { const request = database.transaction('saves').objectStore('saves').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
            return entries.filter(save => save.社交?.some(npc => npc.姓名 === '卡尔')).map(save => ({ names: save.社交.map(npc => npc.姓名), time: save.环境信息.时间, history: save.历史记录 }));
        });
        expect(saved).toHaveLength(1); expect(saved[0].names.filter(name => name === '卡尔')).toHaveLength(1);
        expect(saved[0].time).toBe('1:01:01:08:00'); expect(saved[0].history).toHaveLength(2);
        await expect(dialog.getByRole('button', { name: '应用修复' })).toHaveCount(0);
    });
}
