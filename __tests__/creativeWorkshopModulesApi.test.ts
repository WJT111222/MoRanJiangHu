import { describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestPost } from '../functions/api/workshop/modules';

const workshopIndexKey = 'moranjianghu/workshop/modules/index/latest.json';
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

const createBucket = (initial: Record<string, string>) => {
    const values = new Map(Object.entries(initial));
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
        list: vi.fn(async ({ prefix = '' }: { prefix?: string } = {}) => ({ objects: Array.from(values.keys()).filter((key) => key.startsWith(prefix)).map((key) => ({ key })), truncated: false })),
        delete: vi.fn(async (key: string) => { values.delete(key); }),
        values
    };
};

const createAuthBucket = async (username: string, password: string, userId = 'user-1') => {
    const usernameKey = await sha256Hex(username.toLowerCase());
    const salt = 'test-salt';
    const passwordHash = await hmacHex(salt, `${usernameKey}\n${password}`);
    return createBucket({
        [`${userPrefix}/${usernameKey}.json`]: JSON.stringify({
            userId,
            username,
            usernameKey,
            passwordSalt: salt,
            passwordHash
        })
    });
};

describe('workshop modules API', () => {
    it('编辑投稿时可以更新完整模块 JSON 内容', async () => {
        const existingEntry = {
            id: 'CWM-TOPIC-demo',
            type: 'topic',
            formatVersion: 2,
            workshopKind: 'standard_module',
            title: '原模式包',
            subtitle: '原副标题',
            description: '原简介',
            tags: ['原标签'],
            payload: {
                suiteId: 'suite-demo',
                manualWorldPrompt: '旧世界观'
            },
            worldDetailGeneration: {
                aiGenerate: true,
                importantPeople: '',
                importantFactions: '',
                mapDesign: '旧地图口径'
            },
            modeRuntimeProfile: {
                identity: { baseMode: '仙侠' }
            },
            modeWorldbooks: [{
                id: 'old-book',
                标题: '旧世界书',
                条目: []
            }],
            contentBlocks: [{
                id: 'topic-main',
                title: '题材模板',
                purpose: '测试',
                content: '旧世界观',
                injectionTarget: 'manualWorldPrompt'
            }],
            usagePrompt: '旧提示',
            safetyNotes: [],
            injectionPreview: ['旧预览'],
            contributor: 'tester',
            createdAt: '2026-07-05T00:00:00.000Z',
            updatedAt: '2026-07-05T00:00:00.000Z',
            sha256: 'old',
            r2Key: 'moranjianghu/workshop/modules/entries/CWM-TOPIC-demo.json',
            ownerUserId: 'user-1',
            ownerUsername: 'tester',
            anonymous: false
        };
        const workshopBucket = createBucket({
            [workshopIndexKey]: JSON.stringify({ entries: [existingEntry] }),
            [existingEntry.r2Key]: JSON.stringify(existingEntry)
        });
        const authBucket = await createAuthBucket('tester', 'secret123');

        const response = await onRequestPost({
            env: { WORKSHOP_R2: workshopBucket, CLOUD_PLAY_R2: authBucket },
            request: new Request('https://example.com/api/workshop/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    id: existingEntry.id,
                    auth: { username: 'tester', password: 'secret123' },
                    patch: {
                        title: '改名后的模式包',
                        tags: ['新标签'],
                        module: {
                            ...existingEntry,
                            title: '改名后的模式包',
                            payload: {
                                ...existingEntry.payload,
                                manualWorldPrompt: '新世界观'
                            },
                            worldDetailGeneration: {
                                ...existingEntry.worldDetailGeneration,
                                mapDesign: '新地图口径'
                            },
                            modeRuntimeProfile: {
                                identity: { baseMode: '凡人修仙' }
                            },
                            modeWorldbooks: [{
                                id: 'new-book',
                                标题: '新世界书',
                                条目: [{
                                    id: 'rule-1',
                                    标题: '世界规则',
                                    内容: '新规则'
                                }]
                            }],
                            contentBlocks: [{
                                ...existingEntry.contentBlocks[0],
                                content: '新世界观'
                            }],
                            injectionPreview: ['新预览']
                        }
                    }
                })
            })
        } as any);

        const payload = await response.json() as any;

        expect(response.status).toBe(200);
        expect(payload.entry.title).toBe('改名后的模式包');
        expect(payload.entry.payload.manualWorldPrompt).toBe('新世界观');
        expect(payload.entry.worldDetailGeneration.mapDesign).toBe('新地图口径');
        expect(payload.entry.modeRuntimeProfile.identity.baseMode).toBe('凡人修仙');
        expect(payload.entry.modeWorldbooks[0].id).toBe('new-book');
        expect(payload.entry.contentBlocks[0].content).toBe('新世界观');
        expect(payload.entry.ownerUserId).toBe('user-1');
    });

    it('接受普通标准 topic，并由服务端建立版本链', async () => {
        const workshopBucket = createBucket({ [workshopIndexKey]: JSON.stringify({ entries: [] }) });
        const authBucket = await createAuthBucket('tester', 'secret123');
        const response = await onRequestPost({
            env: { WORKSHOP_R2: workshopBucket, CLOUD_PLAY_R2: authBucket },
            request: new Request('https://example.com/api/workshop/modules', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth: { username: 'tester', password: 'secret123' },
                    contributor: 'tester',
                    module: {
                        id: 'client-id', type: 'topic', title: '普通题材补充', subtitle: '', description: '', tags: ['武侠'],
                        payload: { schema: 'moranjianghu-creative-workshop-standard-module', version: 2, content: '普通正文' },
                        contentBlocks: [{ id: 'topic-main', title: '正文', purpose: '补充', content: '普通正文', injectionTarget: 'manualWorldPrompt' }],
                        injectionPreview: ['普通正文'], version: 999, baseModuleId: 'client-forged-chain'
                    }
                })
            })
        } as any);
        const payload = await response.json() as any;
        expect(response.status).toBe(200);
        expect(payload.entry.version).toBe(1);
        expect(payload.entry.baseModuleId).toBe(payload.entry.id);
    });

    it('拒绝跨作者劫持版本链，并只给同 owner 链分配下一版本', async () => {
        const foreignEntry = {
            id: 'foreign-v1', type: 'topic', title: '共享标题', subtitle: '', description: '', tags: [], payload: {}, injectionPreview: [],
            contributor: 'alice', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', version: 5,
            baseModuleId: 'alice-chain', sha256: 'x', r2Key: 'foreign.json', ownerUserId: 'alice-id', ownerUsername: 'alice'
        };
        const workshopBucket = createBucket({ [workshopIndexKey]: JSON.stringify({ entries: [foreignEntry] }) });
        const authBucket = await createAuthBucket('tester', 'secret123', 'user-1');
        const publish = async (baseModuleId: string, title: string) => onRequestPost({
            env: { WORKSHOP_R2: workshopBucket, CLOUD_PLAY_R2: authBucket },
            request: new Request('https://example.com/api/workshop/modules', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth: { username: 'tester', password: 'secret123' }, module: { type: 'topic', title, subtitle: '', description: '', tags: [], payload: { schema: 'moranjianghu-creative-workshop-standard-module', content: `${title}-${baseModuleId}` }, injectionPreview: [`${title}-${baseModuleId}`], baseModuleId, version: 999 } })
            })
        } as any);
        const first = await (await publish('alice-chain', '共享标题')).json() as any;
        expect(first.entry.baseModuleId).not.toBe('alice-chain');
        expect(first.entry.version).toBe(1);
        const second = await (await publish(first.entry.baseModuleId, '共享标题')).json() as any;
        expect(second.entry.baseModuleId).toBe(first.entry.baseModuleId);
        expect(second.entry.version).toBe(2);
    });

    it('并发发布使用独立索引增量，不会互相覆盖', async () => {
        const workshopBucket = createBucket({ [workshopIndexKey]: JSON.stringify({ entries: [] }) });
        const authBucket = await createAuthBucket('tester', 'secret123');
        const env = { WORKSHOP_R2: workshopBucket, CLOUD_PLAY_R2: authBucket };
        const publish = (title: string) => onRequestPost({
            env,
            request: new Request('https://example.com/api/workshop/modules', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auth: { username: 'tester', password: 'secret123' }, module: { type: 'topic', title, subtitle: '', description: '', tags: [], payload: { schema: 'moranjianghu-creative-workshop-standard-module', content: title }, injectionPreview: [title] } })
            })
        } as any);
        const responses = await Promise.all([publish('并发模块甲'), publish('并发模块乙')]);
        expect(responses.every((response) => response.status === 200)).toBe(true);
        const listResponse = await onRequestGet({ env, request: new Request('https://example.com/api/workshop/modules') } as any);
        const listed = await listResponse.json() as any;
        expect(listed.entries.map((entry: any) => entry.title)).toEqual(expect.arrayContaining(['并发模块甲', '并发模块乙']));
    });
});
