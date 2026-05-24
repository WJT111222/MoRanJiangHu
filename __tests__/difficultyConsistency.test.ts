import { describe, expect, it } from 'vitest';
import { 难度_判定 } from '../prompts/difficulty/check';
import { 难度_游戏 } from '../prompts/difficulty/game';
import { 难度设定表 } from '../utils/openingConfig';

describe('难度判定修正一致性', () => {
    it('uses the new-game wizard correction values in game and check prompts', () => {
        const expected = {
            relaxed: 3,
            easy: 1,
            normal: 0,
            hard: -1,
            extreme: -3
        };

        Object.entries(expected).forEach(([difficulty, correction]) => {
            expect((难度设定表 as any)[difficulty].判定修正).toBe(correction);

            const display = correction >= 0 ? `+${correction}` : String(correction);
            const gamePrompt = 难度_游戏.find((item) => item.id === `diff_game_${difficulty}`)?.内容 || '';
            const checkPrompt = 难度_判定.find((item) => item.id === `diff_check_${difficulty}`)?.内容 || '';

            expect(gamePrompt).toContain(`玩家判定修正：${display}`);
            expect(checkPrompt).toContain(`玩家判定 ${display}`);
            const difficultyOffset = -correction;
            const difficultyOffsetDisplay = difficultyOffset >= 0 ? `+${difficultyOffset}` : String(difficultyOffset);
            expect(checkPrompt).toContain(`难度偏置：${difficultyOffsetDisplay}`);
        });
    });
});
