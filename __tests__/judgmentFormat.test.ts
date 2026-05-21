import { describe, expect, it } from 'vitest';
import { 提取判定日志前缀, 是否判定日志文本 } from '../utils/judgmentFormat';

describe('judgment log detection', () => {
    it('recognizes custom bracketed judgment categories with score and result fields', () => {
        const line = '【参悟】温习青木诀｜触发对象 玩家:杨培强｜判定值 14/难度 8｜基础 B(+10,悟性与根骨资质)｜环境 E(+2,静室与凝神香辅助)｜状态 S(+1,精力饱满)｜幸运 L(+1)｜结果=成功';

        expect(是否判定日志文本(line)).toBe(true);
        expect(提取判定日志前缀(line)).toBe('【参悟】');
    });

    it('does not treat ordinary bracketed narration as a judgment card', () => {
        expect(是否判定日志文本('【青木诀】书页泛起淡淡青光，屋内香烟袅袅。')).toBe(false);
    });
});
