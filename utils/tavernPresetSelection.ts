import type { 创意工坊模块条目 } from '../data/creativeWorkshopModules';
import type { 游戏设置结构, 酒馆预设结构, 酒馆预设条目结构 } from '../types';

export type 酒馆预设候选条目 = Omit<酒馆预设条目结构, '预设'> & {
    预设: 酒馆预设结构 | null;
    可删除: boolean;
    工坊预设路径?: string;
    加载状态: 'ready' | 'loading' | 'error';
};

export type 酒馆预设条目改动 = Partial<{ 名称: string; 预设: 酒馆预设结构; 角色ID: number | null }>;

type 应用酒馆预设条目改动参数 = {
    form: 游戏设置结构;
    localPresetList: 游戏设置结构['酒馆预设列表'];
    selectedEntry: 酒馆预设候选条目 | null | undefined;
    patch: 酒馆预设条目改动;
    generateId: () => string;
    resolveRoleId: (preset: 酒馆预设结构 | null | undefined, value: unknown) => number | null;
    now?: () => number;
};

const 克隆酒馆预设 = (preset: 酒馆预设结构): 酒馆预设结构 => {
    try {
        if (typeof structuredClone === 'function') return structuredClone(preset);
    } catch {
        // Fall back to JSON cloning below.
    }
    return JSON.parse(JSON.stringify(preset)) as 酒馆预设结构;
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
        const payloadPreset = module.payload?.tavernPreset;
        const embeddedPreset = module.tavernPreset || (
            payloadPreset && typeof payloadPreset === 'object' ? payloadPreset as 酒馆预设结构 : null
        );
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

export const 应用酒馆预设条目改动 = ({
    form,
    localPresetList,
    selectedEntry,
    patch,
    generateId,
    resolveRoleId,
    now = () => Date.now(),
}: 应用酒馆预设条目改动参数): { nextConfig: 游戏设置结构; createdLocalCopy: boolean } | null => {
    if (!selectedEntry) return null;
    const list = Array.isArray(localPresetList) ? localPresetList : [];

    if (selectedEntry.来源 === '创意工坊') {
        const sourcePreset = patch.预设 || selectedEntry.预设 || form.酒馆预设 || null;
        if (!sourcePreset) return null;
        const nextPreset = 克隆酒馆预设(sourcePreset);
        const nextRoleId = patch.角色ID !== undefined ? patch.角色ID : (selectedEntry.角色ID ?? form.酒馆预设角色ID ?? null);
        const localCopy: 酒馆预设条目结构 = {
            id: generateId(),
            名称: patch.名称 !== undefined ? patch.名称 : selectedEntry.名称,
            预设: nextPreset,
            角色ID: resolveRoleId(nextPreset, nextRoleId),
            导入时间: now(),
            来源: '玩家自行上传',
            工坊模块ID: selectedEntry.工坊模块ID,
            工坊来源: selectedEntry.工坊来源,
            贡献者: selectedEntry.贡献者,
        };
        const nextList = [...list, localCopy];
        return {
            createdLocalCopy: true,
            nextConfig: {
                ...form,
                酒馆预设列表: nextList,
                当前酒馆预设ID: localCopy.id,
                酒馆预设: localCopy.预设,
                酒馆预设名称: localCopy.名称,
                酒馆预设角色ID: localCopy.角色ID ?? null,
            },
        };
    }

    const nextList = list.map((entry) => {
        if (entry.id !== selectedEntry.id) return entry;
        const nextPreset = patch.预设 || entry.预设;
        const nextRoleId = patch.角色ID !== undefined ? patch.角色ID : entry.角色ID;
        return {
            ...entry,
            ...(patch.名称 !== undefined ? { 名称: patch.名称 } : {}),
            ...(patch.预设 ? { 预设: patch.预设 } : {}),
            ...(patch.角色ID !== undefined ? { 角色ID: resolveRoleId(nextPreset, nextRoleId) } : {}),
        };
    });
    const active = nextList.find((item) => item.id === selectedEntry.id) || null;
    return {
        createdLocalCopy: false,
        nextConfig: {
            ...form,
            酒馆预设列表: nextList,
            当前酒馆预设ID: active?.id || null,
            酒馆预设: active?.预设 || null,
            酒馆预设名称: active?.名称 || '',
            酒馆预设角色ID: resolveRoleId(active?.预设 || null, patch.角色ID ?? form.酒馆预设角色ID ?? active?.角色ID ?? null),
        },
    };
};
