import { describe, expect, it, vi } from 'vitest';
import { 执行变量模型校准工作流 } from '../hooks/useGame/variableModelWorkflow';
import * as textAIService from '../services/ai/text';

vi.mock('../services/ai/text', () => ({
    generateVariableCalibrationUpdate: vi.fn()
}));

const 创建变量接口配置 = () => ({
    configs: [
        {
            id: 'main',
            name: '测试接口',
            apiKey: 'test-key',
            model: 'test-model',
            baseUrl: 'https://example.com/v1',
            供应商: 'openai',
            协议覆盖: 'auto'
        }
    ],
    currentConfigId: 'main',
    功能模型占位: {
        变量计算独立模型开关: true,
        变量计算渠道ID: 'main',
        变量计算使用模型: 'test-model'
    }
});

describe('variableModelWorkflow inventory commands', () => {
    it('keeps sub commands returned by the variable model so inventory quantities can be deducted', async () => {
        vi.mocked(textAIService.generateVariableCalibrationUpdate).mockResolvedValueOnce({
            commands: [
                { action: 'sub', key: '角色.物品列表[0].堆叠数量', value: 1 }
            ],
            reports: ['消耗回气丹 1 枚。'],
            rawText: '<命令>sub 角色.物品列表[0].堆叠数量 = 1</命令>'
        } as any);

        const result = await 执行变量模型校准工作流({
            playerInput: '服用一枚回气丹。',
            parsedResponse: {
                logs: [{ sender: '旁白', text: '他服下一枚回气丹，药力化开。' }],
                tavern_commands: []
            } as any,
            baseState: {
                角色: {
                    姓名: '杨培强',
                    物品列表: [
                        { ID: 'pill_1', 名称: '回气丹', 堆叠数量: 3, 是否可堆叠: true }
                    ]
                },
                环境: {},
                世界: {},
                社交: [],
                战斗: {},
                玩家门派: {},
                任务列表: [],
                约定列表: []
            },
            promptPool: [],
            worldEvolutionEnabled: false
        }, {
            apiConfig: 创建变量接口配置(),
            gameConfig: {}
        });

        expect(result?.commands).toEqual([
            { action: 'sub', key: '角色.物品列表[0].堆叠数量', value: 1 }
        ]);
    });
});
