import { describe, expect, it, vi } from 'vitest';
import { onRequestGet, onRequestPost } from '../functions/api/image-backend/cnb-sync';
import { onRequest as onComfyProxyRequest } from '../functions/api/image-backend/comfyui-proxy/[[path]]';

const createMemoryR2Bucket = () => {
    const storage = new Map<string, string>();
    return {
        async get(key: string) {
            const value = storage.get(key);
            if (!value) return null;
            return {
                async json() {
                    return JSON.parse(value);
                }
            };
        },
        async put(key: string, value: string) {
            storage.set(key, value);
        }
    };
};

describe('Cloud Studio image backend registry', () => {
    it('accepts Cloud Studio preview URLs and exposes provider metadata without secrets', async () => {
        const env = {
            CNB_SYNC_TOKEN: 'sync-token',
            CNB_SYNC_R2: createMemoryR2Bucket(),
            CNB_SYNC_REGISTRY_TTL_SEC: '900'
        };

        const postResponse = await onRequestPost({
            request: new Request('https://msjh.example/api/image-backend/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer sync-token'
                },
                body: JSON.stringify({
                    customerId: 'cloudstudio-user',
                    backendType: 'comfyui',
                    provider: 'cloudstudio',
                    source: 'cloudstudio',
                    port: 8188,
                    url: 'https://e0afc88e07c84c1bb0a21081e3274fc7--8188.ap-shanghai2.cloudstudio.club',
                    healthUrl: 'https://e0afc88e07c84c1bb0a21081e3274fc7--8188.ap-shanghai2.cloudstudio.club/system_stats',
                    workspace: 'msjh-cloudstudio',
                    detectedFrom: 'CLOUDSTUDIO_IMAGE_BACKEND_URL',
                    connectToken: 'private-connect-token'
                })
            }),
            env
        });

        expect(postResponse.status).toBe(200);
        const postPayload = await postResponse.json() as any;
        expect(postPayload.ok).toBe(true);
        expect(postPayload.payload.provider).toBe('cloudstudio');
        expect(postPayload.payload.source).toBe('registry');
        expect(postPayload.payload.connectTokenHash).toBeUndefined();

        const getResponse = await onRequestGet({
            request: new Request('https://msjh.example/api/image-backend/sync?backendType=comfyui&connectToken=private-connect-token'),
            env
        });

        expect(getResponse.status).toBe(200);
        const getPayload = await getResponse.json() as any;
        expect(getPayload.items).toHaveLength(1);
        expect(getPayload.items[0]).toMatchObject({
            provider: 'cloudstudio',
            url: 'https://e0afc88e07c84c1bb0a21081e3274fc7--8188.ap-shanghai2.cloudstudio.club',
            workspace: 'msjh-cloudstudio',
            connectTokenProtected: true,
            connectTokenMatched: true
        });
        expect(getPayload.items[0].connectTokenHash).toBeUndefined();
    });
});

describe('Cloud Studio ComfyUI runtime proxy', () => {
    it('allows Cloud Studio preview URLs through the ComfyUI proxy', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ system: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const response = await onComfyProxyRequest({
            request: new Request('https://msjh.example/api/image-backend/comfyui-proxy/system_stats?url=https%3A%2F%2Fe0afc88e07c84c1bb0a21081e3274fc7--8188.ap-shanghai2.cloudstudio.club'),
            params: { path: ['system_stats'] },
            env: {}
        });

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://e0afc88e07c84c1bb0a21081e3274fc7--8188.ap-shanghai2.cloudstudio.club/system_stats');
    });
});
