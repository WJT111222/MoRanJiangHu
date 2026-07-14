import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../functions/api/image-backend/openai-image-proxy/[[path]]';
import { onRequestGet } from '../functions/api/image-backend/fetch-image';

describe('OpenAI image runtime proxy', () => {
    it('proxies whitelisted provider image generation requests and prefixes /v1', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequest({
            request: new Request('https://msjh.example/api/image-backend/openai-image-proxy/images/generations?provider=openai-official', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer sk-test',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: 'gpt-image-2', prompt: 'test' })
            }),
            params: { path: ['images', 'generations'] }
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/generations');
    });

    it('does not duplicate /v1 when the provider path already includes /v1', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequest({
            request: new Request('https://msjh.example/api/image-backend/openai-image-proxy/v1/images/generations?provider=openai-official', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer sk-test',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: 'gpt-image-2', prompt: 'test' })
            }),
            params: { path: ['v1', 'images', 'generations'] }
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/generations');
    });

    it('proxies xAI official image generation requests', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequest({
            request: new Request('https://msjh.example/api/image-backend/openai-image-proxy/v1/images/generations?provider=xai_official', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer xai-test',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: 'grok-imagine-image-quality', prompt: 'test' })
            }),
            params: { path: ['v1', 'images', 'generations'] }
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://api.x.ai/v1/images/generations');
    });

    it('rejects requests that do not use a whitelisted provider (url mode removed)', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequest({
            request: new Request('https://msjh.example/api/image-backend/openai-image-proxy/v1/images/generations?url=https%3A%2F%2Fcdn.moe-atelier.site%2Fv1', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer sk-test',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: 'gpt-image-2', prompt: 'test' })
            }),
            params: { path: ['v1', 'images', 'generations'] }
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('image backend temporary image fetch proxy', () => {
    it('downloads public HTTP temporary image URLs and returns image bytes', async () => {
        const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const fetchMock = vi.fn(async () => new Response(imageBytes, {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.example/api/image-backend/fetch-image?url=http%3A%2F%2F70.39.197.55%3A3000%2Fgenerated%2Ftest.png')
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('http://70.39.197.55:3000/generated/test.png');
    });

    it('rejects private network temporary image URLs', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.example/api/image-backend/fetch-image?url=http%3A%2F%2F127.0.0.1%3A3000%2Fgenerated%2Ftest.png')
        });

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
