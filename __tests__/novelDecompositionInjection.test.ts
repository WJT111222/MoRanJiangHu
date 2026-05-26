import { describe, expect, it, vi } from 'vitest';
import type { 小说拆分数据集结构, 接口设置结构 } from '../types';

const 测试数据集: 小说拆分数据集结构 = {
    id: 'dataset-test',
    标题: '测试小说',
    作品名: '测试小说',
    来源类型: 'txt',
    schemaVersion: 9,
    原始文本长度: 100,
    原始文本: '',
    原始文本摘要: '',
    总章节数: 1,
    章节列表: [],
    分段模式: 'single_chapter',
    每批章数: 1,
    默认时间线起点: '0001:01:01:08:00',
    是否识别原著时间线: false,
    激活注入: true,
    当前阶段概括: '',
    核心角色摘要: [],
    核心角色: [],
    角色档案: [],
    势力档案: [],
    地图地点档案: [],
    物品档案: [],
    世界观规则: [],
    世界边界规则: [],
    人物关系: [],
    势力关系: [],
    伏笔线索: [],
    回收点: [],
    章节节奏: [],
    注入树: [],
    分段列表: [{
        id: 'segment-test',
        数据集ID: 'dataset-test',
        组号: 1,
        标题: '第一章',
        章节范围: '第1章',
        章节标题: ['第一章'],
        是否开局组: true,
        起始章序号: 1,
        结束章序号: 1,
        启用注入: true,
        原文内容: '红楼遗梦里，林下风声慢慢穿过旧窗。主角第一次看见那枚玉佩时，灯火忽然暗了一寸。',
        字数: 46,
        原文摘要: '',
        本组概括: '主角在旧宅见到关键玉佩。',
        开局已成立事实: [],
        前组延续事实: [],
        本组结束状态: [],
        给下一组参考: [],
        原著硬约束: [],
        可提前铺垫: [],
        关键事件: [],
        角色推进: [],
        登场角色: [],
        角色档案: [],
        势力档案: [],
        地图地点档案: [],
        物品档案: [],
        世界观规则: [],
        世界边界规则: [],
        人物关系: [],
        势力关系: [],
        伏笔线索: [],
        回收点: [],
        章节节奏: [],
        时间线: [],
        时间线起点: '',
        时间线终点: '',
        处理状态: '已完成',
        最近错误: '',
        createdAt: 1,
        updatedAt: 1
    }],
    createdAt: 1,
    updatedAt: 1
};

vi.mock('../services/novelDecompositionStore', () => ({
    读取小说拆分注入快照列表: vi.fn(async () => []),
    获取当前激活小说拆分数据集: vi.fn(async () => 测试数据集),
    获取小说拆分数据集: vi.fn(async () => 测试数据集)
}));

const 创建设置 = (overrides: Partial<接口设置结构['功能模型占位']> = {}): 接口设置结构 => ({
    activeConfigId: null,
    configs: [],
    功能模型占位: {
        小说拆分功能启用: true,
        小说拆分主剧情注入: true,
        小说拆分规划分析注入: true,
        小说拆分世界演变注入: true,
        小说拆分主剧情保留原文注入: false,
        小说拆分主剧情字数优化: true,
        小说拆分主剧情注入上限: 80,
        小说拆分详细注入上限: 4000,
        ...overrides
    } as 接口设置结构['功能模型占位']
});

describe('novelDecompositionInjection', () => {
    it('keeps original text injection optional for main story', async () => {
        const { 获取激活小说拆分注入文本 } = await import('../services/novelDecompositionInjection');

        const defaultText = await 获取激活小说拆分注入文本(创建设置(), 'main_story');
        expect(defaultText).not.toContain('林下风声慢慢穿过旧窗');

        const originalText = await 获取激活小说拆分注入文本(
            创建设置({ 小说拆分主剧情保留原文注入: true, 小说拆分主剧情注入上限: 2000 }),
            'main_story'
        );
        expect(originalText).toContain('原文节选');
        expect(originalText).toContain('林下风声慢慢穿过旧窗');
    });

    it('allows disabling main story injection length optimization', async () => {
        const { 获取激活小说拆分注入文本 } = await import('../services/novelDecompositionInjection');

        const optimizedText = await 获取激活小说拆分注入文本(
            创建设置({ 小说拆分主剧情保留原文注入: true, 小说拆分主剧情注入上限: 40 }),
            'main_story'
        );
        expect(optimizedText.length).toBeLessThanOrEqual(40);

        const fullText = await 获取激活小说拆分注入文本(
            创建设置({
                小说拆分主剧情保留原文注入: true,
                小说拆分主剧情字数优化: false,
                小说拆分主剧情注入上限: 40
            }),
            'main_story'
        );
        expect(fullText.length).toBeGreaterThan(40);
        expect(fullText).toContain('灯火忽然暗了一寸');
    });
});
