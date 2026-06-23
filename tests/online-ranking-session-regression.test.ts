import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnlineSessionsDO } from '../functions/api/admin/OnlineSessionsDO';
import { __onlineTestUtils, onRequestGet, onRequestPost } from '../functions/api/admin/online';

class MemoryR2Bucket {
    private store = new Map<string, string>();

    async get(key: string) {
        const value = this.store.get(key);
        if (typeof value !== 'string') return null;
        return {
            async json() {
                return JSON.parse(value);
            }
        };
    }

    async put(key: string, value: string) {
        this.store.set(key, value);
    }

    readJson(keyFragment: string) {
        const match = Array.from(this.store.entries()).find(([key]) => key.includes(keyFragment));
        return match ? JSON.parse(match[1]) : null;
    }
}

class MemoryDurableObjectStorage {
    private store = new Map<string, unknown>();

    async get(key: string) {
        return this.store.get(key);
    }

    async put(key: string, value: unknown) {
        this.store.set(key, value);
    }
}

const buildEnv = () => {
    const bucket = new MemoryR2Bucket();
    return {
        env: {
            CNB_SYNC_R2: bucket,
            ONLINE_SESSION_TTL_SECONDS: '120'
        },
        bucket
    };
};

const buildDoEnv = () => {
    const bucket = new MemoryR2Bucket();
    const env: any = {
        CNB_SYNC_R2: bucket,
        ONLINE_SESSION_TTL_SECONDS: '120',
        ONLINE_ADMIN_PASSWORD: 'secret'
    };
    const durableObject = new OnlineSessionsDO({
        storage: new MemoryDurableObjectStorage()
    }, env);
    env.ONLINE_SESSIONS_DO = {
        idFromName: () => 'sessions',
        get: () => ({
            fetch: (request: Request) => durableObject.fetch(request)
        })
    };
    return { env, bucket };
};

const buildHeartbeatRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}) => (
    new Request('https://example.com/api/admin/online', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'vitest',
            ...headers
        },
        body: JSON.stringify(body)
    })
);

const readJson = async (response: Response) => response.json();

describe('在线时长榜会话回归', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('未超 TTL 的会话不会被误判过期', () => {
        const nowMs = Date.parse('2026-06-10T01:00:00.000Z');
        expect(__onlineTestUtils.isSessionExpired('2026-06-10T00:58:30.000Z', nowMs, 120_000)).toBe(false);
    });

    it('同一 sessionId 超过 TTL 后重新心跳会重置 firstSeenAt', async () => {
        vi.useFakeTimers();
        const { env, bucket } = buildEnv();

        vi.setSystemTime(new Date('2026-06-10T01:00:00.000Z'));
        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_reused_session',
                userId: 'u_bacon',
                username: 'bacon',
                platform: 'web'
            }),
            env
        });

        let registry = bucket.readJson('sessions.json');
        expect(registry?.sessions?.[0]?.firstSeenAt).toBe('2026-06-10T01:00:00.000Z');
        expect(registry?.sessions?.[0]?.heartbeatCount).toBe(1);

        vi.setSystemTime(new Date('2026-06-10T01:01:00.000Z'));
        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_reused_session',
                userId: 'u_bacon',
                username: 'bacon',
                platform: 'web'
            }),
            env
        });

        registry = bucket.readJson('sessions.json');
        expect(registry?.sessions?.[0]?.firstSeenAt).toBe('2026-06-10T01:00:00.000Z');
        expect(registry?.sessions?.[0]?.heartbeatCount).toBe(2);

        vi.setSystemTime(new Date('2026-06-10T01:03:10.000Z'));
        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_reused_session',
                userId: 'u_bacon',
                username: 'bacon',
                platform: 'web'
            }),
            env
        });

        registry = bucket.readJson('sessions.json');
        expect(registry?.sessions?.[0]?.firstSeenAt).toBe('2026-06-10T01:03:10.000Z');
        expect(registry?.sessions?.[0]?.heartbeatCount).toBe(1);
    });

    it('断线重连后公开排行榜不会把刚上线玩家铺满成 24 小时', async () => {
        vi.useFakeTimers();
        const { env } = buildEnv();

        vi.setSystemTime(new Date('2026-06-09T02:00:00.000Z'));
        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_reused_session',
                userId: 'u_jokeplayer',
                username: 'jokeplayer',
                platform: 'web'
            }),
            env
        });

        vi.setSystemTime(new Date('2026-06-10T01:59:00.000Z'));
        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_reused_session',
                userId: 'u_jokeplayer',
                username: 'jokeplayer',
                platform: 'web'
            }),
            env
        });

        vi.setSystemTime(new Date('2026-06-10T01:59:45.000Z'));
        const response = await onRequestGet({
            request: new Request('https://example.com/api/admin/online?public=1'),
            env
        });
        const payload = await readJson(response);
        const player = payload.loggedInPlayers24h.find((item: any) => item.userId === 'u_jokeplayer');

        expect(player).toBeTruthy();
        expect(player.totalOnlineSeconds24h).toBeLessThan(120);
        expect(player.totalOnlineSeconds24h).toBeGreaterThanOrEqual(45);
        expect(player.timelineSegments).toHaveLength(1);
        expect(player.timelineSegments[0].startAt).toBe('2026-06-10T01:59:00.000Z');
    });

    it('counts separate Durable Object sessions and preserves client metadata', async () => {
        vi.useFakeTimers();
        const { env } = buildDoEnv();
        vi.setSystemTime(new Date('2026-06-10T01:00:00.000Z'));

        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_do_session_a',
                platform: 'web'
            }, {
                'CF-Connecting-IP': '203.0.113.10',
                'User-Agent': 'vitest-a'
            }),
            env
        });
        await onRequestPost({
            request: buildHeartbeatRequest({
                sessionId: 'web_do_session_b',
                platform: 'web'
            }, {
                'CF-Connecting-IP': '203.0.113.11',
                'User-Agent': 'vitest-b'
            }),
            env
        });

        const publicResponse = await onRequestGet({
            request: new Request('https://example.com/api/admin/online?public=1'),
            env
        });
        const publicPayload = await readJson(publicResponse);
        expect(publicPayload.onlineCount).toBe(2);
        expect(publicPayload.onlineSessionCount).toBe(2);

        const adminResponse = await onRequestGet({
            request: new Request('https://example.com/api/admin/online', {
                headers: {
                    Authorization: 'Bearer secret'
                }
            }),
            env
        });
        const adminPayload = await readJson(adminResponse);
        expect(adminPayload.recentUsers.map((item: any) => item.ip).sort()).toEqual([
            '203.0.113.10',
            '203.0.113.11'
        ]);
        expect(adminPayload.recentUsers.flatMap((item: any) => item.userAgents).sort()).toEqual([
            'vitest-a',
            'vitest-b'
        ]);
    });
});
