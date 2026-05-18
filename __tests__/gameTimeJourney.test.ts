import { describe, expect, it } from 'vitest';
import { 计算游戏历程天数 } from '../utils/gameTimeJourney';

describe('游戏历程天数', () => {
    it('跨过游戏内日期后立即进入第二天', () => {
        expect(计算游戏历程天数(
            { year: 342, month: 5, day: 9, hour: 2, minute: 30 },
            { year: 342, month: 5, day: 8, hour: 23, minute: 0 }
        )).toBe(2);
    });

    it('同一游戏日期内仍显示第一天', () => {
        expect(计算游戏历程天数(
            { year: 342, month: 5, day: 8, hour: 23, minute: 50 },
            { year: 342, month: 5, day: 8, hour: 23, minute: 0 }
        )).toBe(1);
    });

    it('间隔多日时按游戏日期累计', () => {
        expect(计算游戏历程天数(
            { year: 342, month: 5, day: 12, hour: 1, minute: 0 },
            { year: 342, month: 5, day: 8, hour: 23, minute: 0 }
        )).toBe(5);
    });
});
