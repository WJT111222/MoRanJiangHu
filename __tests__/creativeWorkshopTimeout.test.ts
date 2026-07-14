import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('creativeWorkshop module list timeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => (
            new Promise((_resolve, reject) => {
                const signal = init?.signal as AbortSignal | undefined;
                if (signal) {
                    signal.addEventListener('abort', () => {
                        reject(new DOMException('The operation was aborted.', 'AbortError'));
                    }, { once: true });
                }
            })
        )));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('returns builtin entries instead of hanging forever when the cloud request times out', async () => {
        const { 列出创意工坊模块 } = await import('../services/creativeWorkshop');
        const promise = 列出创意工坊模块();

        await vi.advanceTimersByTimeAsync(40_000);
        const entries = await promise;

        expect(entries.length).toBeGreaterThan(0);
        expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    it('forceRefresh 超时时明确报错而不是伪装刷新成功', async () => {
        const { 列出创意工坊模块 } = await import('../services/creativeWorkshop');
        const promise = 列出创意工坊模块({ forceRefresh: true });
        const rejection = expect(promise).rejects.toThrow('刷新社区工坊失败');
        await vi.advanceTimersByTimeAsync(40_000);
        await rejection;
    });
});
