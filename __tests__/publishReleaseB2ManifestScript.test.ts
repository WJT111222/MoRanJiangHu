import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptPath = path.join(process.cwd(), 'scripts', 'publish-release-b2.mjs');

describe('release publish manifest script', () => {
    it('defaults the APK manifest to GitHub with accelerators and OneDrive fallbacks, without B2 distribution', () => {
        const source = readFileSync(scriptPath, 'utf8');

        expect(source).not.toContain("readEnv('MORAN_RELEASE_PREFERRED_APK_PROVIDER', 'hi168')");
        expect(source).toContain("readEnv('MORAN_RELEASE_PREFERRED_APK_PROVIDER', 'github-raw')");
        expect(source).toContain('githubRawAcceleratedApkUrl');
        expect(source).toContain('githubRawDirectApkUrl: providerApkUrls.githubRawDirect');
        expect(source).toContain('providerApkUrls.onedrive');
        expect(source).toContain('providerApkUrls.onedriveDirect');
        expect(source).not.toContain('providerApkUrls.b2');
        expect(source).toContain('githubDirectApkUrl: providerApkUrls.githubDirect');
        expect(source).toContain('oneDriveDirectApkUrl: providerApkUrls.onedriveDirect');
        expect(source).toContain('...githubAcceleratedApkUrls');
        expect(source).not.toContain('...orderedProviderUrls,\n      providerApkUrls.github');
        expect(source).toContain("readEnv('GITHUB_RELEASE_ACCELERATORS', 'https://gh.ddlc.top,https://gh-proxy.com,https://gh-proxy.ygxz.in,https://ghfast.top')");
        expect(source).toContain('B2 release distribution is decommissioned');
        expect(source).toContain("process.env.MORAN_B2_SKIP_APK_UPLOAD !== '0'");
    });
});
