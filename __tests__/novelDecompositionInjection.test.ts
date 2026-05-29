import { describe, expect, it, vi } from 'vitest';
import type { 小说拆分数据集结构, 接口设置结构, OpeningConfig } from '../types';

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

const 创建启用附加小说开局配置 = (overrides: Partial<OpeningConfig['同人融合']> = {}): OpeningConfig => ({
    题材模式: '传统武侠',
    叙事人称: '第二人称',
    女主模式: '多女主',
    同人融合: {
        enabled: true,
        作品名: '测试小说',
        来源类型: '小说',
        融合强度: '中度混编',
        开局切入偏好: '',
        关系侧重: '',
        保留原著角色: true,
        启用角色替换: false,
        替换目标角色名: '',
        附加替换角色名列表: [],
        附加角色替换规则列表: [],
        启用附加小说: true,
        附加小说数据集ID: 'dataset-test',
        ...overrides
    }
} as OpeningConfig);

describe('novelDecompositionInjection', () => {
    it('keeps original text injection optional for main story', async () => {
        const { 获取激活小说拆分注入文本 } = await import('../services/novelDecompositionInjection');

        const defaultText = await 获取激活小说拆分注入文本(创建设置(), 'main_story', 创建启用附加小说开局配置());
        expect(defaultText).not.toContain('林下风声慢慢穿过旧窗');

        const originalText = await 获取激活小说拆分注入文本(
            创建设置({ 小说拆分主剧情保留原文注入: true, 小说拆分主剧情注入上限: 2000 }),
            'main_story',
            创建启用附加小说开局配置()
        );
        expect(originalText).toContain('原文节选');
        expect(originalText).toContain('林下风声慢慢穿过旧窗');
    });

    it('allows disabling main story injection length optimization', async () => {
        const { 获取激活小说拆分注入文本 } = await import('../services/novelDecompositionInjection');

        const optimizedText = await 获取激活小说拆分注入文本(
            创建设置({ 小说拆分主剧情保留原文注入: true, 小说拆分主剧情注入上限: 40 }),
            'main_story',
            创建启用附加小说开局配置()
        );
        expect(optimizedText.length).toBeLessThanOrEqual(40);

        const fullText = await 获取激活小说拆分注入文本(
            创建设置({
                小说拆分主剧情保留原文注入: true,
                小说拆分主剧情字数优化: false,
                小说拆分主剧情注入上限: 40
            }),
            'main_story',
            创建启用附加小说开局配置()
        );
        expect(fullText.length).toBeGreaterThan(40);
        expect(fullText).toContain('灯火忽然暗了一寸');
    });

    it('does not fall back to globally active dataset when additional novel is disabled', async () => {
        const { 获取激活小说拆分注入文本 } = await import('../services/novelDecompositionInjection');

        await expect(获取激活小说拆分注入文本(
            创建设置({ 小说拆分主剧情保留原文注入: true }),
            'main_story',
            创建启用附加小说开局配置({ enabled: false, 启用附加小说: false, 附加小说数据集ID: '' })
        )).resolves.toBe('');

        await expect(获取激活小说拆分注入文本(
            创建设置({ 小说拆分主剧情保留原文注入: true }),
            'main_story',
            创建启用附加小说开局配置({ 启用附加小说: false, 附加小说数据集ID: '' })
        )).resolves.toBe('');
    });
});
