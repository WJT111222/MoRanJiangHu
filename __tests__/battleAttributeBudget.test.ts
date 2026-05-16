import { describe, expect, it } from 'vitest';
import { 规范化战斗状态 } from '../hooks/useGame/storyState';

describe('battle enemy attribute budget', () => {
    it('normalizes enemy six attributes to the same realm budget as player attributes', () => {
        const battle = 规范化战斗状态({
            是否战斗中: true,
            敌方: [
                {
                    名字: '慕容氏精锐水鬼',
                    境界: '聚息境四重',
                    简介: '聚息境四重的精锐水鬼，擅长水下袭杀。',
                    力量: 14,
                    敏捷: 14,
                    体质: 14,
                    根骨: 17,
                    悟性: 4,
                    福源: 0
                }
            ]
        });

        const enemy = battle.敌方[0];
        const total = (enemy.力量 || 0)
            + (enemy.敏捷 || 0)
            + (enemy.体质 || 0)
            + (enemy.根骨 || 0)
            + (enemy.悟性 || 0)
            + (enemy.福源 || 0);

        expect(enemy.境界层级).toBe(8);
        expect(total).toBe(37);
        expect(enemy.根骨).toBeGreaterThanOrEqual(enemy.悟性 || 0);
        expect(Math.max(enemy.力量 || 0, enemy.敏捷 || 0, enemy.体质 || 0, enemy.根骨 || 0)).toBeLessThan(14);
    });
});
