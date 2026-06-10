import { describe, expect, it } from 'vitest';
import { 解析世界观生成结果 } from '../services/ai/storyTasks';

describe('世界观生成解析', () => {
    it('accepts Chinese JSON world prompt fields when model omits tags', () => {
        const result = 解析世界观生成结果(JSON.stringify({
            世界观: '莱茵大陆由王国、自由城邦与冒险者公会共同维持秩序。魔法来源于星辉矿脉，骑士团负责边境防务，地下城与古代遗迹是长期风险和资源来源。'
        }));

        expect(result.worldPrompt).toContain('莱茵大陆');
    });

    it('accepts a markdown-style world prompt block after thinking text', () => {
        const result = 解析世界观生成结果([
            '<thinking>先确认题材和边界。</thinking>',
            '## 世界观',
            '灰塔王国位于北境山脉与南方商路之间。魔法学院、公会、教会和边境骑士团互相制衡，铜币、银币与金币构成日常交易体系，魔物潮和遗迹复苏会持续推动冒险。'
        ].join('\n'));

        expect(result.worldPrompt).toContain('灰塔王国');
        expect(result.worldPrompt).not.toContain('thinking');
    });
});
