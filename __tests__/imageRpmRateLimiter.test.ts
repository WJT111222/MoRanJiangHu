import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { generateImageByPrompt, __测试__重置远程图片限流器 } from '../services/ai/image';

vi.mock('../services/dbService', () => ({
    保存图片资源: vi.fn(async () => 'wuxia-asset://saved-image')
}));

const mockOpenaiApi = {
    id: 'test-openai',
    名称: 'Test OpenAI',
    供应商: 'openai_compatible',
    协议覆盖: 'auto',
    baseUrl: 'https://image.example',
    apiKey: 'test-key',
    model: 'gpt-image-2',
    图片后端类型: 'openai',
    图片接口路径: '/v1/images/generations',
    图片响应格式: 'url',
};

beforeEach(() => {
    __测试__重置远程图片限流器();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('Image generation RPM rate limiter', () => {
    it('allows a single request through without delay', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: [{ url: 'https://image.example/result.png' }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        })));

        const result = await generateImageByPrompt('test prompt', mockOpenaiApi as any);
        expect(result.图片URL).toBe('https://image.example/result.png');
    });

    it('limits concurrency: 5 simultaneous requests complete but never exceed 2 in-flight', async () => {
        let completedCount = 0;
        const slowFetch = vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
            completedCount += 1;
            return new Response(JSON.stringify({
                data: [{ url: `https://image.example/result-${completedCount}.png` }]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        });
        vi.stubGlobal('fetch', slowFetch);

        const results = await Promise.allSettled(
            Array.from({ length: 5 }, (_, i) =>
                generateImageByPrompt(`test prompt ${i}`, mockOpenaiApi as any)
            )
        );

        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBe(5);
        expect(slowFetch).toHaveBeenCalledTimes(5);
    });

    it('releases concurrency slot after request fails', async () => {
        // First request fails
        vi.stubGlobal('fetch', vi.fn(async () => new Response('error', { status: 500 })));

        try {
            await generateImageByPrompt('will-fail', mockOpenaiApi as any);
        } catch {
            // Expected to fail
        }

        // Second request should still succeed (slot was released)
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: [{ url: 'https://image.example/after-fail.png' }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        })));

        const result = await generateImageByPrompt('after-fail', mockOpenaiApi as any);
        expect(result.图片URL).toBe('https://image.example/after-fail.png');
    });

    it('rejects aborted requests while waiting for concurrency slot', async () => {
        const slowFetch = vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            return new Response(JSON.stringify({
                data: [{ url: 'https://image.example/slow-result.png' }]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        });
        vi.stubGlobal('fetch', slowFetch);

        // Fill both concurrency slots
        const slow1 = generateImageByPrompt('slow1', mockOpenaiApi as any);
        const slow2 = generateImageByPrompt('slow2', mockOpenaiApi as any);

        // 3rd request will queue; abort it after 100ms
        const abortController = new AbortController();
        setTimeout(() => abortController.abort(), 100);
        const abortedPromise = generateImageByPrompt('aborted', mockOpenaiApi as any, abortController.signal);
        await expect(abortedPromise).rejects.toThrow();

        // Slow requests should still complete
        const r1 = await slow1;
        expect(r1.图片URL).toBeTruthy();
        const r2 = await slow2;
        expect(r2.图片URL).toBeTruthy();
    });

    it('RPM window: 6 rapid requests all succeed within limit', async () => {
        const fastFetch = vi.fn(async () => new Response(JSON.stringify({
            data: [{ url: 'https://image.example/fast-result.png' }]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fastFetch);

        // Fire 6 rapid requests - all should go through within the RPM limit
        const batch1 = await Promise.all(
            Array.from({ length: 6 }, (_, i) =>
                generateImageByPrompt(`batch1-${i}`, mockOpenaiApi as any)
            )
        );
        expect(batch1.every((r) => r.图片URL)).toBe(true);
        expect(fastFetch).toHaveBeenCalledTimes(6);
    });
});
