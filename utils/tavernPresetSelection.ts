import type { 创意工坊模块条目 } from '../data/creativeWorkshopModules';
import type { 游戏设置结构, 酒馆预设结构, 酒馆预设条目结构 } from '../types';

export type 酒馆预设候选条目 = Omit<酒馆预设条目结构, '预设'> & {
    预设: 酒馆预设结构 | null;
    可删除: boolean;
    工坊预设路径?: string;
    加载状态: 'ready' | 'loading' | 'error';
};

export const 是创意工坊酒馆预设 = (entry: Pick<创意工坊模块条目, 'type'>): boolean => (
    entry.type === 'tavern_preset'
);

export const 酒馆预设条目可删除 = (entry: Pick<酒馆预设条目结构, '来源'> | null | undefined): boolean => (
    entry?.来源 !== '创意工坊'
);

export const 构建酒馆预设选择列表 = (
    localList: 游戏设置结构['酒馆预设列表'],
    workshopModules: 创意工坊模块条目[],
    loadedWorkshopPresets: Record<string, 酒馆预设结构 | null | undefined> = {}
): 酒馆预设候选条目[] => {
    const result: 酒馆预设候选条目[] = [];
    const usedIds = new Set<string>();

    (Array.isArray(localList) ? localList : []).forEach((entry) => {
        if (!entry?.id) return;
        result.push({
            ...entry,
            预设: entry.预设,
            可删除: 酒馆预设条目可删除(entry),
            加载状态: 'ready',
        });
        usedIds.add(entry.id);
    });

    workshopModules.filter(是创意工坊酒馆预设).forEach((module) => {
        const id = `workshop:${module.id}`;
        if (usedIds.has(id)) return;
        const embeddedPreset = module.tavernPreset || module.payload?.tavernPreset || null;
        const loadedPreset = embeddedPreset || loadedWorkshopPresets[module.id] || null;
        const presetPath = typeof module.payload?.presetPath === 'string' ? module.payload.presetPath : undefined;
        result.push({
            id,
            名称: module.title || '创意工坊酒馆预设',
            预设: loadedPreset,
            角色ID: null,
            来源: '创意工坊',
            工坊模块ID: module.id,
            工坊来源: module.source,
            贡献者: module.contributor,
            可删除: false,
            工坊预设路径: presetPath,
            加载状态: loadedPreset ? 'ready' : loadedWorkshopPresets[module.id] === null ? 'error' : 'loading',
        });
        usedIds.add(id);
    });

    return result;
};
