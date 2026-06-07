import { describe, expect, it } from 'vitest';

import { onRequestGet } from '../functions/api/apk/latest.json';

const buildRequest = () => new Request('https://msjh.bacon159.pp.ua/api/apk/latest.json');

const buildEnv = (payload: unknown) => ({
    CNB_SYNC_R2: {
        get: async () => ({
            json: async () => payload,
            text: async () => JSON.stringify(payload),
            httpMetadata: {},
            checksums: {}
        })
    },
    CNB_SYNC_R2_KEY: 'moranjianghu/latest.json'
});

describe('APK latest manifest proxy', () => {
    it('does not re-add the R2 provider when the release manifest only exposes hi168', async () => {
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
});
