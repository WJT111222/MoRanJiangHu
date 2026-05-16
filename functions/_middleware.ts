const STATIC_ASSET_PATTERN = /^\/(?:assets|ui|styles)\/.+\.(?:js|mjs|css|json|map|png|jpg|jpeg|webp|gif|svg|ico|wasm|woff2?|ttf|otf)$/i;

export const onRequest = async (context: { request: Request; next: () => Promise<Response> }): Promise<Response> => {
    const response = await context.next();
    const url = new URL(context.request.url);

    if (!STATIC_ASSET_PATTERN.test(url.pathname)) {
        return response;
    }

    const contentType = response.headers.get('content-type') || '';
    if (response.status === 200 && contentType.toLowerCase().includes('text/html')) {
        return new Response('Static asset not found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'no-store'
            }
        });
    }

    return response;
};
