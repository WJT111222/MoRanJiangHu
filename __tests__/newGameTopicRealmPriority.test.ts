import { describe, expect, it } from 'vitest';
import { 选择开局境界体系来源 } from '../hooks/useGame/worldGenerationWorkflow';
import { 构建开局配置提示词, 构建题材模式提示词 } from '../prompts/runtime/openingConfig';
import { 构建开局世界观生成提示词预览 } from '../utils/worldGenerationPromptPreview';
import { 构建官方模式运行时配置, 获取题材顶部时间显示格式 } from '../utils/modeRuntimeProfile';
import { 规范化开局配置 } from '../utils/openingConfig';
import { 创建主题默认世界配置 } from '../utils/workshopEngine';

describe('新开局题材模式与手动境界优先级', () => {
    it('仙侠题材启用开局配置时，手动境界提示词优先于固定仙侠境界', () => {
        const source = 选择开局境界体系来源({
            启用修炼体系: true,
            手动境界提示词: '<境界体系>凡骨境 -> 入道境 -> 星河境</境界体系>',
            是仙侠题材: true,
            启用同人境界: false
        });

        expect(source).toBe('manual');
    });

    it('关闭开局配置时，题材模式仍然保留仙侠货币口径，但不注入开局关系约束', () => {
        const config = 规范化开局配置({
            配置约束启用: false,
            题材模式: '仙侠'
        });

        const topicPrompt = 构建题材模式提示词(config);
        const openingPrompt = 构建开局配置提示词(config);

        expect(topicPrompt).toContain('题材模式：仙侠世界');
        expect(topicPrompt).toContain('下品/中品/上品灵石');
        expect(topicPrompt).not.toContain('金元宝/银子/铜钱');
        expect(openingPrompt).toBe('');
    });

    it('西方奇幻模式包会禁止正文使用东方古法时间词', () => {
        const runtime = 构建官方模式运行时配置('西方奇幻');
        const config = 规范化开局配置({
            配置约束启用: true,
            题材模式: '西方奇幻',
            modeRuntimeProfile: runtime
        });
        const topicPrompt = 构建题材模式提示词(config);

        expect(runtime.time.displayFormat).toBe('western');
        expect(runtime.time.bannedTimeTerms).toContain('时辰');
        expect(topicPrompt).toContain('运行时时间口径');
        expect(topicPrompt).toContain('禁止：时辰');
        expect(topicPrompt).toContain('王国历');
    });

    it('顶部时间显示跟随题材时，西幻走数字显示，武侠保留传统显示', () => {
        expect(获取题材顶部时间显示格式(构建官方模式运行时配置('西方奇幻'), '西方奇幻')).toBe('数字');
        expect(获取题材顶部时间显示格式(构建官方模式运行时配置('武侠'), '武侠')).toBe('传统');
    });

    it('仙侠模式包的世界观生成请求固定注入修真境界并排斥斗气体系', () => {
        const runtime = 构建官方模式运行时配置('仙侠');
        const prompt = 构建开局世界观生成提示词预览({
            worldConfig: {
                ...创建主题默认世界配置('仙侠'),
                worldExtraRequirement: [
                    '境界体系：练气、筑基、金丹、元婴、化神。',
                    '斗气、斗者、斗王、斗皇不得作为本存档境界体系。'
                ].join('\n')
            } as any,
            charData: {
                姓名: '云岫',
                性别: '男',
                年龄: 18,
                出生日期: '1月1日',
                外貌: '青衫少年',
                性格: '沉稳',
                力量: 5,
                敏捷: 5,
                体质: 5,
                根骨: 7,
                悟性: 7,
                福源: 6,
                境界: '炼气一层',
                天赋列表: [],
                出身背景: { 名称: '散修', 描述: '山中修行。', 效果: '根骨略佳。' }
            } as any,
            openingConfig: 规范化开局配置({
                配置约束启用: true,
                题材模式: '仙侠',
                modeRuntimeProfile: runtime
            })
        });

        expect(prompt).toContain('【已固定仙侠境界体系参考】');
        expect(prompt).toContain('炼气一层');
        expect(prompt).toContain('筑基初期');
        expect(prompt).toContain('金丹初期');
        expect(prompt).toContain('元婴初期');
        expect(prompt).toContain('不得使用斗气/斗者/斗师/斗王/斗皇/斗宗/斗尊');
    });
});
