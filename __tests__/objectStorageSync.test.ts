import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const makeSave = (index: number): any => ({
    类型: 'manual',
    时间戳: 1779000000000 + index,
    角色数据: { 姓名: `测试角色${index}` },
    环境信息: { 具体地点: '测试地点', 时间: '测试时间' },
    历史记录: [{ role: 'user', parts: [{ text: `第${index}条记录` }] }]
});

vi.mock('../data/releaseInfo', () => ({
    RELEASE_INFO: { versionName: '1.0.test', versionCode: 999 }
}));

vi.mock('../utils/nativeRuntime', () => ({
    构建同步API地址: () => '/api/object-storage-proxy'
}));

vi.mock('../utils/settingsSchema', () => ({
    设置键: { 对象存储同步配置: 'object-storage-sync-config' }
}));

vi.mock('../services/dbService', () => ({
    读取设置: vi.fn(),
    保存设置: vi.fn(),
    读取存档列表: vi.fn(async () => [makeSave(1), makeSave(2), makeSave(3)]),
    导入存档数据: vi.fn()
}));

vi.mock('../services/saveArchiveService', () => ({
    导出ZIP存档文件: vi.fn(async ({ saves }: any) => {
        const save = saves?.[0] || makeSave(0);
        const body = JSON.stringify({
            save,
            padding: 'x'.repeat(900 * 1024)
        });
        return new Blob([body], { type: 'application/zip' });
    }),
    解析ZIP存档文件: vi.fn()
}));

vi.mock('../services/githubSync', () => ({
    extractSettingsSyncData: vi.fn(),
    restoreSettingsSyncData: vi.fn()
}));

describe('对象存储同步', () => {
    const config = {
        endpoint: 'https://s3.example.com',
        bucket: 'bucket',
        accessKey: 'access',
        secretKey: 'secret',
        prefix: 'MoRanJiangHuTest'
    };

    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('整包上传失败后回退分片，并并发上传多个存档', async () => {
        const directSaveKeys = new Set<string>();
        let activeWholeUploads = 0;
        let maxActiveWholeUploads = 0;
        let fallbackChunkUploads = 0;

        vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
            const headers = new Headers(init?.headers);
            const method = headers.get('X-Object-Storage-Method') || '';
            const key = headers.get('X-Object-Storage-Key') || '';
            if (!method) {
                throw new TypeError('CORS blocked direct object storage request');
            }

            if (method === 'GET' && key.endsWith('/manifest.json')) {
                return new Response('', { status: 404 });
            }

            if (
                method === 'PUT'
                && key.includes('/saves/')
                && key.endsWith('.json')
                && String(init?.body || '').includes('"archiveBase64"')
            ) {
                directSaveKeys.add(key);
                activeWholeUploads += 1;
                maxActiveWholeUploads = Math.max(maxActiveWholeUploads, activeWholeUploads);
                await new Promise((resolve) => setTimeout(resolve, 10));
                activeWholeUploads -= 1;
                return new Response('too large', { status: 413 });
            }

            if (method === 'PUT' && key.includes('/chunks/saves/')) {
                fallbackChunkUploads += 1;
                return new Response('', { status: 200 });
            }

            if (method === 'PUT' && key.endsWith('/manifest.json')) {
                const manifest = JSON.parse(String(init?.body || '{}'));
                expect(manifest.saves).toHaveLength(3);
                return new Response('', { status: 200 });
            }

            return new Response('', { status: 200 });
        }));

        const { 增量同步到对象存储 } = await import('../services/objectStorageSync');
        const result = await 增量同步到对象存储(config);

        expect(result.uploaded).toBe(3);
        expect(result.skipped).toBe(0);
        expect(directSaveKeys.size).toBe(3);
        expect(fallbackChunkUploads).toBeGreaterThan(3);
        expect(maxActiveWholeUploads).toBeGreaterThan(1);
    });
});
