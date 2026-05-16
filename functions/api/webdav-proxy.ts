const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-WebDAV-Method, X-WebDAV-Target-Url'
};

const ALLOWED_METHODS = new Set(['GET', 'PUT', 'MKCOL']);

const buildJsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS
        }
    })
);

const isBlockedHostname = (hostname: string): boolean => {
    const lower = hostname.toLowerCase();
    if (lower === 'localhost' || lower.endsWith('.localhost')) return true;
    if (lower === 'metadata.google.internal') return true;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(lower)) {
        const parts = lower.split('.').map((part) => Number(part));
        const [a, b] = parts;
        return a === 0
            || a === 10
            || a === 127
            || (a === 169 && b === 254)
            || (a === 172 && b >= 16 && b <= 31)
            || (a === 192 && b === 168);
    }
    if (lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) return true;
    return false;
};

const readTargetUrl = (request: Request): string => {
    const raw = request.headers.get('X-WebDAV-Target-Url')?.trim() || '';
    if (!raw) throw new Error('Missing X-WebDAV-Target-Url header');

    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Unsupported WebDAV protocol');
    }
    if (isBlockedHostname(url.hostname)) {
        throw new Error('Blocked WebDAV target host');
    }
    return url.toString();
};

const readMethod = (request: Request): string => {
    const method = request.headers.get('X-WebDAV-Method')?.trim().toUpperCase() || '';
    if (!ALLOWED_METHODS.has(method)) {
        throw new Error('Unsupported WebDAV method');
    }
    return method;
};

const buildForwardHeaders = (request: Request): Headers => {
    const headers = new Headers();
    const authorization = request.headers.get('Authorization')?.trim() || '';
    const contentType = request.headers.get('Content-Type')?.trim() || '';
    const accept = request.headers.get('Accept')?.trim() || '';

    if (authorization) headers.set('Authorization', authorization);
    if (contentType) headers.set('Content-Type', contentType);
    if (accept) headers.set('Accept', accept);
    return headers;
};

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestPost({ request }: any): Promise<Response> {
    try {
        const targetUrl = readTargetUrl(request);
        const method = readMethod(request);
        const body = method === 'GET' || method === 'MKCOL'
            ? undefined
            : await request.arrayBuffer();

        const upstreamResponse = await fetch(targetUrl, {
            method,
            headers: buildForwardHeaders(request),
            body
        });

        const responseHeaders = new Headers();
        const contentType = upstreamResponse.headers.get('Content-Type');
        const etag = upstreamResponse.headers.get('ETag');
        const lastModified = upstreamResponse.headers.get('Last-Modified');
        if (contentType) responseHeaders.set('Content-Type', contentType);
        if (etag) responseHeaders.set('ETag', etag);
        if (lastModified) responseHeaders.set('Last-Modified', lastModified);
        Object.entries(CORS_HEADERS).forEach(([key, value]) => responseHeaders.set(key, value));

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers: responseHeaders
        });
    } catch (error: any) {
        return buildJsonResponse({
            error: 'WebDAV proxy failed',
            detail: error?.message || String(error)
        }, 502);
    }
}
