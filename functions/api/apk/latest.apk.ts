import {
    APK_CORS_HEADERS,
    APK_LATEST_CACHE_CONTROL,
    buildB2ApkRedirect,
    buildOneDriveApkRedirect,
    buildVersionedApkFileName,
    buildTextResponse,
    normalizeObjectKey,
    readManifestPayload,
    readReleaseObjectPrefix
} from './_shared';

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export async function onRequestGet({ request, env }: any): Promise<Response> {
    try {
        const manifest = await readManifestPayload(env);
        const versionedFileName = buildVersionedApkFileName(manifest?.payload?.latest?.versionName);
        const fileName = versionedFileName || 'MoRanJiangHu-latest.apk';
        const prefix = readReleaseObjectPrefix(env);
        const key = normalizeObjectKey(`${prefix}/${versionedFileName || 'latest.apk'}`);
        const provider = new URL(request.url).searchParams.get('provider');
        if (provider === 'onedrive') {
            const oneDriveResponse = await buildOneDriveApkRedirect(env, fileName, APK_LATEST_CACHE_CONTROL);
            if (oneDriveResponse) return oneDriveResponse;
            return buildTextResponse('OneDrive APK not available', 502);
        }
        return buildB2ApkRedirect(env, key, fileName, APK_LATEST_CACHE_CONTROL);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}

export async function onRequestHead({ request, env }: any): Promise<Response> {
    try {
        const manifest = await readManifestPayload(env);
        const versionedFileName = buildVersionedApkFileName(manifest?.payload?.latest?.versionName);
        const fileName = versionedFileName || 'MoRanJiangHu-latest.apk';
        const prefix = readReleaseObjectPrefix(env);
        const key = normalizeObjectKey(`${prefix}/${versionedFileName || 'latest.apk'}`);
        const provider = new URL(request.url).searchParams.get('provider');
        if (provider === 'onedrive') {
            const oneDriveResponse = await buildOneDriveApkRedirect(env, fileName, APK_LATEST_CACHE_CONTROL);
            if (oneDriveResponse) return oneDriveResponse;
            return buildTextResponse('OneDrive APK not available', 502);
        }
        return buildB2ApkRedirect(env, key, fileName, APK_LATEST_CACHE_CONTROL);
    } catch (error: any) {
        return buildTextResponse(error?.message || 'APK redirect failed', 502);
    }
}
