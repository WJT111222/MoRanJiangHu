import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    API_CONFIG_LOCAL_MIRROR_KEY,
    创建接口配置模板,
    读取接口设置本地镜像,
    写入接口设置本地镜像,
    规范化接口设置
} from '../utils/apiConfig';

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

describe('api config local mirror', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('stores and reads a normalized API config mirror for reload recovery', () => {
        const localStorage = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorage);

        const settings = 规范化接口设置({
            activeConfigId: 'api_1',
            configs: [{
                ...创建接口配置模板('openai_compatible'),
                id: 'api_1',
                名称: '主接口',
                baseUrl: 'https://api.example.test/v1',
                apiKey: 'sk-test',
                model: 'gpt-test'
            }]
        });

        写入接口设置本地镜像(settings);

        expect(localStorage.setItem).toHaveBeenCalledWith(
            API_CONFIG_LOCAL_MIRROR_KEY,
            expect.stringContaining('api.example.test')
        );
        expect(读取接口设置本地镜像()?.configs[0]?.model).toBe('gpt-test');
    });

    it('returns null when the mirror is unavailable or corrupted', () => {
        const localStorage = createLocalStorageMock();
        localStorage.setItem(API_CONFIG_LOCAL_MIRROR_KEY, '{bad json');
        vi.stubGlobal('localStorage', localStorage);

        expect(读取接口设置本地镜像()).toBeNull();
    });
});
