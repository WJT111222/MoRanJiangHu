import { RELEASE_INFO } from '../data/releaseInfo';

export type RuntimeReleaseEntry = {
    versionCode?: number;
    versionName?: string;
    publishedAt?: string;
    changes?: string[];
};

export type RuntimeReleaseInfo = typeof RELEASE_INFO & {
    releaseHistory?: RuntimeReleaseEntry[];
};

const RELEASE_INFO_CACHE_MS = 5 * 60 * 1000;

let cachedRuntimeReleaseInfo: RuntimeReleaseInfo | null = null;
let cachedAt = 0;
let inflightRuntimeReleaseInfo: Promise<RuntimeReleaseInfo> | null = null;

const normalizeBaseUrl = (value?: string): string => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed ? trimmed.replace(/\/+$/, '') : '';
};

const getReleaseInfoEndpoint = (): string => {
    const fallbackBase = 'https://msjh.bacon159.pp.ua';
    const websiteBase = normalizeBaseUrl((RELEASE_INFO as any).websiteUrl) || fallbackBase;
    if (typeof window !== 'undefined') {
        try {
            const current = new URL(window.location.href);
            if (/^https?:$/i.test(current.protocol) && /msjh\.bacon(159\.pp\.ua|\.de5\.net)$/i.test(current.hostname)) {
                return `${current.origin}/release-info.json`;
            }
        } catch {
            // Keep the configured public website as the stable endpoint.
        }
    }
    return `${websiteBase}/release-info.json`;
};

const mergeReleaseInfo = (remote: Partial<RuntimeReleaseInfo>): RuntimeReleaseInfo => ({
    ...(RELEASE_INFO as RuntimeReleaseInfo),
    ...remote,
    releaseNotes: Array.isArray(remote.releaseNotes)
        ? remote.releaseNotes
        : RELEASE_INFO.releaseNotes,
    releaseHistory: Array.isArray(remote.releaseHistory)
        ? remote.releaseHistory
        : RELEASE_INFO.releaseHistory
});

export const fetchRuntimeReleaseInfo = async (options?: { force?: boolean }): Promise<RuntimeReleaseInfo> => {
    const now = Date.now();
    if (!options?.force && cachedRuntimeReleaseInfo && now - cachedAt < RELEASE_INFO_CACHE_MS) {
        return cachedRuntimeReleaseInfo;
    }
    if (!options?.force && inflightRuntimeReleaseInfo) {
        return inflightRuntimeReleaseInfo;
    }

    inflightRuntimeReleaseInfo = (async () => {
        try {
            const endpoint = new URL(getReleaseInfoEndpoint());
            endpoint.searchParams.set('t', String(Date.now()));
            const response = await fetch(endpoint.toString(), {
                cache: 'no-store',
                headers: {
                    Accept: 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            const next = payload && typeof payload === 'object'
                ? mergeReleaseInfo(payload as Partial<RuntimeReleaseInfo>)
                : (RELEASE_INFO as RuntimeReleaseInfo);
            cachedRuntimeReleaseInfo = next;
            cachedAt = Date.now();
            return next;
        } catch (error) {
            console.warn('Failed to fetch runtime release info, using bundled fallback:', error);
            const fallback = cachedRuntimeReleaseInfo || (RELEASE_INFO as RuntimeReleaseInfo);
            cachedRuntimeReleaseInfo = fallback;
            cachedAt = Date.now();
            return fallback;
        } finally {
            inflightRuntimeReleaseInfo = null;
        }
    })();

    return inflightRuntimeReleaseInfo;
};

export const getCachedRuntimeReleaseInfo = (): RuntimeReleaseInfo => (
    cachedRuntimeReleaseInfo || (RELEASE_INFO as RuntimeReleaseInfo)
);
