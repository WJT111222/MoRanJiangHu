import { describe, expect, it } from 'vitest';
import { 创建默认拍卖行状态, 清理并补货, 投放事件拍卖品, 从剧情响应构建拍卖行投放参数列表 } from '../services/auctionHouse';

describe('拍卖行默认补货', () => {
    it('新档默认拍卖行状态不自动生成系统拍品', () => {
        const state = 创建默认拍卖行状态();

        // 新档应该没有系统拍品，等待剧情触发
        expect(state.行情列表.length).toBeGreaterThan(0); // 行情仍然生成
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').length).toBe(0); // 没有拍品
        expect(state.最近补货时间).toBe(0); // 没有补货
    });

    it('剧情触发时允许系统补货', () => {
        const emptyState = {
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        };
        
        // 模拟剧情触发投放
        const state = 投放事件拍卖品(emptyState, {
            事件名称: '测试事件',
            来源描述: '测试来源',
            物品: {
                名称: '测试物品',
                类型: '武器',
                品质: '上品',
                价值: 1000
            }
        });

        // 剧情触发后应该有系统补货
        expect(state.拍卖品列表.some((entry) => entry.卖家ID.startsWith('system_'))).toBe(true);
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').length).toBeGreaterThan(0);
    });
    
    it('系统补货时避免重复物品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true });

        const itemKeys = state.拍卖品列表
            .filter((entry) => entry.状态 === '上架中')
            .map((entry) => `${entry.物品.名称}|${entry.物品.类型}|${entry.物品.品质}`);
        
        // 检查没有完全重复的物品
        const uniqueKeys = new Set(itemKeys);
        expect(uniqueKeys.size).toBe(itemKeys.length);
    });

    it('系统补货不再生成杂物拍品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        }, { 允许系统补货: true });

        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').every((entry) => entry.物品.类型 !== '杂物' && entry.物品.类型 !== '杂项')).toBe(true);
    });
});

describe('拍卖行剧情物品入市过滤', () => {
    it('人物手中拿着的食盒不会被当成入市拍品', () => {
        const result = 从剧情响应构建拍卖行投放参数列表({
            logs: [
                {
                    sender: '旁白',
                    text: '沈清婉手中提着一个食盒，轻轻搁在桌边，只说这是给你带来的点心，并没有任何出售、寄售或入市的意思。'
                }
            ]
        } as any, { maxCount: 3 });

        expect(result.shouldDispatch).toBe(false);
        expect(result.reason).toContain('具体物品入市');
    });

    it('AI 提取到杂物也不能自动流入拍卖行', () => {
        const result = 从剧情响应构建拍卖行投放参数列表({
            logs: [
                {
                    sender: '旁白',
                    text: '牙行门口有人议论沈清婉手中提着一个食盒，实际只是她随身带来的饭食。'
                }
            ]
        } as any, {
            maxCount: 1,
            useAIExtraction: true,
            aiExtractionResult: {
                是否有市场语义: true,
                是否有稀有物语义: false,
                提取的物品列表: [
                    {
                        名称: '沈清婉手中提着一个食盒',
                        类型: '杂物',
                        品质: '上品',
                        描述: '人物手中拿着的食盒',
                        价格估值: 8200,
                        是否合理: true
                    }
                ]
            }
        });

        expect(result.shouldDispatch).toBe(false);
        expect(result.reason).toContain('具体物品入市');
    });

    it('玩家身边或持有的物品不会因为本回合出现就流入市场', () => {
        const result = 从剧情响应构建拍卖行投放参数列表({
            logs: [
                {
                    sender: '旁白',
                    text: '你低头看了看放在枕边的青玉佩，又摸了摸那件浆洗得有些发白的青云剑。两样东西都在你身边，并没有任何人拿去出售。'
                }
            ]
        } as any, { maxCount: 3 });

        expect(result.shouldDispatch).toBe(false);
        expect(result.reason).toContain('市场流通');
    });

    it('有明确市场语义时清理修饰词，只投放核心物品名', () => {
        const result = 从剧情响应构建拍卖行投放参数列表({
            logs: [
                {
                    sender: '旁白',
                    text: '黑市摊客今晚摆出那件浆洗得有些发白的青云剑，并标价出售，称其仍是青云宗旧物。'
                }
            ]
        } as any, { maxCount: 1 });

        expect(result.shouldDispatch).toBe(true);
        expect(result.params?.物品?.名称).toBe('青云剑');
    });

    it('世界大事和宗门交易导致的物品可以流入拍卖行', () => {
        const result = 从剧情响应构建拍卖行投放参数列表({
            logs: [
                {
                    sender: '世界大事',
                    text: '玄沙帮与青云剑宗在矿道外攻杀一场，镖局战后将缴获的寒潭玄铁屑送入牙行寄售，坊市已有卖家叫价。'
                }
            ]
        } as any, { maxCount: 1 });

        expect(result.shouldDispatch).toBe(true);
        expect(result.params?.物品?.名称).toBe('寒潭玄铁屑');
        expect(result.params?.卖家名称).toBe('宗门掮客');
    });

    it('AI 提取误判玩家私有物时仍会被确定性过滤', () => {
        const result = 从剧情响应构建拍卖行投放参数列表({
            logs: [
                {
                    sender: '旁白',
                    text: '你低头看了看放在枕边的青玉佩，确认它仍是自己的随身旧物。'
                }
            ]
        } as any, {
            maxCount: 1,
            useAIExtraction: true,
            aiExtractionResult: {
                是否有市场语义: true,
                是否有稀有物语义: false,
                提取的物品列表: [
                    {
                        名称: '青玉佩',
                        类型: '饰品',
                        品质: '上品',
                        描述: '玩家身边的随身旧物',
                        价格估值: 8200,
                        是否合理: true
                    }
                ]
            }
        });

        expect(result.shouldDispatch).toBe(false);
        expect(result.reason).toContain('具体物品入市');
    });
});
