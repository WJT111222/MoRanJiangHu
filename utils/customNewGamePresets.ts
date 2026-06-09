import type { OpeningConfig, OpeningRuntimeSnapshot, 天赋结构, 背景结构 } from '../types';
import type { 开局预设方案结构 } from '../data/newGamePresets';
import { 属性最大值, 属性最小值, 规范化可选开局配置 } from './openingConfig';
import { 规范化模式运行时配置 } from './modeRuntimeProfile';
import { normalizeRealmDraft, normalizeWorldMapDraft } from './newGameDiy';

export const 自定义开局预设存储键 = 'new_game_custom_start_presets';

const 属性键列表 = ['力量', '敏捷', '体质', '根骨', '悟性', '福源'] as const;

const 标准化文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 标准化数值 = (value: unknown, fallback: number, min: number, max: number): number => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(min, Math.min(max, Math.round(numeric)));
};

export const 生成自定义开局预设ID = (): string => `custom_start_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const 标准化开局预设方案 = (raw: any): 开局预设方案结构 | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    const id = 标准化文本(raw.id) || 生成自定义开局预设ID();
    const 名称 = 标准化文本(raw.名称);
    if (!名称) return null;

    const 属性 = 属性键列表.reduce((acc, key) => {
        acc[key] = 标准化数值(raw?.character?.属性?.[key], 属性最小值, 属性最小值, 属性最大值);
        return acc;
    }, {} as 开局预设方案结构['character']['属性']);
    const openingConfig = 规范化可选开局配置(raw?.openingConfig);
    const rawRuntimeProfile = raw?.worldConfig?.modeRuntimeProfile || openingConfig?.modeRuntimeProfile;
    const modeRuntimeProfile = (rawRuntimeProfile || openingConfig)
        ? 规范化模式运行时配置(rawRuntimeProfile, openingConfig?.题材模式)
        : undefined;

    return {
        id,
        名称,
        简介: 标准化文本(raw.简介) || '自定义开局方案',
        worldConfig: {
            worldName: 标准化文本(raw?.worldConfig?.worldName),
            worldSize: raw?.worldConfig?.worldSize === '弹丸之地' || raw?.worldConfig?.worldSize === '九州宏大' || raw?.worldConfig?.worldSize === '无尽位面'
                ? raw.worldConfig.worldSize
                : '九州宏大',
            dynastySetting: 标准化文本(raw?.worldConfig?.dynastySetting),
            sectDensity: raw?.worldConfig?.sectDensity === '稀少' || raw?.worldConfig?.sectDensity === '适中' || raw?.worldConfig?.sectDensity === '林立'
                ? raw.worldConfig.sectDensity
                : '林立',
            tianjiaoSetting: 标准化文本(raw?.worldConfig?.tianjiaoSetting),
            difficulty: raw?.worldConfig?.difficulty === 'relaxed' || raw?.worldConfig?.difficulty === 'easy' || raw?.worldConfig?.difficulty === 'normal' || raw?.worldConfig?.difficulty === 'hard' || raw?.worldConfig?.difficulty === 'extreme'
                ? raw.worldConfig.difficulty
                : 'normal',
            worldExtraRequirement: 标准化文本(raw?.worldConfig?.worldExtraRequirement),
            manualWorldPrompt: 标准化文本(raw?.worldConfig?.manualWorldPrompt),
            manualRealmPrompt: 标准化文本(raw?.worldConfig?.manualRealmPrompt),
            ...(modeRuntimeProfile ? { modeRuntimeProfile } : {}),
            realmDiyDraft: normalizeRealmDraft(raw?.worldConfig?.realmDiyDraft),
            mapDiyDraft: normalizeWorldMapDraft(raw?.worldConfig?.mapDiyDraft)
        },
        character: {
            姓名: 标准化文本(raw?.character?.姓名),
            性别: 标准化文本(raw?.character?.性别) || '男',
            年龄: 标准化数值(raw?.character?.年龄, 18, 1, 999),
            出生月: 标准化数值(raw?.character?.出生月, 1, 1, 12),
            出生日: 标准化数值(raw?.character?.出生日, 1, 1, 31),
            外貌: 标准化文本(raw?.character?.外貌),
            性格: 标准化文本(raw?.character?.性格),
            属性,
            背景名称: 标准化文本(raw?.character?.背景名称),
            天赋名称列表: Array.isArray(raw?.character?.天赋名称列表)
                ? raw.character.天赋名称列表.map((item: unknown) => 标准化文本(item)).filter(Boolean).slice(0, 3)
                : []
        },
        openingConfig: openingConfig && modeRuntimeProfile
            ? { ...openingConfig, modeRuntimeProfile }
            : openingConfig,
        openingStreaming: openingConfig?.runtimeSnapshot?.openingStreaming ?? raw?.openingStreaming !== false,
        openingExtraRequirement: 标准化文本(raw?.openingExtraRequirement || openingConfig?.runtimeSnapshot?.openingExtraRequirement)
    };
};

export const 合并去重开局预设方案 = (rawList: 开局预设方案结构[]): 开局预设方案结构[] => {
    const map = new Map<string, 开局预设方案结构>();
    rawList.forEach((item) => {
        const normalized = 标准化开局预设方案(item);
        if (!normalized) return;
        map.set(normalized.id, normalized);
    });
    return Array.from(map.values());
};

const 合并去重背景 = (rawList: 背景结构[]): 背景结构[] => {
    const map = new Map<string, 背景结构>();
    rawList.forEach((item) => {
        const 名称 = 标准化文本(item?.名称);
        const 描述 = 标准化文本(item?.描述);
        const 效果 = 标准化文本(item?.效果);
        if (!名称 || !描述 || !效果) return;
        map.set(名称, { ...item, 名称, 描述, 效果 });
    });
    return Array.from(map.values());
};

const 合并去重天赋 = (rawList: 天赋结构[]): 天赋结构[] => {
    const map = new Map<string, 天赋结构>();
    rawList.forEach((item) => {
        const 名称 = 标准化文本(item?.名称);
        const 描述 = 标准化文本(item?.描述);
        const 效果 = 标准化文本(item?.效果);
        if (!名称 || !描述 || !效果) return;
        map.set(名称, { 名称, 描述, 效果 });
    });
    return Array.from(map.values());
};

export const 构建开局运行时快照 = (params: {
    openingConfig?: OpeningConfig;
    openingStreaming?: boolean;
    openingExtraRequirement?: string;
    openingExtraPrompt?: string;
    activeModuleExtraRules?: string;
    modeBackgrounds?: 背景结构[];
    modeTalents?: 天赋结构[];
}): OpeningRuntimeSnapshot | undefined => {
    const modeBackgrounds = 合并去重背景(params.modeBackgrounds || []);
    const modeTalents = 合并去重天赋(params.modeTalents || []);
    const snapshot: OpeningRuntimeSnapshot = {
        openingStreaming: params.openingStreaming !== false,
        openingExtraRequirement: 标准化文本(params.openingExtraRequirement),
        openingExtraPrompt: 标准化文本(params.openingExtraPrompt),
        activeModuleExtraRules: 标准化文本(params.activeModuleExtraRules),
        ...(modeBackgrounds.length > 0 ? { modeBackgrounds } : {}),
        ...(modeTalents.length > 0 ? { modeTalents } : {})
    };
    if (
        snapshot.openingStreaming === true
        && !snapshot.openingExtraRequirement
        && !snapshot.openingExtraPrompt
        && !snapshot.activeModuleExtraRules
        && modeBackgrounds.length <= 0
        && modeTalents.length <= 0
    ) {
        return params.openingConfig?.runtimeSnapshot;
    }
    return snapshot;
};

export const 获取快速重开运行时恢复参数 = (params: {
    openingConfig?: OpeningConfig;
    openingStreaming?: boolean;
    openingExtraPrompt?: string;
    openingExtraRequirement?: string;
    activeModuleExtraRules?: string;
}) => {
    const snapshot = params.openingConfig?.runtimeSnapshot;
    return {
        openingStreaming: snapshot?.openingStreaming ?? params.openingStreaming !== false,
        openingExtraPrompt: 标准化文本(snapshot?.openingExtraPrompt || params.openingExtraPrompt),
        openingExtraRequirement: 标准化文本(snapshot?.openingExtraRequirement || params.openingExtraRequirement),
        activeModuleExtraRules: 标准化文本(snapshot?.activeModuleExtraRules || params.activeModuleExtraRules)
    };
};

export const 构建预设表单恢复结果 = (
    preset: 开局预设方案结构,
    options: {
        fallbackBackgrounds: 背景结构[];
        fallbackTalents: 天赋结构[];
        selectedBackgroundCatalog?: 背景结构[];
        selectedTalentCatalog?: 天赋结构[];
    }
) => {
    const snapshot = preset.openingConfig?.runtimeSnapshot;
    const 模式包背景列表 = 合并去重背景(snapshot?.modeBackgrounds || []);
    const 模式包天赋列表 = 合并去重天赋(snapshot?.modeTalents || []);
    const 已选背景兜底列表 = 合并去重背景(options.selectedBackgroundCatalog || []);
    const 已选天赋兜底列表 = 合并去重天赋(options.selectedTalentCatalog || []);
    const 全部背景选项 = 合并去重背景([
        ...模式包背景列表,
        ...options.fallbackBackgrounds,
        ...已选背景兜底列表
    ]);
    const 全部天赋选项 = 合并去重天赋([
        ...模式包天赋列表,
        ...options.fallbackTalents,
        ...已选天赋兜底列表
    ]);
    const selectedBackground = 全部背景选项.find((item) => item.名称 === 标准化文本(preset.character?.背景名称))
        || 全部背景选项[0]
        || options.fallbackBackgrounds[0];
    const selectedTalents = (Array.isArray(preset.character?.天赋名称列表) ? preset.character.天赋名称列表 : [])
        .map((name) => 全部天赋选项.find((item) => item.名称 === 标准化文本(name)))
        .filter(Boolean) as 天赋结构[];
    const runtimeRestore = 获取快速重开运行时恢复参数({
        openingConfig: preset.openingConfig,
        openingStreaming: preset.openingStreaming,
        openingExtraRequirement: preset.openingExtraRequirement
    });
    return {
        模式包背景列表,
        模式包天赋列表,
        全部背景选项,
        全部天赋选项,
        selectedBackground,
        selectedTalents,
        ...runtimeRestore
    };
};
