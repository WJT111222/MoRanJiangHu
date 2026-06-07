import type { 角色数据结构 } from '../types';

type 自动丹药预设选项 = {
    启用饱腹口渴系统?: boolean;
    题材模式?: unknown;
};

const 自动预设消耗品ID列表 = [
    'auto_pill_bigu',
    'auto_pill_huiqi',
    'auto_pill_ningyuan',
    'auto_pill_pojing',
    'auto_survival_water',
    'auto_survival_biscuit',
    'auto_survival_first_aid',
    'auto_modern_first_aid',
    'auto_infinite_water_tablet',
    'auto_infinite_compressed_ration',
    'auto_infinite_hemostatic_spray',
    'auto_infinite_mental_stabilizer',
    'auto_fantasy_ration',
    'auto_fantasy_waterskin',
    'auto_fantasy_healing_potion',
    'auto_fantasy_mana_potion'
];

const 古风自动丹药名称列表 = ['辟谷丹', '回气丹', '凝元丹', '破境丹'];
const 全部自动预设消耗品名称列表 = [
    ...古风自动丹药名称列表,
    '饮水瓶',
    '压缩饼干',
    '医用绷带',
    '急救包',
    '净水片',
    '压缩口粮',
    '止血喷雾',
    '精神稳定剂',
    '旅行干粮',
    '清水水囊',
    '治疗药水',
    '法力药水'
];

export const 补齐自动丹药预设 = (items: any[], options?: 自动丹药预设选项): any[] => {
    void options;
    return Array.isArray(items) ? [...items] : [];
};

export const 自动预设丹药ID集合 = new Set(自动预设消耗品ID列表);
export const 自动预设丹药名称集合 = new Set(古风自动丹药名称列表);
export const 全部自动预设消耗品名称集合 = new Set(全部自动预设消耗品名称列表);
export const 古风丹药预设名称集合 = 自动预设丹药名称集合;
export const 生存补给预设名称集合 = new Set(['辟谷丹', '饮水瓶', '压缩饼干', '净水片', '压缩口粮']);

export const 执行自动丹药补给 = (role: 角色数据结构): string[] => {
    void role;
    return [];
};
