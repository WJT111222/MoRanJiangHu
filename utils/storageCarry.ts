type 储物扩容类型 = '储物袋' | '储物戒指';

export type 储物负重加成信息 = {
    储物袋: number;
    储物戒指: number;
    总计: number;
};

const 取文本 = (value: unknown, fallback = ''): string => (
    typeof value === 'string' ? value.trim() : fallback
);

const 取非负数 = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, parsed);
};

const 取整数 = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.trunc(parsed);
};

const 四舍五入一位 = (value: number): number => Math.round(value * 10) / 10;

export const 储物扩容名称正则 = /储物袋|乾坤袋|须弥袋|百宝囊|行囊|纳戒|纳物戒|储物戒|储物戒指|乾坤戒|储物指环|储物镯|储物手镯/;

const 储物袋名称正则 = /储物袋|乾坤袋|须弥袋|百宝囊|行囊/;
const 储物戒指名称正则 = /纳戒|纳物戒|储物戒|储物戒指|乾坤戒|储物指环|储物镯|储物手镯/;

const 解析文字容量 = (text: string): number => {
    const matched = text.match(/(?:可容纳|可盛放|容量|可装下|可收纳|负重上限|最大负重)\s*(?:\+|增加|提高)?\s*(\d+(?:\.\d+)?)\s*斤?/);
    return matched ? 取非负数(matched[1], 0) : 0;
};

const 从词条读取负重加成 = (item: any): number => {
    if (!Array.isArray(item?.词条列表)) return 0;
    return item.词条列表.reduce((max: number, entry: any) => {
        const attr = 取文本(entry?.属性);
        if (!/最大负重|负重上限|承重|收纳/.test(attr)) return max;
        return Math.max(max, 取非负数(entry?.数值, 0));
    }, 0);
};

export const 获取储物扩容类型 = (item: any): 储物扩容类型 | null => {
    const text = `${取文本(item?.名称)} ${取文本(item?.描述)} ${取文本(item?.视觉描述)} ${取文本(item?.容器属性?.容器类型)}`;
    if (储物戒指名称正则.test(text)) return '储物戒指';
    if (储物袋名称正则.test(text)) return '储物袋';
    if (储物扩容名称正则.test(text) || 估算储物负重加成(item) > 0) return '储物袋';
    return null;
};

export const 估算储物负重加成 = (item: any): number => {
    const explicitAffix = 从词条读取负重加成(item);
    if (explicitAffix > 0) return explicitAffix;
    const existingCapacity = 取非负数(item?.容器属性?.最大容量, 0);
    if (existingCapacity > 0) return existingCapacity;
    const text = `${取文本(item?.名称)} ${取文本(item?.描述)} ${取文本(item?.视觉描述)}`;
    const textCapacity = 解析文字容量(text);
    if (textCapacity > 0) return textCapacity;
    if (/乾坤戒/.test(text)) return 150;
    if (/纳戒|纳物戒|储物戒|储物戒指|储物指环/.test(text)) return 80;
    if (/储物镯|储物手镯/.test(text)) return 80;
    if (/乾坤袋|须弥袋/.test(text)) return 120;
    if (/储物袋/.test(text)) return 50;
    if (/百宝囊|行囊/.test(text)) return 30;
    return 0;
};

export const 是否储物扩容物品 = (item: any): boolean => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const text = `${取文本(item?.名称)} ${取文本(item?.描述)} ${取文本(item?.视觉描述)}`;
    return 储物扩容名称正则.test(text) || 估算储物负重加成(item) > 0;
};

export const 规范化储物扩容物品 = (item: any): void => {
    if (!是否储物扩容物品(item)) return;
    const bonus = 估算储物负重加成(item);
    item.词条列表 = Array.isArray(item?.词条列表)
        ? item.词条列表
            .map((entry: any) => {
                const attr = 取文本(entry?.属性);
                const value = Number(entry?.数值);
                if (!attr || !Number.isFinite(value) || value === 0) return null;
                if (/精力|体力|耐力/.test(attr)) {
                    return { ...entry, 属性: '最大负重', 数值: Math.max(value, bonus || 0), 依据: '储物扩容物品直接提高负重上限，不提升精力。' };
                }
                return entry;
            })
            .filter(Boolean)
        : [];

    const hasCarryEntry = item.词条列表.some((entry: any) => /最大负重|负重上限/.test(取文本(entry?.属性)));
    if (!hasCarryEntry && bonus > 0) {
        item.词条列表.push({
            名称: '储物扩容',
            属性: '最大负重',
            数值: bonus,
            类型: '固定值',
            依据: '储物袋/储物戒指直接提高负重上限。'
        });
    }

    if (Array.isArray(item?.使用效果)) {
        item.使用效果 = item.使用效果.map((effect: any) => {
            const target = 取文本(effect?.目标属性);
            if (/精力|体力|耐力/.test(target)) {
                return { ...effect, 目标属性: '最大负重', 数值: Math.max(取非负数(effect?.数值, 0), bonus || 0), 依据: '储物扩容物品应增加负重上限，不恢复精力。' };
            }
            return effect;
        });
    }
};

export const 计算储物负重加成 = (items: any[]): 储物负重加成信息 => {
    const result: 储物负重加成信息 = { 储物袋: 0, 储物戒指: 0, 总计: 0 };
    (Array.isArray(items) ? items : []).forEach((item) => {
        if (!是否储物扩容物品(item)) return;
        const type = 获取储物扩容类型(item) || '储物袋';
        const bonus = 估算储物负重加成(item);
        result[type] = Math.max(result[type], bonus);
    });
    result.总计 = result.储物袋 + result.储物戒指;
    return result;
};

export const 重算背包物品负重 = (items: any[]): number => (
    四舍五入一位((Array.isArray(items) ? items : []).reduce((sum, item) => {
        const weight = 取非负数(item?.重量, 0);
        const count = Math.max(1, 取整数(item?.堆叠数量, 1));
        return sum + weight * count;
    }, 0))
);

export const 同步角色储物负重上限 = <T extends any>(character: T): T => {
    if (!character || typeof character !== 'object' || Array.isArray(character)) return character;
    const role = character as any;
    const items = Array.isArray(role?.物品列表) ? role.物品列表 : [];
    items.forEach((item: any) => {
        if (是否储物扩容物品(item)) 规范化储物扩容物品(item);
        delete item.当前容器ID;
        delete item.占用空间;
        delete item.容器属性;
    });
    const currentBonus = 计算储物负重加成(items);
    const rawMax = 取非负数(role?.最大负重, 0);
    const previousBase = 取非负数(role?.基础最大负重, Number.NaN);
    const previousBonus = 取非负数(role?.储物负重加成?.总计, 0);
    const hasPreviousBase = Number.isFinite(previousBase) && previousBase > 0;
    const expectedPreviousMax = hasPreviousBase ? previousBase + previousBonus : rawMax;

    let baseMax = rawMax;
    if (hasPreviousBase) {
        if (Math.abs(rawMax - expectedPreviousMax) <= 0.05) {
            baseMax = previousBase;
        } else if (previousBonus > 0 && rawMax > previousBonus) {
            baseMax = rawMax - previousBonus;
        }
    }
    baseMax = Math.max(0, 四舍五入一位(baseMax));

    role.基础最大负重 = baseMax;
    role.储物负重加成 = currentBonus;
    role.最大负重 = 四舍五入一位(baseMax + currentBonus.总计);
    role.当前负重 = 重算背包物品负重(items);
    return role;
};
