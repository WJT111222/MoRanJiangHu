import { afterEach, describe, expect, it, vi } from 'vitest';

const capacitorState = vi.hoisted(() => ({
    native: true,
    platform: 'android',
    plugins: {} as Record<string, boolean>
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => capacitorState.native,
        getPlatform: () => capacitorState.platform,
        isPluginAvailable: (name: string) => capacitorState.plugins[name] === true
    },
    SystemBars: {
        hide: vi.fn(),
        show: vi.fn()
    },
    SystemBarType: {
        StatusBar: 'status',
        NavigationBar: 'navigation'
    }
}));

describe('nativeRuntime App plugin guard', () => {
    afterEach(() => {
        capacitorState.native = true;
        capacitorState.platform = 'android';
        capacitorState.plugins = {};
        vi.resetModules();
        vi.unstubAllGlobals();
    });

    it('treats the App plugin as unavailable when the native bridge does not provide it', async () => {
        vi.stubGlobal('window', {
            location: {
                protocol: 'https:',
                hostname: 'msjh.bacon159.pp.ua'
            },
            Capacitor: {
                isNativePlatform: () => true,
                getPlatform: () => 'android',
                isPluginAvailable: () => false
            }
        });

        const { isCapacitorPluginAvailable } = await import('../utils/nativeRuntime');

        expect(isCapacitorPluginAvailable('App')).toBe(false);
    });

    it('reports the App plugin as available only when the bridge explicitly exposes it', async () => {
        capacitorState.plugins = { App: true };
        vi.stubGlobal('window', {
            location: {
                protocol: 'capacitor:',
                hostname: 'localhost'
            },
            Capacitor: {
                isNativePlatform: () => true,
                getPlatform: () => 'android',
                isPluginAvailable: (name: string) => name === 'App'
            }
        });

        const { isCapacitorPluginAvailable } = await import('../utils/nativeRuntime');

        expect(isCapacitorPluginAvailable('App')).toBe(true);
    });
});
