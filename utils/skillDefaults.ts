import type { ModeRuntimeProfile, 题材模式类型 } from '../models/system';
import { 获取题材模式配置 } from './topicModeProfiles';

export const 武侠默认技艺名称 = ['医术', '毒术', '机关', '采集', '鉴定', '易容', '潜行', '经商'];

export const 仙侠默认技艺名称 = ['炼器', '炼丹', '医术', '阵法', '符箓', '机关', '采集', '鉴定'];

export const 获取默认技艺名称 = (mode?: 题材模式类型 | null, runtimeProfile?: ModeRuntimeProfile | null): string[] => (
    Array.isArray(runtimeProfile?.ability?.skillPool) && runtimeProfile.ability.skillPool.length > 0
        ? runtimeProfile.ability.skillPool
        : 获取题材模式配置(mode).skillNames
);

export const 构建默认技艺 = (mode?: 题材模式类型 | null, runtimeProfile?: ModeRuntimeProfile | null) => (
    获取默认技艺名称(mode, runtimeProfile).map((名称) => ({
        名称,
        等级: '未入门',
        熟练度: 0,
        描述: '尚未形成稳定技艺。'
    }))
);
