import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const loadPrebootListeners = () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const match = html.match(/<script>\s*([\s\S]*?window\.__MORAN_PREBOOT_LOGS__[\s\S]*?)<\/script>/);
    if (!match) throw new Error('preboot script not found');

    const listeners: Record<string, (event: any) => void> = {};
    const appended: any[] = [];
    const windowMock: any = {
        addEventListener: vi.fn((type: string, listener: (event: any) => void) => {
            listeners[type] = listener;
        })
    };
    const documentMock: any = {
        body: {
            appendChild: vi.fn((node: any) => {
                appended.push(node);
            })
        },
        createElement: vi.fn(() => ({
            id: '',
            style: {},
            textContent: ''
        }))
    };
    const consoleMock = {
        error: vi.fn(),
        warn: vi.fn()
    };

    new Function('window', 'document', 'console', match[1])(windowMock, documentMock, consoleMock);
    return { windowMock, listeners, appended };
};

describe('preboot error handling', () => {
    it('does not block app startup for recoverable NetworkError promise rejections', () => {
        const { windowMock, listeners, appended } = loadPrebootListeners();
        const preventDefault = vi.fn();

        listeners.unhandledrejection({
            reason: new TypeError('NetworkError when attempting to fetch resource.'),
            preventDefault
        });

        expect(preventDefault).toHaveBeenCalled();
        expect(appended).toHaveLength(0);
        expect(windowMock.__MORAN_PREBOOT_LOGS__[0].level).toBe('warn');
    });

    it('still shows the startup failure overlay for non-recoverable promise rejections', () => {
        const { listeners, appended } = loadPrebootListeners();

        listeners.unhandledrejection({
            reason: new Error('chunk boot failed'),
            preventDefault: vi.fn()
        });

        expect(appended).toHaveLength(1);
    });
});
