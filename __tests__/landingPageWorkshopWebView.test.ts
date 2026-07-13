import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string => (
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
);

describe('APK 创意工坊入口', () => {
    it('APK 首页创意工坊按钮改为在当前 WebView 打开线上页面，网页参数入口仍自动弹出工坊', () => {
        const source = readSource('components/layout/LandingPage.tsx');

        expect(source).toContain("WORKSHOP_QUERY_VALUE = 'workshop'");
        expect(source).toContain("WORKSHOP_SUPPRESS_RELEASE_NOTES_PARAM = 'skipReleaseNotes'");
        expect(source).toContain('window.location.assign(remoteWorkshopUrl)');
        expect(source).not.toContain("await import('@capacitor/browser')");
        expect(source).not.toContain('Browser.open');
        expect(source).toContain('url.searchParams.set(WORKSHOP_QUERY_PARAM, WORKSHOP_QUERY_VALUE)');
        expect(source).toContain("url.searchParams.set(WORKSHOP_SUPPRESS_RELEASE_NOTES_PARAM, '1')");
        expect(source).toContain('url.searchParams.get(WORKSHOP_QUERY_PARAM) !== WORKSHOP_QUERY_VALUE');
        expect(source).toContain('void handleOpenWorkshop();');
        expect(source).not.toContain('<GameButton onClick={() => setWorkshopOpen(true)} variant="secondary"');
    });

    it('线上创意工坊参数入口不会被更新日志弹窗挡住', () => {
        const source = readSource('App.tsx');

        expect(source).toContain("WORKSHOP_OPEN_QUERY_PARAM = 'open'");
        expect(source).toContain("WORKSHOP_OPEN_QUERY_VALUE = 'workshop'");
        expect(source).toContain("RELEASE_NOTES_SKIP_QUERY_PARAM = 'skipReleaseNotes'");
        expect(source).toContain('query.get(WORKSHOP_OPEN_QUERY_PARAM) === WORKSHOP_OPEN_QUERY_VALUE');
        expect(source).toContain("query.get(RELEASE_NOTES_SKIP_QUERY_PARAM) === '1'");
        expect(source).toContain('setShowReleaseNotes(true)');
    });
});
