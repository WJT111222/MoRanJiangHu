export const 六维属性键列表 = ['力量', '敏捷', '体质', '根骨', '悟性', '福源'] as const;

export type 六维属性键 = typeof 六维属性键列表[number];
export type 六维属性分配 = Record<六维属性键, number>;

const 正常难度初始总点数 = 30;
const 单项最低值 = 3;

const 读取有限数 = (value: unknown): number | undefined => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

export const 计算六维总点数预算 = (境界层级: unknown, 起始总点数 = 正常难度初始总点数): number => {
    const rank = Math.max(1, Math.ceil(读取有限数(境界层级) ?? 1));
    return Math.max(六维属性键列表.length * 单项最低值, Math.ceil(起始总点数) + Math.max(0, rank - 1));
};

export const 归一化六维到境界预算 = (
    source: Record<string, unknown> | null | undefined,
    options?: {
        境界层级?: unknown;
        起始总点数?: number;
        偏向权重?: Partial<Record<六维属性键, number>>;
    }
): 六维属性分配 => {
    const targetTotal = 计算六维总点数预算(options?.境界层级, options?.起始总点数);
    const minTotal = 六维属性键列表.length * 单项最低值;
    const extraTotal = Math.max(0, targetTotal - minTotal);
    const rawValues = 六维属性键列表.map((key) => Math.max(0, 读取有限数(source?.[key]) ?? 0));
    const hasRawSignal = rawValues.some((value) => value > 0);
    const weights = 六维属性键列表.map((key, index) => {
        if (hasRawSignal) return Math.max(0, rawValues[index] - 单项最低值);
        return Math.max(1, 1 + Math.max(0, options?.偏向权重?.[key] ?? 0));
    });
    const weightTotal = weights.reduce((sum, value) => sum + value, 0) || 六维属性键列表.length;
    const exactExtras = weights.map((weight) => (weight / weightTotal) * extraTotal);
    const extras = exactExtras.map(Math.floor);
    let remaining = extraTotal - extras.reduce((sum, value) => sum + value, 0);
    const order = exactExtras
        .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
        .sort((a, b) => (b.fraction - a.fraction) || (a.index - b.index));
    for (let i = 0; i < order.length && remaining > 0; i += 1) {
        extras[order[i].index] += 1;
        remaining -= 1;
    }
    return 六维属性键列表.reduce((result, key, index) => {
        result[key] = 单项最低值 + extras[index];
        return result;
    }, {} as 六维属性分配);
};
