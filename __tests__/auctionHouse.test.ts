import { describe, expect, it } from 'vitest';
import { 创建默认拍卖行状态, 清理并补货 } from '../services/auctionHouse';

describe('拍卖行默认补货', () => {
    it('默认拍卖行状态会生成在售拍品和行情', () => {
        const state = 创建默认拍卖行状态();

        expect(state.行情列表.length).toBeGreaterThan(0);
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中').length).toBeGreaterThanOrEqual(12);
        expect(state.最近补货时间).toBeGreaterThan(0);
    });

    it('清理空拍卖行时自动补齐系统拍品', () => {
        const state = 清理并补货({
            拍卖品列表: [],
            交易记录: [],
            最近补货时间: 0,
            行情列表: [],
            最近行情时间: 0
        });

        expect(state.拍卖品列表.some((entry) => entry.卖家ID.startsWith('system_'))).toBe(true);
        expect(state.拍卖品列表.filter((entry) => entry.状态 === '上架中')).not.toHaveLength(0);
    });
});
