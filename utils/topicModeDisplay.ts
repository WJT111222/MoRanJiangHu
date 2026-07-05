import type { ModeRuntimeProfile, 题材模式类型 } from '../models/system';
import { 获取题材模式配置 } from './topicModeProfiles';

const 取短标签 = (label: string): string => {
    const trimmed = label.trim();
    if (!trimmed) return '';
    return trimmed.replace(/模式包|模式|世界$/g, '').slice(0, 4) || trimmed.slice(0, 4);
};

export const 构建题材显示摘要 = (mode?: 题材模式类型 | null, runtimeProfile?: ModeRuntimeProfile | null) => {
    const official = 获取题材模式配置(mode || runtimeProfile?.identity.baseMode);
    const runtimeName = runtimeProfile?.identity.displayName?.trim();
    const label = runtimeName || official.label;
    const marketName = runtimeProfile?.economy.marketName?.trim() || official.auctionName;
    const currencyPrompt = runtimeProfile?.economy.primaryCurrency?.trim() || official.currencyPrompt;
    const currencyExchangePrompt = runtimeProfile?.economy.exchangeRules?.trim() || official.currencyExchangePrompt;
    const mapPrompt = runtimeProfile?.map.mapPrompt?.trim() || official.mapPrompt;
    const skillPool = runtimeProfile?.ability.skillPool?.filter(Boolean) || [];
    const itemPool = runtimeProfile?.items.initialItemPool?.filter(Boolean) || [];
    const usesCustomRuntime = Boolean(runtimeProfile && runtimeName && runtimeName !== official.label);

    return {
        ...official,
        label,
        shortLabel: usesCustomRuntime ? 取短标签(label) : official.shortLabel,
        hint: usesCustomRuntime
            ? `基于${official.label}的自定义模式包，使用该模式包保存的世界观、交易、地图和能力口径。`
            : official.hint,
        auctionName: marketName,
        marketName,
        marketVerb: runtimeProfile?.economy.marketVerb?.trim() || official.marketVerb,
        currencyPrompt,
        currencyExchangePrompt,
        mapPrompt,
        skillNames: skillPool.length > 0 ? skillPool : official.skillNames,
        presetItemKeywords: itemPool.length > 0 ? itemPool : official.presetItemKeywords,
        promptLines: runtimeProfile
            ? [
                `本存档使用「${label}」模式包，官方基底为「${official.label}」。`,
                `交易口径：${currencyPrompt}`,
                `统一换算口径：${currencyExchangePrompt}`,
                `地图/势力口径：${mapPrompt}`,
                `组织口径：${runtimeProfile.organization.organizationName} / ${runtimeProfile.organization.memberName} / ${runtimeProfile.organization.contributionName}`,
                `能力口径：${runtimeProfile.ability.primaryAxis}；${runtimeProfile.ability.combatResolution}`
            ].filter((line) => !line.endsWith('：') && !line.endsWith('；'))
            : official.promptLines
    };
};
