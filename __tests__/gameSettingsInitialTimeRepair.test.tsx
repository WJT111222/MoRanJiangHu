import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import GameSettings, { 提交游戏初始时间修复 } from '../components/features/Settings/GameSettings';
import { 默认游戏设置 } from '../utils/gameSettings';

describe('GameSettings 高级存档修复', () => {
    it('合法输入会调用修复 action，并更新游戏初始时间', async () => {
        let gameInitialTime = '2026:12:23:13:30';
        const repair = vi.fn((nextTime: string) => {
            gameInitialTime = nextTime;
            return { ok: true, message: '已修正历程起始时间，请手动保存进度。', value: nextTime };
        });

        const result = await 提交游戏初始时间修复({
            input: ' 2026:12:21:21:25 ',
            currentInitialTime: gameInitialTime,
            currentGameTime: '2026:12:23:13:30',
            onRepair: repair,
            confirm: () => true
        });

        expect(result.ok).toBe(true);
        expect(result.value).toBe('2026:12:21:21:25');
        expect(repair).toHaveBeenCalledWith('2026:12:21:21:25');
        expect(gameInitialTime).toBe('2026:12:21:21:25');
    });

    it('非法输入不会调用修复 action，并返回错误提示', async () => {
        const repair = vi.fn();

        const result = await 提交游戏初始时间修复({
            input: '2026:13:21:21:25',
            currentInitialTime: '2026:12:23:13:30',
            currentGameTime: '2026:12:23:13:30',
            onRepair: repair,
            confirm: () => true
        });

        expect(result.ok).toBe(false);
        expect(result.message).toContain('合法的游戏时间格式');
        expect(repair).not.toHaveBeenCalled();
    });

    it('应用修正不会修改环境时间', async () => {
        let currentGameTime = '2026:12:23:13:30';
        const repair = vi.fn((nextTime: string) => ({ ok: true, message: 'ok', value: nextTime }));

        await 提交游戏初始时间修复({
            input: '2026:12:21:21:25',
            currentInitialTime: '2026:12:23:13:30',
            currentGameTime,
            onRepair: repair,
            confirm: () => true
        });

        expect(currentGameTime).toBe('2026:12:23:13:30');
    });

    it('GameSettings 能显示当前初始时间、当前环境时间、历程天数', () => {
        const html = renderToStaticMarkup(
            <GameSettings
                settings={默认游戏设置}
                onSave={() => undefined}
                gameInitialTime="2026:12:21:21:25"
                currentGameTime="2026:12:23:13:30"
                journeyDayCount={3}
                onRepairGameInitialTime={() => ({ ok: true, message: 'ok' })}
            />
        );

        expect(html).toContain('高级存档修复');
        expect(html).toContain('2026:12:21:21:25');
        expect(html).toContain('2026:12:23:13:30');
        expect(html).toContain('第 3 天');
    });

    it('GameSettings 显示正文词汇审查开关', () => {
        const html = renderToStaticMarkup(
            <GameSettings
                settings={默认游戏设置}
                onSave={() => undefined}
            />
        );

        expect(html).toContain('正文词汇审查');
        expect(html).toContain('女性模板名黑名单');
    });

    it('GameSettings 显示严格旁白对白格式开关', () => {
        const html = renderToStaticMarkup(
            <GameSettings
                settings={默认游戏设置}
                onSave={() => undefined}
            />
        );

        expect(html).toContain('严格旁白/对白格式');
        expect(html).toContain('普通酒馆角色卡正文');
    });
});
