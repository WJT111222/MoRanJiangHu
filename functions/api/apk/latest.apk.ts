import {
    APK_CORS_HEADERS,
    APK_LATEST_CACHE_CONTROL,
    buildGitHubApkRedirect,
    buildGitHubRawApkRedirect,
    buildOneDriveApkRedirect,
    buildVersionedApkFileName,
    buildTextResponse,
    isOneDriveDirectProvider,
    isOneDriveProvider,
    readManifestPayload,
    readManifestPreferredApkProvider,
    readManifestVersionName,
} from './_shared';

const handleLatestApkRequest = async ({ request, env }: any): Promise<Response> => {
    try {
        const manifest = await readManifestPayload(env);
        const versionName = readManifestVersionName(manifest?.payload);
        const versionedFileName = buildVersionedApkFileName(versionName);
        const fileName = versionedFileName || 'MoRanJiangHu-latest.apk';
        const requestedProvider = new URL(request.url).searchParams.get('provider');
        const provider = requestedProvider || readManifestPreferredApkProvider(manifest?.payload);
        if (provider === 'b2') {
            return buildTextResponse('B2 APK provider is decommissioned', 410);
        }
        if (isOneDriveProvider(provider)) {
            const oneDriveResponse = await buildOneDriveApkRedirect(
                env,
                fileName,
                APK_LATEST_CACHE_CONTROL,
                isOneDriveDirectProvider(provider) ? 'direct' : 'public'
            );
            if (oneDriveResponse) return oneDriveResponse;
            return buildTextResponse('OneDrive APK not available', 502);
        }
        if (provider === 'github') {
            const accelerator = typeof env?.MORAN_GITHUB_RELEASE_ACCELERATOR === 'string'
                ? env.MORAN_GITHUB_RELEASE_ACCELERATOR
                : undefined;
            const githubResponse = buildGitHubApkRedirect(versionName, fileName, APK_LATEST_CACHE_CONTROL, accelerator);
            if (githubResponse) return githubResponse;
            return buildTextResponse('GitHub Release APK not available', 502);
        }
        if (provider === 'github-raw') {
            const accelerator = typeof env?.MORAN_GITHUB_RAW_ACCELERATOR === 'string'
                ? env.MORAN_GITHUB_RAW_ACCELERATOR
                : undefined;
            const githubRawResponse = buildGitHubRawApkRedirect(fileName, APK_LATEST_CACHE_CONTROL, accelerator);
            if (githubRawResponse) return githubRawResponse;
            return buildTextResponse('GitHub Raw APK not available', 502);
        }
        const githubRawResponse = buildGitHubRawApkRedirect(fileName, APK_LATEST_CACHE_CONTROL);
        if (githubRawResponse) return githubRawResponse;
        return buildTextResponse('GitHub Raw APK not available', 502);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export const onRequestGet = handleLatestApkRequest;
export const onRequestHead = handleLatestApkRequest;
