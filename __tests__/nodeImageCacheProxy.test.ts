import { describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestHead } from '../functions/api/nodeimage-cache';

describe('nodeimage cache proxy', () => {
    it('proxies allowed NodeImage URLs with edge cache headers', async () => {
        const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
        const fetchMock = vi.fn(async () => new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(bytes.length),
                ETag: '"nodeimage-etag"'
            }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const waitUntil = vi.fn();
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/nodeimage-cache?url=https%3A%2F%2Fcdn.nodeimage.com%2Fi%2FabcDEF123.png'),
            env: {},
            waitUntil
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/png');
        expect(response.headers.get('Cache-Control')).toContain('2592000');
        expect(response.headers.get('X-Moran-NodeImage-Cache')).toBe('miss');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://cdn.nodeimage.com/i/abcDEF123.png');
    });

    it('rejects non NodeImage targets', async () => {
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/nodeimage-cache?url=https%3A%2F%2Fexample.com%2Fi%2Fabc.png'),
            env: {}
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toContain('Invalid NodeImage URL');
    });

    it('supports HEAD without response body', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: {
                'Content-Type': 'image/webp',
                'Content-Length': '3'
            }
        })));

        const response = await onRequestHead({
            request: new Request('https://msjh.bacon159.pp.ua/api/nodeimage-cache?url=https%3A%2F%2Fcdn.nodeimage.com%2Fi%2Fthumb_123.webp'),
            env: {}
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Length')).toBe('3');
        expect(await response.text()).toBe('');
    });
});
