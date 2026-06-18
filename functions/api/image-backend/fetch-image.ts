const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
};

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;

const textResponse = (message: string, status = 400): Response => (
    new Response(message, {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/plain; charset=utf-8'
        }
    })
);

const isPrivateHostname = (hostname: string): boolean => {
    const lower = hostname.toLowerCase();
    if (lower === 'localhost' || lower.endsWith('.localhost') || lower === '0.0.0.0') return true;
    if (/^127\./.test(lower) || /^10\./.test(lower) || /^192\.168\./.test(lower)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
    if (/^\[?::1\]?$/.test(lower) || /^fc[0-9a-f]{2}:/i.test(lower) || /^fd[0-9a-f]{2}:/i.test(lower)) return true;
    if (/^169\.254\./.test(lower)) return true;
    return false;
};

const isAllowedImageUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        if (!/^https?:$/i.test(url.protocol)) return false;
        if (!url.hostname || isPrivateHostname(url.hostname)) return false;
        return true;
    } catch {
        return false;
    }
};

const sniffImageContentType = (bytes: Uint8Array): string => {
    if (bytes.length >= 8
        && bytes[0] === 0x89
        && bytes[1] === 0x50
        && bytes[2] === 0x4e
        && bytes[3] === 0x47
        && bytes[4] === 0x0d
        && bytes[5] === 0x0a
        && bytes[6] === 0x1a
        && bytes[7] === 0x0a) {
        return 'image/png';
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg';
    }
    if (bytes.length >= 12
        && bytes[0] === 0x52
        && bytes[1] === 0x49
        && bytes[2] === 0x46
        && bytes[3] === 0x46
        && bytes[8] === 0x57
        && bytes[9] === 0x45
        && bytes[10] === 0x42
        && bytes[11] === 0x50) {
        return 'image/webp';
    }
    if (bytes.length >= 6) {
        const header = String.fromCharCode(...bytes.slice(0, 6));
        if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
    }
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
        return 'image/bmp';
    }
    return '';
};

export function onRequestOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestGet({ request }: any): Promise<Response> {
    try {
        const requestUrl = new URL(request.url);
        const targetUrl = (requestUrl.searchParams.get('url') || '').trim();
        if (!targetUrl || !isAllowedImageUrl(targetUrl)) {
            return textResponse('Invalid image URL', 400);
        }

        const upstream = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                Accept: 'image/*,application/octet-stream,*/*;q=0.8'
            }
        });
        if (!upstream.ok) {
            return textResponse(`Image fetch failed: ${upstream.status}`, upstream.status);
        }

        const length = Number(upstream.headers.get('Content-Length') || 0);
        if (Number.isFinite(length) && length > MAX_IMAGE_BYTES) {
            return textResponse('Image is too large', 413);
        }

        const bytes = await upstream.arrayBuffer();
        if (bytes.byteLength > MAX_IMAGE_BYTES) {
            return textResponse('Image is too large', 413);
        }

        const contentType = upstream.headers.get('Content-Type') || '';
        const sniffedContentType = sniffImageContentType(new Uint8Array(bytes));
        const outputContentType = /^image\//i.test(contentType) ? contentType : sniffedContentType;
        if (!outputContentType) {
            return textResponse(`Upstream response is not an image (${contentType || 'unknown'})`, 415);
        }

        return new Response(bytes, {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                'Content-Type': outputContentType,
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error: any) {
        return textResponse(error?.message || 'Image fetch proxy failed', 502);
    }
}

