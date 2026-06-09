import { afterEach, describe, expect, it, vi } from 'vitest';
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

const buildHeartbeatRequest = (body: Record<string, unknown>) => (
    new Request('https://example.com/api/admin/online', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'vitest'
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
});
