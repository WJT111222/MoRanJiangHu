import { describe, expect, it } from 'vitest';
import {
    属性最大值,
    属性最小值,
    属性键列表,
    创建平均属性分配,
    创建随机属性分配,
    计算属性总点数,
    获取难度总属性点
} from '../utils/openingConfig';

const expectValidAllocation = (allocation: Record<string, number>, totalBudget: number) => {
    expect(计算属性总点数(allocation as any)).toBe(totalBudget);
    for (const key of 属性键列表) {
        expect(allocation[key], key).toBeGreaterThanOrEqual(属性最小值);
        expect(allocation[key], key).toBeLessThanOrEqual(属性最大值);
    }
};

describe('opening attribute allocation', () => {
    it('平均分配会用满当前难度点数且不越界', () => {
        for (const difficulty of ['relaxed', 'easy', 'normal', 'hard', 'extreme'] as const) {
            const totalBudget = 获取难度总属性点(difficulty);
            expectValidAllocation(创建平均属性分配(totalBudget), totalBudget);
        }
    });

    it('随机分配会用满当前难度点数且不越界', () => {
        let seed = 0;
        const deterministicRandom = () => {
            seed = (seed + 3) % 11;
            return seed / 11;
        };
        for (const difficulty of ['relaxed', 'easy', 'normal', 'hard', 'extreme'] as const) {
            const totalBudget = 获取难度总属性点(difficulty);
            expectValidAllocation(创建随机属性分配(totalBudget, deterministicRandom), totalBudget);
        }
    });
});
