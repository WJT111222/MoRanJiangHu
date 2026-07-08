export type 游玩请求超时设置结构 = {
    首次响应超时秒: number;
    流式空闲超时秒: number;
};

export const 游玩请求超时下限秒 = 60;
export const 游玩请求超时上限秒 = 300;

export const 默认游玩请求超时设置: 游玩请求超时设置结构 = {
    首次响应超时秒: 120,
    流式空闲超时秒: 120
};

const 规范化秒数 = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(游玩请求超时下限秒, Math.min(游玩请求超时上限秒, Math.floor(parsed)));
};

export const 规范化游玩请求超时设置 = (raw?: Partial<游玩请求超时设置结构> | null): 游玩请求超时设置结构 => {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        首次响应超时秒: 规范化秒数(source.首次响应超时秒, 默认游玩请求超时设置.首次响应超时秒),
        流式空闲超时秒: 规范化秒数(source.流式空闲超时秒, 默认游玩请求超时设置.流式空闲超时秒)
    };
};

export const 游玩请求超时秒转毫秒 = (seconds: unknown, fallbackSeconds = 默认游玩请求超时设置.首次响应超时秒): number => (
    规范化秒数(seconds, fallbackSeconds) * 1000
);

export const 获取游玩请求超时毫秒 = (raw?: Partial<游玩请求超时设置结构> | null): { firstResponseMs: number; idleMs: number } => {
    const normalized = 规范化游玩请求超时设置(raw);
    return {
        firstResponseMs: normalized.首次响应超时秒 * 1000,
        idleMs: normalized.流式空闲超时秒 * 1000
    };
};
