import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../data/releaseInfo', () => ({
    RELEASE_INFO: {
        versionCode: 504,
        versionName: '1.0.504',
        releaseChannel: 'stable',
        releasePublishedAt: '2026-06-21T21:21:28+08:00',
        releaseNotes: ['内置发布说明'],
        releaseHistory: [],
        websiteUrl: 'https://msjh.bacon159.pp.ua/',
        backupWebsiteUrl: 'https://msjh.bacon.de5.net/',
        updateManifestUrl: 'https://msjh.bacon159.pp.ua/api/apk/latest.json',
        apkDownloadUrl: 'https://msjh.bacon159.pp.ua/api/apk/latest.apk'
    }
}));

describe('runtimeReleaseInfo', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('window', {
            location: {
                href: 'capacitor://localhost',
                protocol: 'capacitor:',
                origin: 'capacitor://localhost'
            },
            setTimeout
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('loads public release-info over HTTPS so APK display metadata is not limited to bundled values', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            versionCode: 505,
            versionName: '1.0.505',
            releasePublishedAt: '2026-06-21T22:10:00+08:00',
            releaseNotes: ['线上发布说明'],
            releaseHistory: [{
                versionCode: 505,
                versionName: '1.0.505',
                publishedAt: '2026-06-21T22:10:00+08:00',
                changes: ['线上发布说明']
            }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', fetchMock);

        const { fetchRuntimeReleaseInfo } = await import('../services/runtimeReleaseInfo');
        const info = await fetchRuntimeReleaseInfo();

        expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/msjh\.bacon159\.pp\.ua\/release-info\.json\?/);
        expect(info.versionName).toBe('1.0.505');
        expect(info.versionCode).toBe(505);
        expect(info.releasePublishedAt).toBe('2026-06-21T22:10:00+08:00');
        expect(info.releaseNotes).toEqual(['线上发布说明']);
    });

    it('falls back to bundled release metadata when the public release-info request has a NetworkError', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new TypeError('NetworkError when attempting to fetch resource.');
        }));

        const { fetchRuntimeReleaseInfo } = await import('../services/runtimeReleaseInfo');
        const info = await fetchRuntimeReleaseInfo();

        expect(info.versionName).toBe('1.0.504');
        expect(info.releasePublishedAt).toBe('2026-06-21T21:21:28+08:00');
    });
});
