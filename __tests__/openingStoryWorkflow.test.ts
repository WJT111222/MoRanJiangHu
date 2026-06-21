import { describe, expect, it, vi } from 'vitest';
import { 安全触发开局主角自动生图 } from '../hooks/useGame/openingStoryWorkflow';

describe('openingStoryWorkflow', () => {
    it('handles async player image trigger failures without leaking an unhandled rejection', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const trigger = vi.fn(async () => {
            throw new TypeError('NetworkError when attempting to fetch resource.');
        });

        await expect(安全触发开局主角自动生图(trigger, { 姓名: '前月荷' } as any, '测试触发')).resolves.toBe(false);

        expect(trigger).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
            '测试触发失败，已保持开局流程继续',
            expect.any(TypeError)
        );
        warnSpy.mockRestore();
    });
});
