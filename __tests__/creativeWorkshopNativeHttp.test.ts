import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nativeRuntimeMock = vi.hoisted(() => ({ native: true }));
const capacitorHttpRequestMock = vi.hoisted(() => vi.fn());

vi.mock('../utils/nativeRuntime', () => ({
    isNativeCapacitorEnvironment: () => nativeRuntimeMock.native
}));

vi.mock('@capacitor/core', () => ({
    CapacitorHttp: {
        request: capacitorHttpRequestMock
    }
}));

const createLocalStorageMock = () => ({
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
});

describe('creativeWorkshop native HTTP', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        nativeRuntimeMock.native = true;
        vi.stubGlobal('localStorage', createLocalStorageMock());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('loads workshop modules through CapacitorHttp in the APK runtime', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => {
            throw new Error('native runtime should not use patched fetch for workshop list');
        }));
        capacitorHttpRequestMock.mockResolvedValueOnce({
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            data: {
                ok: true,
                entries: [{
                    id: 'CWM-TAVERN_PRESET-native-demo',
                    type: 'tavern_preset',
                    title: 'APK 原生创意工坊预设',
                    subtitle: 'native',
                    description: '通过 CapacitorHttp 拉取。',
                    tags: ['酒馆预设'],
                    payload: {
                        tavernPreset: {
                            prompts: [{ identifier: 'main', role: 'system', content: 'native preset' }],
                            prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }]
                        }
                    },
                    injectionPreview: ['提示词：1 条']
                }]
            }
        });

        const { 列出创意工坊模块 } = await import('../services/creativeWorkshop');
        const modules = await 列出创意工坊模块();

        expect(capacitorHttpRequestMock).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://msjh.bacon159.pp.ua/api/workshop/modules',
            method: 'GET',
            headers: { Accept: 'application/json' },
            connectTimeout: 12000,
            readTimeout: 12000
        }));
        expect(fetch).not.toHaveBeenCalled();
        expect(modules.some((entry) => entry.id === 'CWM-TAVERN_PRESET-native-demo' && entry.source === 'cloud')).toBe(true);
    });
});
