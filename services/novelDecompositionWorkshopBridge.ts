import type { 创意工坊模块条目 } from '../data/creativeWorkshopModules';
import type { ModeRuntimeProfile, 世界书条目结构, 世界书作用域, 世界书结构, 小说拆分数据集结构, 题材模式类型 } from '../types';
import { 构建官方模式运行时配置, 规范化模式运行时配置, 渲染模式运行时配置世界书内容 } from '../utils/modeRuntimeProfile';
import { 构建小说拆分跨世界时间线规则, 小说拆分疑似跨世界题材 } from './novelDecompositionTimelineConstraints';

const 全流程模式世界书作用域: 世界书作用域[] = ['main', 'opening', 'world_evolution', 'variable_calibration', 'story_plan', 'heroine_plan', 'tavern'];

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const 生成安全ID片段 = (value: string): string => (
    (value || 'novel')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/giu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)
        || 'novel'
);

const 去重文本列表 = (items: string[], maxCount = 40): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of items) {
        const normalized = 读取文本(raw).replace(/\s+/g, ' ');
        if (!normalized || normalized === '无') continue;
        const key = normalized.replace(/\s+/g, '');
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(normalized);
        if (result.length >= maxCount) break;
    }
    return result;
};

const 格式化列表 = (title: string, items: string[], maxCount = 24): string => {
    const lines = 去重文本列表(items, maxCount);
    if (lines.length <= 0) return '';
    return [`【${title}】`, ...lines.map((line) => `- ${line}`)].join('\n');
};

const 格式化角色档案 = (dataset: 小说拆分数据集结构): string[] => (
    (Array.isArray(dataset.角色档案) ? dataset.角色档案 : [])
        .map((item) => [
            item.名称,
            item.身份 ? `身份=${item.身份}` : '',
            item.所属势力 ? `势力=${item.所属势力}` : '',
            item.初始立场 ? `立场=${item.初始立场}` : '',
            item.状态摘要?.length ? `状态=${item.状态摘要.join('；')}` : '',
            item.首次出现 ? `首次出现=${item.首次出现}` : ''
        ].filter(Boolean).join('；'))
        .filter(Boolean)
);

const 格式化势力档案 = (dataset: 小说拆分数据集结构): string[] => (
    (Array.isArray(dataset.势力档案) ? dataset.势力档案 : [])
        .map((item) => [
            item.名称,
            item.类型 ? `类型=${item.类型}` : '',
            item.地盘 ? `地盘=${item.地盘}` : '',
            item.当前状态 ? `状态=${item.当前状态}` : '',
            item.立场目标 ? `目标=${item.立场目标}` : '',
            item.首次出现 ? `首次出现=${item.首次出现}` : ''
        ].filter(Boolean).join('；'))
        .filter(Boolean)
);

const 格式化地点档案 = (dataset: 小说拆分数据集结构): string[] => (
    (Array.isArray(dataset.地图地点档案) ? dataset.地图地点档案 : [])
        .map((item) => [
            item.名称,
            item.层级 ? `层级=${item.层级}` : '',
            item.上级地点 ? `上级=${item.上级地点}` : '',
            item.所属势力 ? `所属=${item.所属势力}` : '',
            item.地貌功能 ? `功能=${item.地貌功能}` : '',
            item.首次出现 ? `首次出现=${item.首次出现}` : ''
        ].filter(Boolean).join('；'))
        .filter(Boolean)
);

const 格式化物品档案 = (dataset: 小说拆分数据集结构): string[] => (
    (Array.isArray(dataset.物品档案) ? dataset.物品档案 : [])
        .map((item) => [
            item.名称,
            item.类型 ? `类型=${item.类型}` : '',
            item.用途 ? `用途=${item.用途}` : '',
            item.所属人物 ? `人物=${item.所属人物}` : '',
            item.所属势力 ? `势力=${item.所属势力}` : '',
            item.首次出现 ? `首次出现=${item.首次出现}` : ''
        ].filter(Boolean).join('；'))
        .filter(Boolean)
);

const 格式化原著硬约束 = (dataset: 小说拆分数据集结构): string[] => (
    (Array.isArray(dataset.分段列表) ? dataset.分段列表 : [])
        .flatMap((segment) => (Array.isArray(segment.原著硬约束) ? segment.原著硬约束 : [])
            .map((item) => item?.内容 || '')
        )
);

const 格式化分段时间线 = (dataset: 小说拆分数据集结构): string[] => (
    (Array.isArray(dataset.分段列表) ? dataset.分段列表 : [])
        .filter((segment) => segment.处理状态 === '已完成')
        .map((segment) => {
            const title = segment.章节范围 || segment.标题 || `第${segment.组号}组`;
            const range = `${segment.时间线起点 || '未知'} -> ${segment.时间线终点 || '未知'}`;
            const events = (segment.关键事件 || []).slice(0, 4).map((event) => `${event.事件名 || '事件'}@${event.开始时间 || segment.时间线起点 || '未知'}`).join('；');
            return `${title}：${range}${events ? `；关键事件=${events}` : ''}`;
        })
);

const 推断题材模式 = (dataset: 小说拆分数据集结构): 题材模式类型 => {
    const text = [
        dataset.标题,
        dataset.作品名,
        dataset.原始文本摘要,
        dataset.当前阶段概括,
        ...(dataset.世界观规则 || []),
        ...(dataset.世界边界规则 || []),
        ...(dataset.分段列表 || []).flatMap((segment) => [
            segment.标题,
            segment.本组概括,
            ...(segment.世界观规则 || []),
            ...(segment.世界边界规则 || []),
            ...(segment.关键事件 || []).flatMap((event) => [event.事件名, event.事件说明])
        ])
    ].map(读取文本).join('\n');

    if (小说拆分疑似跨世界题材(dataset) || /(无限流|主神|轮回|副本|任务世界|剧情世界)/u.test(text)) return '无限流';
    if (/(丧尸|末日|感染|避难所|灾变)/u.test(text)) return '末日丧尸';
    if (/(修仙|仙门|灵气|金丹|筑基|元婴|宗门)/u.test(text)) return '仙侠';
    if (/(魔法|骑士|王国|教会|地下城|冒险者公会)/u.test(text)) return '西方奇幻';
    if (/(都市|现代|公司|学校|手机|网络|医院|写字楼|Z市)/iu.test(text)) return '现代都市';
    return '武侠';
};

const 构建模式世界书条目 = (
    id: string,
    标题: string,
    内容: string,
    类型: 世界书条目结构['类型'],
    优先级: number
): 世界书条目结构 => ({
    id,
    标题,
    内容: 内容.trim(),
    条目形态: 'normal',
    类型,
    作用域: 全流程模式世界书作用域,
    注入模式: 'always',
    关键词: [],
    优先级,
    启用: true,
    创建时间: 0,
    更新时间: 0
});

const 构建模式元数据内容 = (dataset: 小说拆分数据集结构, profile: ModeRuntimeProfile): string => [
    `来源作品：${dataset.作品名 || dataset.标题 || '未命名作品'}`,
    `基础题材：${profile.identity.baseMode}`,
    `同人/IP模式：是`,
    `章节数：${dataset.总章节数 || dataset.章节列表?.length || 0}`,
    `分解组数：${dataset.分段列表?.length || 0}`,
    `默认时间线起点：${dataset.默认时间线起点 || '0001:01:01:00:00'}`,
    '用途：由小说分解工作台生成，可在新建同人存档时作为完整模式包套用。'
].join('\n');

export const 构建小说拆分模式包创意工坊模块 = (params: {
    dataset: 小说拆分数据集结构;
    contributor?: string;
    baseMode?: 题材模式类型;
    now?: number;
}): 创意工坊模块条目 => {
    const dataset = params.dataset;
    const now = params.now || Date.now();
    const iso = new Date(now).toISOString();
    const workName = dataset.作品名 || dataset.标题 || '未命名小说';
    const baseMode = params.baseMode || 推断题材模式(dataset);
    const suiteId = `novel-${生成安全ID片段(workName)}-${now}`;
    const suiteTitle = `${workName}同人模式包`;
    const crossWorldRules = 构建小说拆分跨世界时间线规则(dataset);
    const officialProfile = 构建官方模式运行时配置(baseMode);
    const modeRuntimeProfile = 规范化模式运行时配置({
        ...officialProfile,
        identity: {
            ...officialProfile.identity,
            modeId: suiteId,
            displayName: suiteTitle,
            baseMode,
            isFandomIp: true
        },
        time: {
            ...officialProfile.time,
            narrativeStyle: [
                officialProfile.time.narrativeStyle,
                crossWorldRules.length > 0
                    ? '同人小说分解模式包已启用跨世界时间线硬约束：主世界/主神空间时间、任务世界本地时间、进入离开事件和世界流速必须分开判断。'
                    : '同人小说分解模式包会优先遵守原著时间线锚点，不得按章节距离自行压缩时间。'
            ].join('\n'),
            progressionPrompt: [
                officialProfile.time.progressionPrompt,
                '若小说分解世界书给出原著时间线或时间流速证据，剧情推进必须先贴住该证据，再处理玩家偏转。'
            ].join('\n')
        },
        validation: {
            ...officialProfile.validation,
            conflictChecks: 去重文本列表([
                ...officialProfile.validation.conflictChecks,
                '同一任务世界两次进入间隔冲突',
                '不同世界时间流速冲突',
                '时代标签叠加冲突',
                '原著势力出场年代冲突'
            ], 16)
        }
    }, baseMode);

    const topicBody = [
        `本模式包来自小说分解工作台，来源作品为《${workName}》。`,
        dataset.当前阶段概括 ? `当前阶段概括：${dataset.当前阶段概括}` : '',
        格式化列表('核心角色', dataset.核心角色?.length ? dataset.核心角色 : dataset.核心角色摘要 || [], 16),
        格式化列表('角色档案', 格式化角色档案(dataset), 32),
        格式化列表('地图地点档案', 格式化地点档案(dataset), 32),
        '使用口径：新建同人存档时，开局、规划、世界演变必须优先承接小说分解资产中已成立的原著事实；玩家偏转只能发生在不违背硬约束的空间内。'
    ].filter(Boolean).join('\n\n');

    const worldRulesBody = [
        格式化列表('世界观规则', dataset.世界观规则 || [], 32),
        格式化列表('世界边界规则', dataset.世界边界规则 || [], 32),
        格式化列表('原著硬约束', 格式化原著硬约束(dataset), 40),
        格式化列表('势力档案', 格式化势力档案(dataset), 32),
        格式化列表('人物关系', dataset.人物关系 || [], 24),
        格式化列表('势力关系', dataset.势力关系 || [], 24),
        格式化列表('伏笔线索', dataset.伏笔线索 || [], 24),
        格式化列表('回收点', dataset.回收点 || [], 24)
    ].filter(Boolean).join('\n\n') || '沿用原著已经分解出的世界观、势力、地点和硬约束；未在原文成立的内容不得擅自补完为事实。';

    const abilityBody = [
        `基础题材能力口径：${modeRuntimeProfile.ability.primaryAxis}`,
        `成长阶段：${modeRuntimeProfile.ability.progressionNames.join('、')}`,
        `结算规则：${modeRuntimeProfile.ability.combatResolution}`,
        格式化列表('物品档案', 格式化物品档案(dataset), 32),
        格式化列表('章节节奏', dataset.章节节奏 || [], 18)
    ].filter(Boolean).join('\n\n');

    const timelineBody = [
        格式化列表('跨世界时间线硬约束', crossWorldRules, 18),
        格式化列表('分解组时间线', 格式化分段时间线(dataset), 40)
    ].filter(Boolean).join('\n\n') || '原著时间线未给出跨世界证据时，仍需按分解组时间线保守推进，不得抢跑未来事件。';

    const modeWorldbooks: 世界书结构[] = [{
        id: `${suiteId}-worldbook`,
        标题: `${suiteTitle}世界书`,
        描述: '由小说分解工作台生成的同人模式世界书；用于统一注入原著口径、世界规则、能力体系和时间线硬约束。',
        常驻大纲: `来源《${workName}》；开局、规划、世界演变需遵守原著分解资产。`,
        启用: true,
        内置: false,
        创建时间: now,
        更新时间: now,
        条目: [
            构建模式世界书条目(`${suiteId}-metadata`, '模式元数据', 构建模式元数据内容(dataset, modeRuntimeProfile), 'system_rule', 106),
            构建模式世界书条目(`${suiteId}-runtime-profile`, '运行时模式配置', 渲染模式运行时配置世界书内容(modeRuntimeProfile), 'system_rule', 105),
            构建模式世界书条目(`${suiteId}-topic`, '小说题材口径', topicBody, 'world_lore', 100),
            构建模式世界书条目(`${suiteId}-world-rules`, '原著世界规则', worldRulesBody, 'system_rule', 96),
            构建模式世界书条目(`${suiteId}-timeline`, '跨世界时间线硬约束', timelineBody, 'system_rule', 98),
            构建模式世界书条目(`${suiteId}-ability`, '能力体系与物品口径', abilityBody, 'system_rule', 90)
        ].filter((entry) => entry.内容)
    }];

    const contentBlocks: NonNullable<创意工坊模块条目['contentBlocks']> = [
        {
            id: 'topic-main',
            title: '小说题材口径',
            purpose: '注入手动世界观提示词，定义来源作品、角色地点、开局承接和同人口径。',
            injectionTarget: 'manualWorldPrompt',
            content: topicBody
        },
        {
            id: 'world-rules-main',
            title: '原著世界规则',
            purpose: '追加到世界观细化要求，约束世界规则、势力状态、关系、伏笔和原著边界。',
            injectionTarget: 'worldExtraRequirement',
            content: worldRulesBody
        },
        {
            id: 'ability-main',
            title: '能力体系与物品口径',
            purpose: '注入手动能力/境界提示词，约束成长体系、战力边界、物品和章节节奏。',
            injectionTarget: 'manualRealmPrompt',
            content: abilityBody
        },
        {
            id: 'timeline-main',
            title: '跨世界时间线硬约束',
            purpose: '作为模式世界书强制注入，避免不同世界时间流速、时代标签和两次进入间隔被混淆。',
            injectionTarget: 'worldExtraRequirement',
            content: timelineBody
        }
    ];

    const content = contentBlocks.map((block) => [`【${block.title}】`, block.content].join('\n')).join('\n\n');
    const tags = 去重文本列表([baseMode, '小说分解', '同人模式包', '模式包', crossWorldRules.length > 0 ? '跨世界时间线' : '', dataset.来源类型], 12);
    const safetyNotes = [
        '该模式包由小说分解结果自动生成，发布前建议复核作品名、时间线、角色档案和势力档案。',
        '跨世界/无限流作品必须确认主世界时间、任务世界本地时间、进入离开事件和世界流速没有被混写。'
    ];

    return {
        id: `local-${suiteId}-mode-package`,
        type: 'topic',
        formatVersion: 2,
        workshopKind: 'standard_module',
        title: suiteTitle,
        subtitle: `${baseMode} · 小说分解同人模式包`,
        description: `由《${workName}》小说分解数据集生成的同人模式包，包含模式世界书、原著规则、能力体系和时间线硬约束。`,
        tags,
        payload: {
            schema: 'moranjianghu-creative-workshop-mode-package',
            version: 3,
            suiteId,
            suiteTitle,
            packagePart: 'mode_package',
            mode: baseMode,
            sourceDatasetId: dataset.id,
            sourceWorkName: workName,
            modeMetadata: {
                value: baseMode,
                label: baseMode,
                shortLabel: baseMode,
                group: baseMode === '无限流' ? 'infinite' : undefined,
                source: 'novel_decomposition'
            },
            modeRuntimeProfile,
            modeWorldbooks,
            manualWorldPrompt: topicBody,
            worldExtraRequirement: [worldRulesBody, timelineBody].filter(Boolean).join('\n\n'),
            manualRealmPrompt: abilityBody,
            content,
            contentBlocks,
            usagePrompt: '作为完整模式包注入新建同人存档：模式专属世界书会统一接管来源作品口径、世界规则、能力体系和跨世界时间线硬约束。',
            safetyNotes
        },
        modeWorldbooks,
        modeRuntimeProfile,
        contentBlocks,
        usagePrompt: '作为完整模式包注入新建同人存档；建议先在创意工坊预览模式世界书，再用于新开局。',
        safetyNotes,
        injectionPreview: [
            `完整模式包：${suiteTitle}`,
            `适用题材：${baseMode}`,
            `模式世界书：${modeWorldbooks[0]?.条目.length || 0} 条`,
            `章节/分段：${dataset.总章节数 || dataset.章节列表?.length || 0} / ${dataset.分段列表?.length || 0}`,
            `跨世界时间线：${crossWorldRules.length > 0 ? '已生成硬约束' : '未识别到跨世界证据，按原著时间线保守推进'}`,
            `题材口径：${topicBody.slice(0, 140)}`,
            `世界规则：${worldRulesBody.slice(0, 140)}`,
            `时间线：${timelineBody.slice(0, 140)}`
        ],
        source: 'local',
        contributor: params.contributor || '',
        createdAt: iso,
        updatedAt: iso
    };
};
