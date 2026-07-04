import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as textAIService from '../services/ai/text';
import { 解析小说拆分分段 } from '../services/novelDecompositionPipeline';
import { 创建空小说拆分数据集 } from '../services/novelDecompositionStore';
import type { 小说拆分分段结构 } from '../types';

vi.mock('../services/ai/text', () => ({
    generateNovelDecomposition: vi.fn()
}));

const 创建分段 = (patch: Partial<小说拆分分段结构>): 小说拆分分段结构 => ({
    id: patch.id || `segment-${patch.组号 || 1}`,
    数据集ID: 'dataset-novel-pipeline',
    组号: patch.组号 || 1,
    标题: patch.标题 || '测试分段',
    章节范围: patch.章节范围 || '第1章',
    章节标题: patch.章节标题 || ['第1章'],
    是否开局组: patch.是否开局组 ?? false,
    起始章序号: patch.起始章序号 || 1,
    结束章序号: patch.结束章序号 || 1,
    启用注入: patch.启用注入 ?? true,
    原文内容: patch.原文内容 || '测试原文',
    字数: patch.字数 || 4,
    原文摘要: patch.原文摘要 || '',
    本组概括: patch.本组概括 || '',
    开局已成立事实: patch.开局已成立事实 || [],
    前组延续事实: patch.前组延续事实 || [],
    本组结束状态: patch.本组结束状态 || [],
    给下一组参考: patch.给下一组参考 || [],
    原著硬约束: patch.原著硬约束 || [],
    可提前铺垫: patch.可提前铺垫 || [],
    关键事件: patch.关键事件 || [],
    角色推进: patch.角色推进 || [],
    登场角色: patch.登场角色 || [],
    角色档案: patch.角色档案 || [],
    势力档案: patch.势力档案 || [],
    地图地点档案: patch.地图地点档案 || [],
    物品档案: patch.物品档案 || [],
    世界观规则: patch.世界观规则 || [],
    世界边界规则: patch.世界边界规则 || [],
    人物关系: patch.人物关系 || [],
    势力关系: patch.势力关系 || [],
    伏笔线索: patch.伏笔线索 || [],
    回收点: patch.回收点 || [],
    章节节奏: patch.章节节奏 || [],
    时间线: patch.时间线 || [],
    时间线起点: patch.时间线起点 || '0001:01:01:00:00',
    时间线终点: patch.时间线终点 || '0001:01:01:00:00',
    处理状态: patch.处理状态 || '待处理',
    最近错误: patch.最近错误 || '',
    createdAt: patch.createdAt || 1,
    updatedAt: patch.updatedAt || 1
});

describe('novelDecompositionPipeline', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('补齐关键事件缺失的最早和最迟开始时间，避免长任务停在同一分段', async () => {
        vi.mocked(textAIService.generateNovelDecomposition).mockResolvedValueOnce({
            groupNumber: 43,
            chapterRange: '谈仙论道-山河大印肖负青天',
            chapterTitles: ['谈仙论道', '山河大印肖负青天'],
            isOpeningGroup: false,
            summary: '青霞门清算之战爆发，局势进入新的转折。',
            openingFacts: [],
            continuationFacts: [],
            endStates: ['青霞门清算结束'],
            nextGroupReferences: [],
            hardConstraints: [],
            foreshadowing: [],
            appearingCharacters: ['叶凡'],
            characterProfiles: [],
            factionProfiles: [],
            locationProfiles: [],
            itemProfiles: [],
            worldRules: [],
            worldBoundaryRules: [],
            characterRelations: [],
            factionRelations: [],
            foreshadowingThreads: [],
            payoffPoints: [],
            chapterRhythm: [],
            timelineStart: '0001:02:12:00:00',
            timelineEnd: '0001:02:13:00:00',
            keyEvents: [{
                事件名: '青霞门清算之战',
                事件说明: '叶凡卷入青霞门清算。',
                开始时间: '0001:02:12:08:00',
                最早开始时间: '',
                最迟开始时间: '',
                结束时间: '0001:02:12:12:00',
                前置条件: ['清算开启'],
                触发条件: ['双方冲突爆发'],
                阻断条件: [],
                事件结果: ['清算告一段落'],
                对下一组影响: [],
                信息可见性: { 谁知道: ['叶凡'], 谁不知道: [], 是否仅读者视角可见: false }
            }],
            characterProgressions: [],
            rawText: ''
        });

        const segment = await 解析小说拆分分段({
            dataset: 创建空小说拆分数据集({
                id: 'dataset-novel-pipeline',
                默认时间线起点: '0001:01:01:00:00'
            }),
            segment: 创建分段({
                组号: 43,
                标题: '谈仙论道 ~ 山河大印肖负青天',
                章节范围: '谈仙论道-山河大印肖负青天'
            }),
            segmentIndex: 42,
            previousTimelineEnd: '0001:02:12:00:00',
            apiConfig: { apiKey: 'test-key' } as any
        });

        expect(segment.处理状态).toBe('已完成');
        expect(segment.关键事件[0]).toMatchObject({
            事件名: '青霞门清算之战',
            开始时间: '0001:02:12:08:00',
            最早开始时间: '0001:02:12:08:00',
            最迟开始时间: '0001:02:12:08:00',
            结束时间: '0001:02:12:12:00'
        });
    });

    it('按真实时间顺序比较四位和五位年份，避免误判两万年早于六千五百年', async () => {
        vi.mocked(textAIService.generateNovelDecomposition).mockResolvedValueOnce({
            groupNumber: 44,
            chapterRange: '一个轮回-两万岁',
            chapterTitles: ['一个轮回', '两万岁'],
            isOpeningGroup: false,
            summary: '叶凡从六千五百年推进到两万年。',
            openingFacts: [],
            continuationFacts: [],
            endStates: ['时代推进到两万年'],
            nextGroupReferences: [],
            hardConstraints: [],
            foreshadowing: [],
            appearingCharacters: ['叶凡'],
            characterProfiles: [],
            factionProfiles: [],
            locationProfiles: [],
            itemProfiles: [],
            worldRules: [],
            worldBoundaryRules: [],
            characterRelations: [],
            factionRelations: [],
            foreshadowingThreads: [],
            payoffPoints: [],
            chapterRhythm: [],
            timelineStart: '6500:01:01:00:00',
            timelineEnd: '20000:01:01:00:00',
            keyEvents: [],
            characterProgressions: [],
            rawText: ''
        });

        const segment = await 解析小说拆分分段({
            dataset: 创建空小说拆分数据集({
                id: 'dataset-novel-pipeline',
                默认时间线起点: '0001:01:01:00:00'
            }),
            segment: 创建分段({
                组号: 44,
                标题: '一个轮回 ~ 两万岁',
                章节范围: '一个轮回-两万岁'
            }),
            segmentIndex: 43,
            previousTimelineEnd: '6500:01:01:00:00',
            apiConfig: { apiKey: 'test-key' } as any
        });

        expect(segment.处理状态).toBe('已完成');
        expect(segment.时间线起点).toBe('6500:01:01:00:00');
        expect(segment.时间线终点).toBe('20000:01:01:00:00');
    });
});
