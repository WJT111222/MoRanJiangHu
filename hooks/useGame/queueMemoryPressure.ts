export type 后台队列内存压力等级 = 'normal' | 'high';
export type 后台队列执行模式 = 'parallel' | 'serial';

export type 后台队列运行时内存指标 = {
    usedJSHeapSize?: number;
    jsHeapSizeLimit?: number;
    deviceMemoryGB?: number;
};

export type 后台队列负载指标 = {
    historyChars: number;
    socialCount: number;
    mapNodeCount: number;
    commandCount: number;
    responseChars: number;
};

export type 后台队列内存压力评估 = {
    level: 后台队列内存压力等级;
    reasons: string[];
    heapRatio?: number;
    score: number;
};

const JS堆高压力比例 = 0.7;
const 低内存设备GB = 4;
const 中等负载分数 = 4;
const 高负载分数 = 20;
const 地图节点统计上限 = 5_000;

const 读取有限正数 = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const 读取后台队列运行时内存指标 = (): 后台队列运行时内存指标 => {
    const performanceMemory = typeof performance !== 'undefined'
        ? (performance as Performance & { memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory
        : undefined;
    const deviceMemory = typeof navigator !== 'undefined'
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
        : undefined;
    return {
        usedJSHeapSize: 读取有限正数(performanceMemory?.usedJSHeapSize),
        jsHeapSizeLimit: 读取有限正数(performanceMemory?.jsHeapSizeLimit),
        deviceMemoryGB: 读取有限正数(deviceMemory)
    };
};

const 统计日志字符 = (logs: unknown): number => (
    Array.isArray(logs)
        ? logs.reduce((total, item) => total + (typeof item?.text === 'string' ? item.text.length : 0), 0)
        : 0
);

const 统计历史字符 = (history: unknown[]): number => history.reduce((total, item: any) => {
    const contentChars = typeof item?.content === 'string' ? item.content.length : 0;
    const structuredChars = 统计日志字符(item?.structuredResponse?.logs);
    return total + contentChars + structuredChars;
}, 0);

const 统计地图节点 = (world: any): number => {
    const roots = world?.地图层级;
    if (!Array.isArray(roots)) return 0;
    const queue: unknown[] = [...roots];
    const visited = new Set<object>();
    let count = 0;
    while (queue.length > 0 && count < 地图节点统计上限) {
        const current = queue.shift();
        if (!current || typeof current !== 'object' || visited.has(current as object)) continue;
        visited.add(current as object);
        count += 1;
        Object.values(current as Record<string, unknown>).forEach((value) => {
            if (Array.isArray(value)) queue.push(...value);
        });
    }
    return count;
};

export const 构建后台队列负载指标 = (params: {
    history: unknown[];
    social: unknown[];
    world: unknown;
    response: any;
}): 后台队列负载指标 => ({
    historyChars: 统计历史字符(Array.isArray(params.history) ? params.history : []),
    socialCount: Array.isArray(params.social) ? params.social.length : 0,
    mapNodeCount: 统计地图节点(params.world),
    commandCount: Array.isArray(params.response?.tavern_commands) ? params.response.tavern_commands.length : 0,
    responseChars: 统计日志字符(params.response?.logs)
});

const 计算负载分数 = (workload: 后台队列负载指标): number => (
    Math.min(6, workload.historyChars / 50_000)
    + Math.min(5, workload.socialCount / 30)
    + Math.min(6, workload.mapNodeCount / 150)
    + Math.min(5, workload.commandCount / 40)
    + Math.min(5, workload.responseChars / 10_000)
);

export const 评估后台队列内存压力 = (params: {
    runtime: 后台队列运行时内存指标;
    workload: 后台队列负载指标;
}): 后台队列内存压力评估 => {
    const usedHeap = 读取有限正数(params.runtime.usedJSHeapSize);
    const heapLimit = 读取有限正数(params.runtime.jsHeapSizeLimit);
    const heapRatio = usedHeap && heapLimit ? usedHeap / heapLimit : undefined;
    const score = 计算负载分数(params.workload);
    const reasons: string[] = [];

    if (heapRatio !== undefined && heapRatio >= JS堆高压力比例) {
        reasons.push('js_heap_ratio');
    }
    if (score >= 高负载分数) {
        reasons.push('large_turn_workload');
    }
    if (
        params.runtime.deviceMemoryGB !== undefined
        && params.runtime.deviceMemoryGB <= 低内存设备GB
        && score >= 中等负载分数
    ) {
        reasons.push('low_memory_device_with_medium_load');
    }

    return {
        level: reasons.length > 0 ? 'high' : 'normal',
        reasons,
        heapRatio,
        score
    };
};

export const 选择后台队列执行模式 = (params: {
    channelsAllowParallel: boolean;
    pressureLevel: 后台队列内存压力等级;
}): 后台队列执行模式 => (
    params.channelsAllowParallel && params.pressureLevel === 'normal' ? 'parallel' : 'serial'
);
