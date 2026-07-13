import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { 删除本地创意工坊模块, 导入本地创意工坊模块, 更新本地创意工坊模块, 列出创意工坊模块, 本地创意工坊模块存储键, 云端创意工坊模块缓存键, 读取本地创意工坊模块 } from '../services/creativeWorkshop';

const createLocalStorageMock = () => {
    const store = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn(() => {
            store.clear();
        })
    };
};

const 创建旧版开局模块 = () => ({
    id: 'legacy-opening-demo',
    type: 'opening' as const,
    title: '旧版开局模板',
    subtitle: '',
    description: '旧版创意工坊开局模块',
    tags: ['旧版', '兼容'],
    payload: {
        mode: '武侠',
        content: '这是旧版开局模块正文，用来约束开局规则。',
        modeRuntimeProfile: {
            identity: {
                modeId: 'legacy-opening-demo',
                displayName: '旧版开局模板',
                baseMode: '武侠'
            },
            opening: {
                defaultBackgrounds: ['江湖散人'],
                defaultTalents: ['稳扎稳打'],
                companionTemplate: '旧版伙伴模板',
                cutInTemplates: ['雨夜入城'],
                initialQuestTemplates: ['先避风头'],
                allowedGeneratedGenders: ['女'],
                lockGeneratedGenders: true,
                defaultEquipment: {
                    武器: '青锋剑'
                },
                defaultCurrency: {
                    底层货币: 88
                }
            }
        }
    },
    injectionPreview: ['旧版开局预览'],
    source: 'local' as const
});

const 创建酒馆预设模块 = () => ({
    id: 'local-tavern-demo',
    type: 'tavern_preset' as const,
    title: '玩家上传酒馆预设',
    subtitle: 'SillyTavern preset',
    description: '本地测试用酒馆预设。',
    tags: ['酒馆预设'],
    payload: {
        tavernPreset: {
            prompts: [{
                identifier: 'main',
                role: 'system',
                content: '测试提示词'
            }],
            prompt_order: [{
                character_id: 100001,
                order: [{ identifier: 'main', enabled: true }]
            }]
        }
    },
    injectionPreview: ['提示词：1 条'],
    source: 'local' as const,
    contributor: '测试玩家'
});

describe('creativeWorkshop service compatibility', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.stubGlobal('localStorage', createLocalStorageMock());
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, entries: [] }))));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('读取本地旧版 opening 模块时会自动升级并回写为当前结构', () => {
        const legacy = 创建旧版开局模块();
        localStorage.setItem(本地创意工坊模块存储键, JSON.stringify([legacy]));
        vi.mocked(localStorage.setItem).mockClear();

        const modules = 读取本地创意工坊模块();

        expect(modules).toHaveLength(1);
        expect(modules[0].type).toBe('topic');
        expect(modules[0].formatVersion).toBe(2);
        expect(modules[0].workshopKind).toBe('standard_module');
        expect(modules[0].payload?.legacyType).toBe('opening');
        expect(modules[0].payload?.migratedFromLegacyOpening).toBe(true);
        expect(modules[0].modeRuntimeProfile?.opening?.defaultEquipment).toEqual({ 武器: '青锋剑' });
        expect(modules[0].modeRuntimeProfile?.opening?.defaultCurrency).toEqual({ 底层货币: 88 });
        expect(modules[0].contentBlocks?.[0]?.content).toContain('旧版开局模块正文');
        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        const [, rewritten] = vi.mocked(localStorage.setItem).mock.calls[0];
        expect(rewritten).toContain('"type":"topic"');
        expect(rewritten).toContain('"legacyType":"opening"');
    });

    it('导入的旧版 opening 模块会在当前列表中以独立模式包出现', async () => {
        导入本地创意工坊模块(创建旧版开局模块() as any);

        const modules = await 列出创意工坊模块();
        const migrated = modules.find((entry) => entry.source === 'local' && entry.payload?.suiteId === 'legacy-opening-legacy-opening-demo');

        expect(migrated).toBeTruthy();
        expect(migrated?.type).toBe('topic');
        expect(migrated?.payload?.packagePart).toBe('mode_package');
        expect(migrated?.id).toBe('legacy-opening-legacy-opening-demo-mode-package');
        expect(migrated?.modeRuntimeProfile?.opening?.lockGeneratedGenders).toBe(true);
        expect(String(migrated?.payload?.manualWorldPrompt || '')).toContain('旧版开局模块正文');
    });

    it('本地导入的模块可以从本地测试列表删除', () => {
        const imported = 导入本地创意工坊模块(创建旧版开局模块() as any);

        expect(读取本地创意工坊模块().some((entry) => entry.id === imported.id)).toBe(true);

        删除本地创意工坊模块(imported.id);

        expect(读取本地创意工坊模块().some((entry) => entry.id === imported.id)).toBe(false);
    });

    it('本地导入的模块可以编辑完整 JSON 并保留本地来源', () => {
        const imported = 导入本地创意工坊模块(创建旧版开局模块() as any);

        const updated = 更新本地创意工坊模块(imported.id, {
            ...imported,
            title: '改名后的本地模式包',
            payload: {
                ...imported.payload,
                manualWorldPrompt: '编辑后的完整 JSON 内容'
            },
            injectionPreview: ['编辑后预览']
        } as any);

        expect(updated.title).toBe('改名后的本地模式包');
        expect(updated.source).toBe('local');
        expect(updated.payload?.manualWorldPrompt).toBe('编辑后的完整 JSON 内容');
        expect(读取本地创意工坊模块().find((entry) => entry.id === imported.id)?.title).toBe('改名后的本地模式包');
    });

    it('本地酒馆预设模块可导入、列出并保持玩家上传来源', async () => {
        const imported = 导入本地创意工坊模块(创建酒馆预设模块() as any);

        expect(imported.type).toBe('tavern_preset');
        expect(imported.source).toBe('local');
        expect(imported.payload?.tavernPreset).toBeTruthy();

        const modules = await 列出创意工坊模块();
        const listed = modules.find((entry) => entry.id === imported.id);

        expect(listed?.type).toBe('tavern_preset');
        expect(listed?.source).toBe('local');
        expect(listed?.contributor).toBe('测试玩家');
    });

    it('本地静态站接口被首页兜底时会从主站拉取完整社区酒馆预设', async () => {
        vi.stubGlobal('window', {
            location: {
                protocol: 'http:',
                origin: 'http://127.0.0.1:4173'
            }
        });
        const fetchMock = vi.fn(async (url: string) => {
            if (url === 'http://127.0.0.1:4173/api/workshop/modules') {
                return new Response('<!doctype html><title>墨染江湖</title>', {
                    status: 200,
                    headers: { 'Content-Type': 'text/html;charset=utf-8' }
                });
            }
            if (url === 'https://msjh.bacon159.pp.ua/api/workshop/modules') {
                return new Response(JSON.stringify({
                    ok: true,
                    entries: [{
                        id: 'CWM-TAVERN_PRESET-20260708190037-0C4P0M6S',
                        type: 'tavern_preset',
                        title: '双人成行v10.0_青云上_MoRan墨染江湖净化完整版',
                        subtitle: '社区酒馆预设',
                        description: '云端社区贡献的酒馆预设。',
                        tags: ['酒馆预设'],
                        payload: {
                            tavernPreset: {
                                prompts: [{
                                    identifier: 'main',
                                    role: 'system',
                                    content: '社区预设提示词'
                                }],
                                prompt_order: [{
                                    character_id: 100001,
                                    order: [{ identifier: 'main', enabled: true }]
                                }]
                            }
                        },
                        injectionPreview: ['提示词：1 条']
                    }]
                }), { headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true, entries: [] }));
        });
        vi.stubGlobal('fetch', fetchMock);

        const modules = await 列出创意工坊模块();

        expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:4173/api/workshop/modules', expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }));
        expect(fetchMock).toHaveBeenCalledWith('https://msjh.bacon159.pp.ua/api/workshop/modules', expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }));
        const cloudTavernPreset = modules.find((entry) => entry.id === 'CWM-TAVERN_PRESET-20260708190037-0C4P0M6S');
        expect(cloudTavernPreset?.title).toBe('双人成行v10.0_青云上_MoRan墨染江湖净化完整版');
        expect(cloudTavernPreset?.type).toBe('tavern_preset');
        expect(cloudTavernPreset?.source).toBe('cloud');
        expect(cloudTavernPreset?.tavernPreset).toBeTruthy();
    });

    it('成功读取社区列表后会持久缓存玩家上传内容，避免 APK 每次打开都重新加载', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            ok: true,
            entries: [{
                id: 'CWM-TAVERN_PRESET-community-cache-demo',
                type: 'tavern_preset',
                title: '玩家上传缓存酒馆预设',
                subtitle: '社区投稿',
                description: '这条来自云端社区。',
                tags: ['社区', '酒馆预设'],
                payload: {
                    tavernPreset: {
                        prompts: [{ identifier: 'main', role: 'system', content: 'community preset' }],
                        prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }]
                    }
                },
                injectionPreview: ['提示词：1 条'],
                contributor: '玩家A'
            }]
        }), { headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', fetchMock);

        const modules = await 列出创意工坊模块({ forceRefresh: true });

        expect(modules.some((entry) => entry.id === 'CWM-TAVERN_PRESET-community-cache-demo' && entry.source === 'cloud')).toBe(true);
        const cached = JSON.parse(localStorage.getItem(云端创意工坊模块缓存键) || 'null');
        expect(cached?.entries?.some((entry: any) => entry.id === 'CWM-TAVERN_PRESET-community-cache-demo' && entry.source === 'cloud')).toBe(true);
    });

    it('云端请求失败时会使用上次成功缓存的社区玩家内容，而不是只剩官方预设', async () => {
        localStorage.setItem(云端创意工坊模块缓存键, JSON.stringify({
            version: 1,
            cachedAt: Date.now(),
            entries: [{
                id: 'CWM-TAVERN_PRESET-cached-community-demo',
                type: 'tavern_preset',
                title: '缓存里的玩家酒馆预设',
                subtitle: '社区投稿',
                description: '网络失败时仍应显示。',
                tags: ['酒馆预设'],
                payload: {
                    tavernPreset: {
                        prompts: [{ identifier: 'main', role: 'system', content: 'cached preset' }],
                        prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }]
                    }
                },
                injectionPreview: ['提示词：1 条'],
                source: 'cloud',
                contributor: '玩家B'
            }]
        }));
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('network down');
        }));

        const modules = await 列出创意工坊模块({ forceRefresh: true });
        const cachedCommunity = modules.find((entry) => entry.id === 'CWM-TAVERN_PRESET-cached-community-demo');

        expect(cachedCommunity?.source).toBe('cloud');
        expect(cachedCommunity?.tavernPreset).toBeTruthy();
    });

    it('缓存仍新鲜时自动打开创意工坊不会重新请求 5MB 社区列表', async () => {
        localStorage.setItem(云端创意工坊模块缓存键, JSON.stringify({
            version: 1,
            cachedAt: Date.now(),
            entries: [{
                id: 'CWM-TAVERN_PRESET-fresh-cache-demo',
                type: 'tavern_preset',
                title: '新鲜缓存玩家预设',
                subtitle: '社区投稿',
                description: '自动打开时直接来自缓存。',
                tags: ['酒馆预设'],
                payload: {
                    tavernPreset: {
                        prompts: [{ identifier: 'main', role: 'system', content: 'fresh cache preset' }],
                        prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }]
                    }
                },
                injectionPreview: ['提示词：1 条'],
                source: 'cloud',
                contributor: '玩家C'
            }]
        }));
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, entries: [] })));
        vi.stubGlobal('fetch', fetchMock);

        const modules = await 列出创意工坊模块();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(modules.some((entry) => entry.id === 'CWM-TAVERN_PRESET-fresh-cache-demo' && entry.source === 'cloud')).toBe(true);
    });
});
