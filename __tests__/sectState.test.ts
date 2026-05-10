import { describe, expect, it } from 'vitest';
import { 创建空门派状态, 规范化门派状态, 是否无门派标识 } from '../hooks/useGame/storyState';

describe('门派状态规范化', () => {
    it('无门派语义不会补默认同门', () => {
        const normalized = 规范化门派状态({
            ID: 'none',
            名称: '无门无派',
            玩家职位: '无',
            重要成员: [{ 姓名: '误生成的师兄' }],
            任务列表: [{ 标题: '误生成的门派任务' }]
        });

        expect(normalized).toEqual(创建空门派状态());
    });

    it('明确无门派标识会压过模型虚构的门派名称', () => {
        const normalized = 规范化门派状态({
            ID: 'none',
            名称: '青云山庄',
            玩家职位: '无'
        });

        expect(normalized.ID).toBe('none');
        expect(normalized.名称).toBe('无门无派');
        expect(normalized.重要成员).toEqual([]);
    });

    it('有效门派仍可补齐可用默认结构', () => {
        const normalized = 规范化门派状态({
            ID: 'sect_qingyun',
            名称: '青云山庄',
            玩家职位: '外门弟子'
        });

        expect(normalized.ID).toBe('sect_qingyun');
        expect(normalized.重要成员.length).toBeGreaterThan(0);
        expect(是否无门派标识(normalized.ID)).toBe(false);
    });
});
