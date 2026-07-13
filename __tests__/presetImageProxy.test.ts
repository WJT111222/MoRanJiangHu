import { describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestHead } from '../functions/api/preset-image/[[path]]';

const env = {
    MORAN_OSS_ENDPOINT: 'https://s3.hi168.com',
    MORAN_OSS_BUCKET: 'preset-bucket',
    MORAN_OSS_ACCESS_KEY: 'access-key',
    MORAN_OSS_SECRET_KEY: 'secret-key',
    MORAN_OSS_REGION: 'auto'
};

describe('preset image proxy', () => {
    it('fetches preset images from signed object storage keys', async () => {
        const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
        const fetchMock = vi.fn(async () => new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Length': String(bytes.length),
                ETag: '"abc"'
            }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/s3_1780319017390_91d7u9.jpg'),
            env,
            params: { path: 's3_1780319017390_91d7u9.jpg' },
            waitUntil: vi.fn()
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/jpeg');
        expect(response.headers.get('Cache-Control')).toContain('immutable');
        expect(response.headers.get('X-Moran-Preset-Image-Cache')).toBe('miss');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const signedUrl = new URL(fetchMock.mock.calls[0][0] as string);
        expect(signedUrl.origin).toBe('https://s3.hi168.com');
        expect(signedUrl.pathname).toBe('/preset-bucket/MoRanJiangHu/preset-items/s3_1780319017390_91d7u9.jpg');
        expect(signedUrl.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    });

    it('rejects non preset-image keys', async () => {
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/../../secret.txt'),
            env,
            params: { path: '../../secret.txt' }
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toContain('Invalid preset image path');
    });

    it('supports HEAD without a response body', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(null, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': '123'
            }
        })));

        const response = await onRequestHead({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/s3_1780320519169_b6pg5i.png'),
            env,
            params: { path: 's3_1780320519169_b6pg5i.png' }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Length')).toBe('123');
        expect(await response.text()).toBe('');
    });

    it('uses the direct OpenList base and /d signed path for thumbnail downloads', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url === 'http://159.138.7.126:5244/api/fs/list') {
                return new Response(JSON.stringify({
                    code: 200,
                    data: {
                        content: [
                            { name: '护符.webp', is_dir: false, sign: 'thumb-sign' }
                        ]
                    }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            if (url === 'http://159.138.7.126:5244/d/Onedrive/MoRanJiangHu/preset-items/thumbs/%E6%8A%A4%E7%AC%A6.webp?sign=thumb-sign') {
                return new Response(new Uint8Array([1, 2, 3]), {
                    status: 200,
                    headers: { 'Content-Type': 'image/webp', 'Content-Length': '3' }
                });
            }
            return new Response('unexpected ' + url, { status: 500 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/preset-image/thumbs/%E6%8A%A4%E7%AC%A6.webp'),
            env: {
                ...env,
                MORAN_OPENLIST_AUTH_TOKEN: 'test-token',
                MORAN_OPENLIST_API_BASE_URL: 'http://159.138.7.126:5244',
                MORAN_OPENLIST_DIRECT_BASE_URL: 'http://159.138.7.126:5244',
                MORAN_OPENLIST_BASE_URL: 'https://openlist.bacon.de5.net'
            },
            params: { path: 'thumbs/护符.webp' }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/webp');
        expect(response.headers.get('X-Moran-Preset-Image-Source')).toBe('onedrive');
        expect(fetchMock).toHaveBeenCalledWith('http://159.138.7.126:5244/api/fs/list', expect.any(Object));
        expect(fetchMock).toHaveBeenCalledWith(
            'http://159.138.7.126:5244/d/Onedrive/MoRanJiangHu/preset-items/thumbs/%E6%8A%A4%E7%AC%A6.webp?sign=thumb-sign',
            expect.any(Object)
        );
    });
});
