const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
};

const JSON_HEADERS = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json'
};

const readString = (value: unknown): string => (
    typeof value === 'string' ? value.trim() : ''
);

const PROVIDER_TARGET_MAPPING: Record<string, string> = {
    'openai-official': 'https://api.openai.com'
};

const normalizePath = (pathRaw: unknown): string => {
    const pathParam = Array.isArray(pathRaw) ? pathRaw.join('/') : readString(pathRaw || '');
    const path = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
    if (/^\/(?:v1\/)?images\/(?:generations|edits)$/i.test(path)) return path;
    if (/^\/(?:v1\/)?tasks\/[^/?#]+$/i.test(path)) return path;
    return '';
};

const buildTargetUrl = (targetBaseRaw: string, path: string): string => {
    const targetBase = new URL(targetBaseRaw.replace(/\/+$/, ''));
    const basePath = targetBase.pathname.replace(/\/+$/, '');
    const normalizedPath = (() => {
        if (basePath.endsWith('/v1') && path.startsWith('/v1/')) return path.replace(/^\/v1/i, '');
        if (path.startsWith('/v1/')) return path;
        return `${basePath.endsWith('/v1') ? '' : '/v1'}${path}`;
    })();
    targetBase.pathname = `${basePath}${normalizedPath}`;
    targetBase.search = '';
    targetBase.hash = '';
    return targetBase.toString();
};

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: JSON_HEADERS
    })
);

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequest({ request, params }: any): Promise<Response> {
    const method = request.method.toUpperCase();
    if (method === 'OPTIONS') return onRequestOptions();
    if (method !== 'POST' && method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    const requestUrl = new URL(request.url);
    const providerID = readString(requestUrl.searchParams.get('provider'));
    const targetBase = PROVIDER_TARGET_MAPPING[providerID];

    if (!targetBase) {
        return jsonResponse({
            error: 'Invalid or unsupported provider.',
            message: '不支持的供应商ID。只有预定义供应商可以使用代理。'
        }, 400);
    }

    const path = normalizePath(params?.path);
    if (!path) {
        return jsonResponse({
            error: 'Invalid path.',
            message: '无效的接口路径。'
        }, 400);
    }

    const authorization = request.headers.get('authorization');
    if (!authorization) {
        return jsonResponse({ error: 'Missing Authorization header.' }, 401);
    }

    const headers = new Headers();
    headers.set('Authorization', authorization);
    headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
    headers.set('Accept', request.headers.get('accept') || 'application/json');

    const targetUrl = buildTargetUrl(targetBase, path);
    const response = await fetch(targetUrl, {
        method,
        headers,
        body: method === 'GET' ? undefined : request.body
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    ['content-type', 'cache-control'].forEach((key) => {
        const value = response.headers.get(key);
        if (value) responseHeaders.set(key, value);
    });
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
    });
}
