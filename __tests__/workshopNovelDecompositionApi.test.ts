import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestPost } from '../functions/api/workshop/novel-decomposition';

const indexKey = 'moranjianghu/workshop/novel-decomposition/index/latest.json';
const userPrefix = 'moranjianghu/cloud-play/users';

const textEncoder = new TextEncoder();

const bytesToHex = (bytes: ArrayBuffer): string => (
    Array.from(new Uint8Array(bytes)).map((item) => item.toString(16).padStart(2, '0')).join('')
);

const sha256Hex = async (value: string): Promise<string> => (
    bytesToHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(value)))
);

const hmacHex = async (secret: string, value: string): Promise<string> => {
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return bytesToHex(await crypto.subtle.sign('HMAC', key, textEncoder.encode(value)));
};

const createIndexBucket = (entries: any[]) => ({
    get: vi.fn(async (key: string) => {
        if (key !== indexKey) return null;
        return {
            json: async () => ({ entries }),
            text: async () => JSON.stringify({ entries }),
            body: null
        };
    }),
    put: vi.fn(),
    list: vi.fn(),
    delete: vi.fn()
});

const createWorkshopBucket = (entries: any[] = []) => {
    const values = new Map<string, string>([[indexKey, JSON.stringify({ entries })]]);
    return {
        get: vi.fn(async (key: string) => {
            const value = values.get(key);
            if (!value) return null;
            return {
                json: async () => JSON.parse(value),
                text: async () => value,
                body: null
            };
        }),
        put: vi.fn(async (key: string, value: any) => {
            values.set(key, typeof value === 'string' ? value : JSON.stringify(value));
        }),
        list: vi.fn(),
        delete: vi.fn()
    };
};

const createAuthBucket = async (username: string, password: string) => {
    const usernameKey = await sha256Hex(username.toLowerCase());
    const salt = 'test-salt';
    const passwordHash = await hmacHex(salt, `${usernameKey}\n${password}`);
    const user = {
        userId: 'test-user-id',
        username,
        usernameKey,
        passwordSalt: salt,
        passwordHash
    };
    return {
        get: vi.fn(async (key: string) => {
            if (key !== `${userPrefix}/${usernameKey}.json`) return null;
            return {
                json: async () => user,
                text: async () => JSON.stringify(user),
                body: null
            };
        }),
        put: vi.fn(),
        list: vi.fn(),
        delete: vi.fn()
    };
};

describe('workshop novel decomposition API', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('uses direct OpenList API base for signing while keeping public download redirects', async () => {
        const entry = {
            id: 'NDW-demo',
            title: '测试模块',
            workName: '测试作品',
            contributor: 'tester',
            note: '',
            createdAt: '2026-05-29T00:00:00.000Z',
            updatedAt: '2026-05-29T00:00:00.000Z',
            fileName: 'demo.zip',
            size: 3,
            sha256: 'abc',
            chapterCount: 1,
            segmentCount: 1,
            sourceType: 'novel',
            tags: [],
            r2Key: 'legacy/demo.zip',
            oneDrivePath: '/Onedrive/MoRanJiangHu/workshop/novel-decomposition/packages/2026-05-29/NDW-demo/NDW-demo.zip'
        };
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            code: 200,
            data: {
                content: [
                    { name: 'NDW-demo.zip', is_dir: false, sign: 'sig+value/with space' }
                ]
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestGet({
            request: new Request('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition?action=download&id=NDW-demo'),
            env: {
                WORKSHOP_R2: createIndexBucket([entry]),
                MORAN_OPENLIST_AUTH_TOKEN: 'test-token',
                MORAN_OPENLIST_API_BASE_URL: 'http://159.138.7.126:5244/',
                MORAN_OPENLIST_PUBLIC_BASE_URL: 'https://openlist.bacon.de5.net/'
            }
        });

        expect(fetchMock.mock.calls[0][0]).toBe('http://159.138.7.126:5244/api/fs/list');
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe(
            'https://openlist.bacon.de5.net/p/Onedrive/MoRanJiangHu/workshop/novel-decomposition/packages/2026-05-29/NDW-demo/NDW-demo.zip?sign=sig%2Bvalue%2Fwith%20space'
        );
    });

    it('defaults workshop ZIP uploads to the direct OpenList origin and keeps ZIP payloads out of D1', async () => {
        const workshopBucket = createWorkshopBucket();
        const authBucket = await createAuthBucket('tester', 'secret123');
        const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onRequestPost({
            request: new Request('https://msjh.bacon159.pp.ua/api/workshop/novel-decomposition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '发布验证模块',
                    workName: '发布验证作品',
                    fileName: 'publish-demo.zip',
                    zipBase64: btoa('zip'),
                    chapterCount: 1,
                    segmentCount: 1,
                    sourceType: 'txt',
                    auth: { username: 'tester', password: 'secret123' }
                })
            }),
            env: {
                WORKSHOP_R2: workshopBucket,
                CLOUD_PLAY_R2: authBucket,
                MORAN_OPENLIST_AUTH_TOKEN: 'test-token'
            }
        });
        const payload: any = await response.json();
        const putKeys = workshopBucket.put.mock.calls.map((call) => String(call[0]));

        expect(response.status).toBe(200);
        expect(payload.ok).toBe(true);
        expect(fetchMock.mock.calls[0][0]).toBe('http://159.138.7.126:5244/api/fs/put');
        expect(payload.entry.oneDrivePath).toMatch(/^\/Onedrive\/MoRanJiangHu\/workshop\/novel-decomposition\/packages\//);
        expect(putKeys).toContain(indexKey);
        expect(putKeys.some((key) => key.includes('/packages/'))).toBe(false);
    });
});
