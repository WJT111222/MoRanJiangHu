import { describe, expect, it } from 'vitest';
import { 获取快速重开运行时恢复参数 } from '../utils/customNewGamePresets';

describe('workshop opening restore helpers', () => {
    it('快速重开优先使用 runtimeSnapshot 中的恢复字段', () => {
        const restored = 获取快速重开运行时恢复参数({
            openingConfig: {
                题材模式: '武侠',
                初始关系模板: '随机邂逅',
                关系侧重: ['友情'],
                开局切入偏好: '市井起手',
                开局生成门派: true,
                开局生成同门: true,
                同人融合: {
                    enabled: false,
                    作品名: '',
                    来源类型: '小说',
                    融合强度: '轻度映射',
                    保留原著角色: false,
                    启用角色替换: false,
                    替换目标角色名: '',
                    附加替换角色名列表: [],
                    附加角色替换规则列表: [],
                    启用附加小说: false,
                    附加小说数据集ID: ''
                },
                runtimeSnapshot: {
                    openingStreaming: false,
                    openingExtraPrompt: '来自快照的额外提示',
                    openingExtraRequirement: '来自快照的额外要求',
                    activeModuleExtraRules: '来自快照的模块规则'
                }
            },
            openingStreaming: true,
            openingExtraPrompt: '旧表层提示'
        });

        expect(restored.openingStreaming).toBe(false);
        expect(restored.openingExtraPrompt).toBe('来自快照的额外提示');
        expect(restored.openingExtraRequirement).toBe('来自快照的额外要求');
        expect(restored.activeModuleExtraRules).toBe('来自快照的模块规则');
    });
});
