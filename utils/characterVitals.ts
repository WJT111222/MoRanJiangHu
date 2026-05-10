import type { 角色数据结构 } from '../types';

type 部位键 = '头部' | '胸部' | '腹部' | '左手' | '右手' | '左腿' | '右腿';

const 气血权重: Record<部位键, number> = {
    头部: 2.4,
    胸部: 2,
    腹部: 1.5,
    左手: 0.65,
    右手: 0.65,
    左腿: 0.9,
    右腿: 0.9
};

const 读数 = (value: unknown): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

export const 计算角色总气血 = (角色?: Partial<角色数据结构> | null): { 当前: number; 最大: number; 百分比: number; 已死亡: boolean } => {
    const parts: 部位键[] = ['头部', '胸部', '腹部', '左手', '右手', '左腿', '右腿'];
    const total = parts.reduce((acc, part) => {
        const weight = 气血权重[part];
        return {
            当前: acc.当前 + Math.max(0, 读数((角色 as any)?.[`${part}当前血量`])) * weight,
            最大: acc.最大 + Math.max(0, 读数((角色 as any)?.[`${part}最大血量`])) * weight
        };
    }, { 当前: 0, 最大: 0 });
    const 当前 = Math.round(total.当前);
    const 最大 = Math.max(1, Math.round(total.最大));
    return {
        当前,
        最大,
        百分比: Math.max(0, Math.min(100, 当前 / 最大 * 100)),
        已死亡: 当前 <= 0
    };
};

export const 格式化月日 = (value?: string | number | null): string => {
    const text = String(value ?? '').trim();
    if (!text) return '';
    const monthDay = text.match(/(?:^|[^\d])(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (monthDay) return `${Number(monthDay[1])}月${Number(monthDay[2])}日`;
    const colon = text.match(/(?:^|[^\d])(\d{1,4})[:：\/\-年](\d{1,2})[:：\/\-月](\d{1,2})(?:日)?/);
    if (colon) return `${Number(colon[2])}月${Number(colon[3])}日`;
    const md = text.match(/^(\d{1,2})[:：\/\-](\d{1,2})$/);
    if (md) return `${Number(md[1])}月${Number(md[2])}日`;
    return text.replace(/\s+/g, '');
};
