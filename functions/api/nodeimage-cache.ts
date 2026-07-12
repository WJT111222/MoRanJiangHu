import { APK_CORS_HEADERS } from './apk/_shared';

const NODEIMAGE_CACHE_CONTROL = 'public, max-age=2592000, immutable';
const NODEIMAGE_ERROR_CACHE_CONTROL = 'public, max-age=30';
const NODEIMAGE_HOSTS = new Set(['cdn.nodeimage.com']);
const NODEIMAGE_IMAGE_PATH = /^\/i\/[A-Za-z0-9_-]+\.(png|jpe?g|webp|gif)$/i;

const buildTextResponse = (message: string, status = 400): Response => new Response(message, {
    status,
    headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': NODEIMAGE_ERROR_CACHE_CONTROL,
        ...APK_CORS_HEADERS
    }
});

const readTargetUrl = (request: Request): URL | null => {
    const raw = new URL(request.url).searchParams.get('url') || '';
    if (!raw) return null;
    try {
        return new URL(raw);
    } catch {
        return null;
    }
};

const isAllowedNodeImageUrl = (target: URL): boolean => (
    target.protocol === 'https:'
    && NODEIMAGE_HOSTS.has(target.hostname)
    && NODEIMAGE_IMAGE_PATH.test(target.pathname)
);

const copyImageHeaders = (upstream: Response): Headers => {
    const headers = new Headers();
    const contentType = upstream.headers.get('Content-Type') || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);
    const etag = upstream.headers.get('ETag');
    if (etag) headers.set('ETag', etag);
    const lastModified = upstream.headers.get('Last-Modified');
    if (lastModified) headers.set('Last-Modified', lastModified);
    headers.set('Cache-Control', NODEIMAGE_CACHE_CONTROL);
    headers.set('CDN-Cache-Control', NODEIMAGE_CACHE_CONTROL);
    headers.set('Cloudflare-CDN-Cache-Control', NODEIMAGE_CACHE_CONTROL);
    headers.set('X-Moran-NodeImage-Cache', 'miss');
    Object.entries(APK_CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));
    return headers;
};

const handleNodeImageCache = async (context: any, method: 'GET' | 'HEAD'): Promise<Response> => {
    const { request } = context;
    const target = readTargetUrl(request);
    if (!target || !isAllowedNodeImageUrl(target)) {
        return buildTextResponse('Invalid NodeImage URL', 400);
    }

    const cache = method === 'GET' && typeof caches !== 'undefined' ? caches.default : null;
    const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
    if (cache) {
        const cached = await cache.match(cacheKey);
        if (cached) {
            const headers = new Headers(cached.headers);
            headers.set('X-Moran-NodeImage-Cache', 'hit');
            return method === 'HEAD'
                ? new Response(null, { status: cached.status, statusText: cached.statusText, headers })
                : new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
        }
    }

    const upstream = await fetch(target.toString(), {
        method: 'GET',
        headers: {
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
    });

    if (!upstream.ok) {
        const retryAfter = upstream.headers.get('Retry-After') || '5';
        return new Response('NodeImage upstream is temporarily busy', {
            status: upstream.status === 429 ? 429 : 502,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': NODEIMAGE_ERROR_CACHE_CONTROL,
                'Retry-After': retryAfter,
                'X-Moran-NodeImage-Cache': 'upstream-error',
                ...APK_CORS_HEADERS
            }
        });
    }

    const finalResponse = new Response(method === 'HEAD' ? null : upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: copyImageHeaders(upstream)
    });

    if (cache && method === 'GET') {
        context.waitUntil?.(cache.put(cacheKey, finalResponse.clone()));
    }

    return finalResponse;
};

export function onRequestOptions(): Response {
    return new Response(null, { status: 204, headers: APK_CORS_HEADERS });
}

export const onRequestGet = (context: any): Promise<Response> => handleNodeImageCache(context, 'GET');

export const onRequestHead = (context: any): Promise<Response> => handleNodeImageCache(context, 'HEAD');
