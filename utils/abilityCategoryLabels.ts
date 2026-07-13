import type { ModeRuntimeProfile, 题材模式类型 } from '../models/system';
import { 功法类型列表 } from '../models/kungfu';
import { 获取题材模式配置 } from './topicModeProfiles';
import { 是否自定义模式运行时配置, 读取界面文案覆盖分区, 解析生效题材模式 } from './effectiveTopicProfile';

const 无限流类别映射: Record<string, string> = { 招式: '主动能力', 内功: '精神训练', 外功: '体能强化', 轻功: '机动能力', 被动: '被动能力', 功法: '综合强化', 心法: '心理锚定', 身法: '机动能力', 术法: '超能力', 神通: '血统能力' };
const 西方奇幻类别映射: Record<string, string> = { 招式: '战技', 内功: '魔力训练', 外功: '防护训练', 轻功: '机动专长', 被动: '被动专长', 功法: '综合能力', 心法: '冥想法', 身法: '机动专长', 术法: '法术', 神通: '传奇能力' };
const 仙侠类别映射: Record<string, string> = { 招式: '术式', 内功: '心法', 外功: '炼体法', 轻功: '遁法', 被动: '道基被动', 功法: '法门', 心法: '心法', 身法: '遁法', 术法: '术法', 神通: '神通' };
const 末日类别映射: Record<string, string> = { 招式: '战斗技巧', 内功: '体能训练', 外功: '防护训练', 轻功: '移动技巧', 被动: '生存经验', 功法: '综合训练', 心法: '心理调节', 身法: '移动技巧' };
const 现代类别映射: Record<string, string> = { 招式: '行动能力', 内功: '专注训练', 外功: '体能训练', 轻功: '机动能力', 被动: '被动能力', 功法: '综合能力', 心法: '心理训练', 身法: '机动能力', 术法: '特殊能力', 神通: '高阶能力' };
const 武侠类别映射: Record<string, string> = { 招式: '武技', 内功: '内功心法', 外功: '外功', 轻功: '身法轻功', 被动: '杂学被动' };

export const 规范能力类别键列表 = [...功法类型列表, '招式', '功法', '心法', '身法'] as const;

export const 按题材获取类别映射 = (mode?: 题材模式类型 | null): Record<string, string> => {
    const group = 获取题材模式配置(mode || undefined).group;
    if (group === 'infinite') return 无限流类别映射;
    if (group === 'western_fantasy') return 西方奇幻类别映射;
    if (group === 'xianxia') return 仙侠类别映射;
    if (group === 'apocalypse') return 末日类别映射;
    if (group === 'urban_xianxia' || group === 'modern') return 现代类别映射;
    return 武侠类别映射;
};

/**
 * 能力/功法类别显示名：官方题材映射 + 模式包 uiLabels.能力类别 覆盖。
 * 覆盖键为规范类别名（招式/内功/外功/轻功/被动/功法/心法/身法/术法/神通），值为该题材下的显示名。
 */
export const 格式化能力类别 = (
    type: unknown,
    mode?: 题材模式类型 | null,
    runtimeProfile?: ModeRuntimeProfile | null
): string => {
    const text = typeof type === 'string' ? type.trim() : '';
    if (!text) return '未分类';
    if (runtimeProfile && 是否自定义模式运行时配置(runtimeProfile, mode)) {
        const 覆盖 = 读取界面文案覆盖分区(runtimeProfile, '能力类别');
        if (覆盖[text]) return 覆盖[text];
    }
    const labels = 按题材获取类别映射(解析生效题材模式(mode, runtimeProfile));
    return labels[text] || text;
};
