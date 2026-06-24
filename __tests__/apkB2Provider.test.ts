import { describe, expect, it } from 'vitest';

import { onRequestGet } from '../functions/api/apk/version/[file]';

describe('APK B2 provider', () => {
    it('redirects the current versioned APK to the public B2 object URL', async () => {
        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.523.apk?provider=b2'),
            params: { file: 'MoRanJiangHu-v1.0.523.apk' },
            env: {
                MORAN_B2_DISTRIBUTION_BASE_URL: 'https://obs1.bacon159.pp.ua',
                MORAN_B2_DISTRIBUTION_RELEASE_PREFIX: 'moranjianghu',
                CNB_SYNC_R2: {
                    get: async () => ({
                        json: async () => ({
                            latest: {
                                versionCode: 523,
                                versionName: '1.0.523',
                                preferredApkProvider: 'hi168',
                                b2ApkUrl: 'https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.523.apk?provider=b2',
                                apkUrls: [
                                    'https://msjh.bacon159.pp.ua/api/apk/version/MoRanJiangHu-v1.0.523.apk?provider=b2'
                                ]
                            }
                        }),
                        writeHttpMetadata: () => null
                    })
                }
            }
        } as any);

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('https://obs1.bacon159.pp.ua/moranjianghu/MoRanJiangHu-v1.0.523.apk');
        expect(response.headers.get('X-Moran-Apk-Source')).toBe('b2-redirect');
    });
});
