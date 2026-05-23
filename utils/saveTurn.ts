import type { 存档结构, 聊天记录结构 } from '../types';

export const 是游玩回合消息 = (item: Partial<聊天记录结构> | null | undefined): boolean => (
    item?.role === 'assistant'
    && !!(item as any)?.structuredResponse
);

export const 计算历史游玩回合数 = (history: Array<Partial<聊天记录结构>> | undefined | null): number => (
    Math.max(0, (Array.isArray(history) ? history : []).filter(是游玩回合消息).length - 1)
);

export const 读取存档游玩回合数 = (save: Partial<存档结构> | null | undefined): number => {
    const history = save?.历史记录 as Array<Partial<聊天记录结构>> | undefined;
    if (Array.isArray(history) && history.some(是游玩回合消息)) {
        return 计算历史游玩回合数(history);
    }
    const explicit = Number((save?.元数据 as any)?.游戏回合数);
    if (Number.isFinite(explicit) && explicit >= 0) return Math.floor(explicit);
    return 0;
};
