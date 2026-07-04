import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestGet } from '../functions/api/apk/latest.apk';

describe('APK OneDrive redirect', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('uses the stable OpenList download endpoint for OneDrive APK fallback', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
            expect(String(url)).toBe('https://openlist.bacon.de5.net/api/fs/list');
            return new Response(JSON.stringify({
                code: 200,
                data: {
                    content: [
                        { name: 'latest.apk', is_dir: false, sign: 'apk+sign/with space' }
                    ]
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }));

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/apk/latest.apk?provider=onedrive'),
            env: {
                RELEASE_MANIFEST: {
                    get: async () => ({
                        latest: {
                            versionName: '1.0.560',
                            versionCode: 560,
                            preferredApkProvider: 'onedrive'
                        }
                    })
                },
                MORAN_OPENLIST_AUTH_TOKEN: 'test-token',
                MORAN_OPENLIST_BASE_URL: 'https://openlist.bacon.de5.net/'
            }
        } as any);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe(
            'https://openlist.bacon.de5.net/d/Onedrive/MoRanJiangHu/releases/latest.apk?sign=apk%2Bsign%2Fwith%20space'
        );
        expect(response.headers.get('X-Moran-Apk-Source')).toBe('onedrive-proxy');
    });

    it('uses OneDrive as the default APK provider when the manifest has no preferred provider', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
            expect(String(url)).toBe('https://openlist.bacon.de5.net/api/fs/list');
            return new Response(JSON.stringify({
                code: 200,
                data: {
                    content: [
                        { name: 'latest.apk', is_dir: false, sign: 'default-sign' }
                    ]
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }));

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/apk/latest.apk'),
            env: {
                RELEASE_MANIFEST: {
                    get: async () => ({
                        latest: {
                            versionName: '1.0.560',
                            versionCode: 560
                        }
                    })
                },
                MORAN_OPENLIST_AUTH_TOKEN: 'test-token',
                MORAN_OPENLIST_BASE_URL: 'https://openlist.bacon.de5.net/'
            }
        } as any);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe(
            'https://openlist.bacon.de5.net/d/Onedrive/MoRanJiangHu/releases/latest.apk?sign=default-sign'
        );
        expect(response.headers.get('X-Moran-Apk-Source')).toBe('onedrive-proxy');
    });
});
