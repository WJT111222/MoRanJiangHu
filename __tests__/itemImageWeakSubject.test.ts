import { describe, expect, it } from 'vitest';
import { 物品规则主体是否弱, 清洗物品英文主体 } from '../services/ai/itemImageGeneration';

describe('物品生图弱主体识别（塑料板根因防护）', () => {
    it('“百斤灵谷”这类中文自由描述、未命中映射的任务道具判定为弱主体', () => {
        const 灵谷 = {
            ID: 'Item003',
            名称: '百斤灵谷',
            类型: '任务道具',
            品质: '凡品',
            描述: '沉甸甸的灵谷袋，装有一百斤灵谷，需送往膳堂交付清点。',
            视觉描述: '沉甸甸的灵谷袋，装有一百斤灵谷，需送往膳堂交付清点。',
            词条列表: []
        };
        expect(物品规则主体是否弱(灵谷)).toBe(true);
    });

    it('命中名称映射的物品（如“储物袋”）不算弱主体', () => {
        expect(物品规则主体是否弱({ 名称: '储物袋', 类型: '法宝', 品质: '上品' })).toBe(false);
    });

    it('武器类物品不算弱主体', () => {
        expect(物品规则主体是否弱({ 名称: '青锋剑', 类型: '武器', 品质: '精良' })).toBe(false);
    });

    it('英文视觉描述可直接进 prompt 的物品不算弱主体', () => {
        expect(物品规则主体是否弱({
            名称: 'Some Gadget',
            类型: '杂物',
            视觉描述: 'a small round metal device with a glass lens'
        })).toBe(false);
    });

    it('清洗物品英文主体剥离代码围栏/前缀/引号', () => {
        expect(清洗物品英文主体('```\nEnglish: "a heavy drawstring sack full of grain"\n```'))
            .toBe('a heavy drawstring sack full of grain');
    });

    it('清洗物品英文主体丢弃含中文的污染输出', () => {
        expect(清洗物品英文主体('一袋灵谷 a sack of grain')).toBe('');
    });

    it('清洗物品英文主体只保留首段并合并多行', () => {
        expect(清洗物品英文主体('a bronze mirror\nwith jade rim\n\nExtra explanation here'))
            .toBe('a bronze mirror, with jade rim');
    });
});
