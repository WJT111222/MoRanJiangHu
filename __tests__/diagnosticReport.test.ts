import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/appUpdate', () => ({
    getCurrentAppRelease: vi.fn(async () => ({
        versionCode: 205,
        versionName: '1.0.204'
    }))
}));

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

describe('diagnosticReport', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubGlobal('localStorage', createLocalStorageMock());
        vi.stubGlobal('navigator', {
            userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile',
            language: 'zh-CN',
            platform: 'Android'
        });
        vi.stubGlobal('screen', {
            width: 390,
            height: 844
        });
        vi.stubGlobal('window', {
            location: {
                protocol: 'capacitor:',
                href: 'capacitor://localhost'
            },
            screen: {
                width: 390,
                height: 844
            },
            devicePixelRatio: 3,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('falls back to the backup diagnostic endpoint when the primary returns HTTP 200 with a non-report body', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response('<!doctype html><title>SPA fallback</title>', {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            }))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                ok: true,
                id: 'diag_test',
                createdAt: '2026-05-17T09:00:00+08:00',
                expiresAt: '2026-06-17T09:00:00+08:00',
                remainingToday: 9
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        vi.stubGlobal('fetch', fetchMock);

        const { submitDiagnosticReport } = await import('../services/diagnosticReport');
        const result = await submitDiagnosticReport([{
            id: 'log_test',
            level: 'error',
            message: '图床上传失败：error code: 1102',
            detail: { status: 503 },
            createdAt: '2026-05-17T09:00:00+08:00'
        } as any]);

        expect(result).toMatchObject({
            id: 'diag_test',
            remainingToday: 9
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(String(fetchMock.mock.calls[0][0])).toContain('msjh.bacon159.pp.ua/api/diagnostics/report');
        expect(String(fetchMock.mock.calls[1][0])).toContain('msjh.bacon.de5.net/api/diagnostics/report');
    });
});
