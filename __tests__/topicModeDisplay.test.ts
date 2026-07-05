import { describe, expect, it } from 'vitest';
import { 构建题材显示摘要 } from '../utils/topicModeDisplay';
import { 构建官方模式运行时配置 } from '../utils/modeRuntimeProfile';

describe('题材模式显示摘要', () => {
    it('优先使用模式包运行时配置而不是官方基底题材文案', () => {
        const runtimeProfile = 构建官方模式运行时配置('灵气复苏', {
            identity: {
                modeId: 'custom-aura-city',
                displayName: '霓虹灵灾模式',
                baseMode: '灵气复苏',
                isModern: true,
                usesCultivation: true,
                isApocalypse: false,
                isSurvival: false,
                isFandomIp: true
            },
            economy: {
                currencyDisplayMode: 'urban',
                primaryCurrency: '普通人使用城市积分，异常交易使用灵灾配给券。',
                accountingUnit: '城市积分',
                exchangeRules: '1 张灵灾配给券=500 城市积分；高阶封印许可不直接折现。',
                currencyTiers: {
                    upperName: '封印许可',
                    middleName: '灵灾配给券',
                    lowerName: '城市积分',
                    upperToMiddleRate: 20,
                    middleToLowerRate: 500
                },
                marketName: '霓虹黑市',
                marketVerb: '流入霓虹黑市',
                allowedItemTypes: [],
                bannedKeywords: []
            },
            map: {
                layerNames: ['寰宇', '大地点', '中地点', '小地点', '区地点', '子地点'],
                locationTypes: ['霓虹街区', '封控塔'],
                poiTypes: ['异常站点'],
                bannedLocationKeywords: [],
                mapPrompt: '世界版图应按霓虹街区、封控塔和异常站点组织。'
            }
        });

        const summary = 构建题材显示摘要('灵气复苏', runtimeProfile);

        expect(summary.label).toBe('霓虹灵灾模式');
        expect(summary.shortLabel).toBe('霓虹灵灾');
        expect(summary.marketName).toBe('霓虹黑市');
        expect(summary.currencyPrompt).toBe('普通人使用城市积分，异常交易使用灵灾配给券。');
        expect(summary.currencyExchangePrompt).toBe('1 张灵灾配给券=500 城市积分；高阶封印许可不直接折现。');
        expect(summary.mapPrompt).toBe('世界版图应按霓虹街区、封控塔和异常站点组织。');
        expect(summary.promptLines.join('\n')).toContain('霓虹灵灾模式');
        expect(summary.promptLines.join('\n')).not.toContain('复苏前日常消费使用人民币');
    });
});
