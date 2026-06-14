import { describe, expect, it, vi } from 'vitest';

import { onRequestGet } from '../functions/api/apk/latest.json';

const buildRequest = () => new Request('https://msjh.bacon159.pp.ua/api/apk/latest.json');

const buildEnv = (payload: unknown, options?: { skipS3?: boolean }) => ({
    CNB_SYNC_R2: {
        get: async () => ({
            json: async () => payload,
            text: async () => JSON.stringify(payload),
            httpMetadata: {},
            checksums: {}
        })
    },
    CNB_SYNC_R2_KEY: 'moranjianghu/latest.json',
    // S3 credentials: when present, readManifestPayload will try S3 first.
    // In tests without a real network, the S3 fetch will fail and fall back to R2.
    ...(options?.skipS3 ? {} : {
        MORAN_OSS_ENDPOINT: 'https://s3.hi168.com',
        MORAN_OSS_BUCKET: 'hi168-19275-07130td3',
        MORAN_OSS_ACCESS_KEY: 'test-access-key',
        MORAN_OSS_SECRET_KEY: 'test-secret-key',
        MORAN_OSS_REGION: 'auto'
    })
});

describe('APK latest manifest proxy', () => {
    it('does not re-add the R2 provider when the release manifest only exposes hi168 (S3 fallback to R2)', async () => {
        // S3 fetch will fail in test env (no real network), so it falls back to R2 mock.
        const response = await onRequestGet({
            request: buildRequest(),
            env: buildEnv({
                latest: {
                    versionName: '1.0.425',
                    versionCode: 425,
                    preferredApkProvider: 'hi168',
                    r2ApkUrl: '',
                    apkUrls: [
                        'https://msjh.bacon159.pp.ua/api/apk/latest.apk',
                        'https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.425.apk',
                        'https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.425.apk?provider=hi168'
                    ]
                },
                history: []
            })
        } as any);

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload.latest.r2ApkUrl).toBe('');
        expect(payload.latest.apkUrls).not.toContain('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.425.apk?provider=r2');
        expect(payload.latest.apkUrls).toContain('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.425.apk?provider=hi168');
    });

    it('reads manifest from R2 when S3 credentials are absent', async () => {
        // No S3 credentials: S3 path is skipped entirely, reads directly from R2.
        const response = await onRequestGet({
            request: buildRequest(),
            env: buildEnv({
                latest: {
                    versionName: '1.0.425',
                    versionCode: 425,
                    preferredApkProvider: 'hi168',
                    r2ApkUrl: '',
                    apkUrls: []
                },
                history: []
            }, { skipS3: true })
        } as any);

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload.latest.versionName).toBe('1.0.425');
    });

    it('reads manifest from S3 when available', async () => {
        const s3Payload = {
            latest: {
                versionName: '1.0.430',
                versionCode: 430,
                preferredApkProvider: 'hi168',
                r2ApkUrl: '',
                apkUrls: []
            },
            history: []
        };

        // Mock global fetch to simulate a successful S3 response.
        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn(async (url: string) => {
            if (typeof url === 'string' && url.includes('s3.hi168.com')) {
                return new Response(JSON.stringify(s3Payload), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ETag: '"test-etag"' }
                });
            }
            return new Response('not found', { status: 404 });
        });

        try {
            const response = await onRequestGet({
                request: buildRequest(),
                env: buildEnv({
                    latest: {
                        versionName: '1.0.425',
                        versionCode: 425
                    },
                    history: []
                })
            } as any);

            expect(response.status).toBe(200);
            const payload = await response.json();
            // Should return the S3 payload (v1.0.430), not the R2 payload (v1.0.425).
            expect(payload.latest.versionName).toBe('1.0.430');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
