import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('publish GitHub Raw APK script', () => {
    it('publishes APKs to a dedicated raw distribution branch', () => {
        const script = fs.readFileSync(path.join(process.cwd(), 'scripts', 'publish-apk-github-raw.mjs'), 'utf8');
        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

        expect(pkg.scripts['release:github-raw']).toBe('node scripts/publish-apk-github-raw.mjs');
        expect(script).toContain("const branch = process.env.GITHUB_RAW_APK_BRANCH || 'apk-dist'");
        expect(script).toContain('raw.githubusercontent.com');
        expect(script).toContain('cloudflare-proxy-6rw.pages.dev');
        expect(script).toContain("run('git', ['push', remote, `HEAD:${branch}`]");
    });
});
