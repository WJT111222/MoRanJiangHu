// Durable Object for online session registry.
// Holds all sessions in memory; flushes to state.storage every 60 s.
// Eliminates per-heartbeat R2 PUT (the root cause of Class A overages).

const SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 500;
const FLUSH_INTERVAL_MS = 60_000;

export class OnlineSessionsDO {
    private state: any;
    private env: any;
    private sessions: any[] | null = null;
    private lastFlushMs = 0;
    private initialized = false;

    constructor(state: any, env: any) {
        this.state = state;
        this.env = env;
    }

    // ---------- initialisation (runs once per DO activation) ----------

    private async ensureInitialized(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;

        // 1. Try durable storage first (survives DO eviction/restart).
        const stored: any[] | undefined = await this.state.storage.get('sessions');
        if (Array.isArray(stored) && stored.length > 0) {
            this.sessions = stored;
            return;
        }

        // 2. First-time migration: pull existing R2 registry.
        try {
            const bucket = this.env?.CNB_SYNC_R2;
            const key = this.buildRegistryKey();
            if (bucket && key) {
                const obj = await bucket.get(key);
                if (obj) {
                    const parsed: any = await obj.json().catch(() => null);
                    if (Array.isArray(parsed?.sessions)) {
                        this.sessions = parsed.sessions;
                        // Don't delete R2 object yet – keep as backup.
                    }
                }
            }
        } catch {
            // R2 read failure is non-fatal.
        }

        if (!this.sessions) this.sessions = [];
    }

    // ---------- fetch handler (called via DO stub) ----------

    async fetch(request: Request): Promise<Response> {
        await this.ensureInitialized();

        const url = new URL(request.url);

        if (request.method === 'POST' && url.pathname === '/heartbeat') {
            return this.handleHeartbeat(request);
        }

        if (request.method === 'GET' && url.pathname === '/registry') {
            return this.handleGetRegistry();
        }

        if (request.method === 'GET' && url.pathname === '/stats') {
            return this.handleGetStats(request);
        }

        return new Response('Not Found', { status: 404 });
    }

    // ---------- heartbeat ----------

    private async handleHeartbeat(request: Request): Promise<Response> {
        const now = Date.now();
        const nowIso = new Date(now).toISOString();

        // Rate-limit: require at least 20 s between accepted heartbeats per session.
        const body: any = await request.json().catch(() => ({}));
        const sessionId = sanitizeSessionId(body?.sessionId);
        if (!sessionId) {
            return jsonResponse({ success: false, error: 'Missing sessionId' }, 400);
        }

        const existing = this.sessions!.find((s: any) => s.id === sessionId);
        const existingLastSeenMs = existing ? Date.parse(existing.lastSeenAt || '') : 0;

        // TTL for this DO instance – 2 min, matching the client-side SESSION_TTL_MS.
        const ttlMs = Math.max(30, Number(this.env?.ONLINE_SESSION_TTL_SECONDS) || 120) * 1000;
        const expired = existing ? isSessionExpired(existing.lastSeenAt, now, ttlMs) : false;

        // Non-WebSocket: 20 s minimum interval.
        const isWs = String(body?.transport || '') === 'websocket'
            || body?.type === 'hello' || body?.type === 'ping';
        if (!isWs && existing && Number.isFinite(existingLastSeenMs)
            && now - existingLastSeenMs < 20_000) {
            return jsonResponse({
                success: true, sessionId, serverTime: nowIso,
                accepted: false,
                nextHeartbeatSeconds: Math.ceil((20_000 - (now - existingLastSeenMs)) / 1000)
            });
        }

        const cf: any = (request as any).cf || {};
        const record: any = {
            id: sessionId,
            firstSeenAt: !expired && existing?.firstSeenAt ? existing.firstSeenAt : nowIso,
            lastSeenAt: nowIso,
            userId: sanitizeUserField(body?.userId) || existing?.userId || '',
            username: sanitizeUserField(body?.username) || existing?.username || '',
            ip: getClientIp(request),
            country: readStr(cf.country),
            region: readStr(cf.region) || readStr(cf.regionCode),
            city: readStr(cf.city),
            timezone: readStr(cf.timezone),
            colo: readStr(cf.colo),
            userAgent: readStr(request.headers.get('User-Agent')).slice(0, 240),
            path: readStr(body?.path).slice(0, 240),
            referrer: readStr(body?.referrer).slice(0, 240),
            versionName: readStr(body?.versionName).slice(0, 40),
            versionCode: toPosInt(body?.versionCode, existing?.versionCode || 0) || undefined,
            platform: readStr(body?.platform).slice(0, 80),
            imageStats: sanitizeImageStats(body?.imageStats, existing?.imageStats),
            heartbeatCount: expired ? 1 : (existing?.heartbeatCount || 0) + 1
        };

        const idx = this.sessions!.findIndex((s: any) => s.id === sessionId);
        if (idx >= 0) {
            this.sessions![idx] = record;
        } else {
            this.sessions!.unshift(record);
        }

        // Cleanup: drop expired, cap at MAX_SESSIONS.
        this.sessions = this.sessions!
            .filter((s: any) => {
                const ms = Date.parse(s.lastSeenAt || s.firstSeenAt || '');
                return Number.isFinite(ms) && now - ms <= SESSION_RETENTION_MS;
            })
            .sort((a: any, b: any) => Date.parse(b.lastSeenAt || '') - Date.parse(a.lastSeenAt || ''))
            .slice(0, MAX_SESSIONS);

        // Flush to durable storage if interval elapsed.
        if (now - this.lastFlushMs >= FLUSH_INTERVAL_MS) {
            await this.state.storage.put('sessions', this.sessions);
            this.lastFlushMs = now;
        }

        return jsonResponse({
            success: true, sessionId, serverTime: nowIso,
            accepted: true, nextHeartbeatSeconds: 30
        });
    }

    // ---------- read-only queries ----------

    private handleGetRegistry(): Response {
        return jsonResponse({ sessions: this.sessions });
    }

    private handleGetStats(request: Request): Response {
        const url = new URL(request.url);
        const nowMs = Date.now();
        const ttlMs = Math.max(30, Number(this.env?.ONLINE_SESSION_TTL_SECONDS) || 120) * 1000;
        const sessions = this.sessions!;

        const onlineSessions = sessions.filter((s: any) => {
            const ms = Date.parse(s.lastSeenAt || '');
            return Number.isFinite(ms) && nowMs - ms <= ttlMs;
        });

        return jsonResponse({
            sessions,
            onlineCount: onlineSessions.length,
            ttlMs
        });
    }

    // ---------- helpers ----------

    private buildRegistryKey(): string {
        const prefix = readStr(this.env?.ONLINE_SESSIONS_R2_PREFIX || 'moranjianghu/online')
            .replace(/^\/+|\/+$/g, '') || 'moranjianghu/online';
        return `${prefix}/sessions.json`;
    }
}

// ---------- shared small helpers (kept local to avoid circular deps) ----------

function readStr(v: unknown): string { return typeof v === 'string' ? v.trim() : ''; }

function toPosInt(v: unknown, fallback: number): number {
    const n = Math.floor(Number(v));
    return n > 0 ? n : fallback;
}

function toNonNegInt(v: unknown, fallback = 0): number {
    const n = Math.floor(Number(v));
    return n >= 0 ? n : fallback;
}

function sanitizeSessionId(v: unknown): string {
    return readStr(v).replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 96);
}

function sanitizeUserField(v: unknown): string {
    return readStr(v).replace(/[^\w.@\-]/g, '').slice(0, 120);
}

function isSessionExpired(lastSeenAt: string | undefined, nowMs: number, ttlMs: number): boolean {
    const ms = Date.parse(lastSeenAt || '');
    return !Number.isFinite(ms) || nowMs - ms > ttlMs;
}

function getClientIp(request: Request): string {
    const direct = readStr((request as any).headers?.get?.('CF-Connecting-IP'));
    if (direct) return direct;
    const fwd = readStr((request as any).headers?.get?.('X-Forwarded-For'));
    return fwd.split(',')[0]?.trim() || readStr((request as any).headers?.get?.('X-Real-IP'));
}

function sanitizeImageStats(v: unknown, fallback?: any): any {
    if (!v || typeof v !== 'object') return fallback;
    const s = v as any;
    const mig = sanitizeMigrationStatus(s.migrationStatus);
    return {
        totalAssets: toNonNegInt(s.totalAssets, fallback?.totalAssets || 0),
        referencedAssets: toNonNegInt(s.referencedAssets, fallback?.referencedAssets || 0),
        localImageAssets: toNonNegInt(s.localImageAssets, fallback?.localImageAssets || 0),
        localImageBytes: toNonNegInt(s.localImageBytes, fallback?.localImageBytes || 0),
        remoteImageAssets: toNonNegInt(s.remoteImageAssets, fallback?.remoteImageAssets || 0),
        migrationStatus: mig || fallback?.migrationStatus
    };
}

function sanitizeMigrationStatus(v: unknown): any {
    if (!v || typeof v !== 'object') return undefined;
    const s = v as any;
    return {
        stage: readStr(s.stage).slice(0, 40),
        totalAssets: toNonNegInt(s.totalAssets),
        processedAssets: toNonNegInt(s.processedAssets),
        migratedAssets: toNonNegInt(s.migratedAssets),
        failedAssets: toNonNegInt(s.failedAssets),
        retryLater: Boolean(s.retryLater),
        updatedAt: readStr(s.updatedAt).slice(0, 40),
        completedAt: readStr(s.completedAt).slice(0, 40),
        lastMessage: readStr(s.lastMessage).slice(0, 120),
        lastError: readStr(s.lastError).slice(0, 120)
    };
}

function jsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}
