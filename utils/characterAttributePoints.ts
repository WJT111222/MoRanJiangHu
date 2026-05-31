import type { 角色数据结构 } from '../types';

export const 可分配六维属性列表 = ['力量', '敏捷', '体质', '根骨', '悟性', '福源'] as const;

export type 可分配六维属性键 = typeof 可分配六维属性列表[number];

const 读整数 = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.floor(numeric) : fallback;
};

export const 读取可分配属性点 = (character: Partial<角色数据结构> | null | undefined): number => (
    Math.max(0, 读整数((character as any)?.可分配属性点))
);

export const 分配角色属性点 = (
    character: 角色数据结构,
    key: 可分配六维属性键
): 角色数据结构 => {
    const available = 读取可分配属性点(character);
    if (available <= 0 || !可分配六维属性列表.includes(key)) {
        return character;
    }

    return {
        ...character,
        [key]: Math.max(0, 读整数((character as any)[key])) + 1,
        可分配属性点: available - 1
    } as 角色数据结构;
};
