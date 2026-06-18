import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateImageByPrompt, persistImageAssetLocally } from '../services/ai/image';

vi.mock('../services/dbService', () => ({
    保存图片资源: vi.fn(async () => 'wuxia-asset://saved-image')
}));

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('Grok2Api image generation compatibility', () => {
    it('does not force base64 response_format for regular GPT image compatible providers', async () => {
        let requestBody: any = null;
        vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { url: 'https://image.example/gpt-result.png' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }));

        const result = await generateImageByPrompt('测试 GPT 图片模型', {
            id: 'gpt-image',
            名称: 'GPT Image',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://image.example',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any);

        expect(requestBody).not.toHaveProperty('response_format');
        expect(requestBody.moderation).toBe('auto');
        expect(result.图片URL).toBe('https://image.example/gpt-result.png');
    });

    it('prefers base64 data when an image response also contains a temporary URL', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: [
                {
                    url: 'http://temporary.example/generated.png',
                    b64_json: 'aGVsbG8='
                }
            ]
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        })));

        const result = await generateImageByPrompt('测试双格式返回', {
            id: 'gpt-image',
            名称: 'GPT Image',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'https://image.example',
            apiKey: 'test-key',
            model: 'gpt-image-2',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any);

        expect(result.图片URL).toBe('data:image/png;base64,aGVsbG8=');
    });

    it('downloads HTTP temporary image links through the same-origin image backend proxy before saving', async () => {
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            const requestedUrl = new URL(url, 'https://msjh.example');
            expect(requestedUrl.pathname).toBe('/api/image-backend/fetch-image');
            expect(requestedUrl.searchParams.get('url')).toBe('http://70.39.197.55:3000/generated/test.png');
            return new Response(pngBytes, {
                status: 200,
                headers: { 'content-type': 'image/png' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await persistImageAssetLocally({
            图片URL: 'http://70.39.197.55:3000/generated/test.png'
        });

        expect(result.本地路径).toBe('wuxia-asset://saved-image');
        expect(result.图片URL).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('sends OpenAI-compatible image payload fields accepted by Grok2Api', async () => {
        let requestedUrl = '';
        let requestBody: any = null;
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            requestedUrl = String(input);
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { url: 'https://image.example/grok-result.png' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await generateImageByPrompt('一只在太空漂浮的猫', {
            id: 'grok2api',
            名称: 'Grok2Api',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'http://localhost:8000',
            apiKey: 'test-key',
            model: 'grok-imagine-image',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'url'
        } as any, undefined, {
            尺寸: '1792x1024'
        });

        expect(requestedUrl).toBe('http://localhost:8000/v1/images/generations');
        expect(requestBody).toMatchObject({
            model: 'grok-imagine-image',
            n: 1,
            size: '1792x1024',
            response_format: 'url'
        });
        expect(requestBody.prompt).toContain('一只在太空漂浮的猫');
        expect(result.图片URL).toBe('https://image.example/grok-result.png');
    });

    it('parses Grok2Api base64 response_format aliases into data URLs', async () => {
        let requestBody: any = null;
        vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body || '{}'));
            return new Response(JSON.stringify({
                data: [
                    { base64: 'aGVsbG8=' }
                ]
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        }));

        const result = await generateImageByPrompt('测试 base64 返回', {
            id: 'grok2api',
            名称: 'Grok2Api',
            供应商: 'openai_compatible',
            协议覆盖: 'auto',
            baseUrl: 'http://localhost:8000',
            apiKey: 'test-key',
            model: 'grok-imagine-image',
            图片后端类型: 'openai',
            图片接口路径: '/v1/images/generations',
            图片响应格式: 'base64'
        } as any);

        expect(requestBody.response_format).toBe('base64');
        expect(result.图片URL).toBe('data:image/png;base64,aGVsbG8=');
    });
});
