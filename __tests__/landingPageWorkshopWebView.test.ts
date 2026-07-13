import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string => (
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
);

describe('APK 创意工坊入口', () => {
    it('APK 首页创意工坊按钮改为打开线上 WebView，网页参数入口仍自动弹出工坊', () => {
        const source = readSource('components/layout/LandingPage.tsx');

        expect(source).toContain("WORKSHOP_QUERY_VALUE = 'workshop'");
        expect(source).toContain("await import('@capacitor/browser')");
        expect(source).toContain("await Browser.open({ url: remoteWorkshopUrl, presentationStyle: 'fullscreen' })");
        expect(source).toContain('url.searchParams.set(WORKSHOP_QUERY_PARAM, WORKSHOP_QUERY_VALUE)');
        expect(source).toContain('url.searchParams.get(WORKSHOP_QUERY_PARAM) !== WORKSHOP_QUERY_VALUE');
        expect(source).toContain('void handleOpenWorkshop();');
        expect(source).not.toContain('<GameButton onClick={() => setWorkshopOpen(true)} variant="secondary"');
    });
});
