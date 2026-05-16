const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

const buildTextResponse = (message: string, status = 400): Response => (
    new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...CORS_HEADERS
        }
    })
);

const isAllowedImageHostUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return /^https?:$/i.test(url.protocol)
            && /(^|\.)image\.bacon159\.pp\.ua$/i.test(url.hostname)
            && (/^\/file\//i.test(url.pathname) || /^\/api\/v1\/file\//i.test(url.pathname) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(url.pathname));
    } catch {
        return false;
    }
};

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestGet({ request }: any): Promise<Response> {
    try {
        const url = new URL(request.url);
        const targetUrl = (url.searchParams.get('url') || '').trim();
        if (!targetUrl || !isAllowedImageHostUrl(targetUrl)) {
            return buildTextResponse('Invalid image host URL', 400);
        }

        const upstream = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                Accept: 'image/*,*/*;q=0.8'
            }
        });
        if (!upstream.ok) {
            return buildTextResponse(`Image download failed: ${upstream.status}`, upstream.status);
        }
        const contentType = upstream.headers.get('Content-Type') || '';
        if (!/^image\//i.test(contentType)) {
            return buildTextResponse('Upstream response is not an image', 415);
        }
        const length = Number(upstream.headers.get('Content-Length') || 0);
        if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) {
            return buildTextResponse('Image is too large', 413);
        }
        const bytes = await upstream.arrayBuffer();
        if (bytes.byteLength > MAX_IMAGE_BYTES) {
            return buildTextResponse('Image is too large', 413);
        }

        return new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': contentType || 'image/png',
                'Cache-Control': 'no-store',
                ...CORS_HEADERS
            }
        });
    } catch (error: any) {
        return buildTextResponse(error?.message || 'Image download proxy failed', 502);
    }
}
