import { describe, expect, it } from 'vitest';
import { 创建空门派状态, 创建开场基础状态, 创建开场命令基态, 规范化门派状态, 是否无门派标识, 保护开局生成门派状态 } from '../hooks/useGame/storyState';

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

    it('家族门派默认同门使用家族姓氏', () => {
        const normalized = 规范化门派状态({
            ID: 'Org001',
            名称: '杨家堡',
            玩家职位: '少主'
        });

        expect(normalized.重要成员.length).toBeGreaterThanOrEqual(6);
        expect(normalized.重要成员.every((member: any) => String(member?.姓名 || '').startsWith('杨'))).toBe(true);
    });

    it('已有少量门派成员时仍补齐默认同门', () => {
        const normalized = 规范化门派状态({
            ID: 'Org001',
            名称: '杨家堡',
            玩家职位: '少主',
            重要成员: [{ id: 'NPC002', 姓名: '杨震', 性别: '男', 年龄: 48, 身份: '堡主' }]
        });

        expect(normalized.重要成员.length).toBeGreaterThanOrEqual(6);
        expect(normalized.重要成员.filter((member: any) => member?.姓名 === '杨震')).toHaveLength(1);
        expect(normalized.重要成员.every((member: any) => String(member?.姓名 || '').startsWith('杨'))).toBe(true);
    });

    it('开局命令基态会保留已选择生成的门派和同门', () => {
        const openingBase = 创建开场基础状态(
            {
                姓名: '沈墨',
                所属门派ID: '玄墨派',
                门派职位: '外门弟子',
                门派贡献: 100
            } as any,
            {} as any,
            {
                初始关系模板: '师门牵引',
                关系侧重: ['师门'],
                开局切入偏好: '门派起手',
                开局生成门派: true,
                开局生成同门: true,
                同人融合: {
                    enabled: false,
                    作品名: '',
                    来源类型: '原创',
                    融合强度: '轻度',
                    保留原著角色: false,
                    启用角色替换: false,
                    替换目标角色名: '',
                    附加替换角色名列表: [],
                    附加角色替换规则列表: [],
                    启用附加小说: false,
                    附加小说数据集ID: ''
                }
            } as any
        );
        const commandBase = 创建开场命令基态(openingBase);

        expect(commandBase.玩家门派.名称).toBe('玄墨派');
        expect(commandBase.玩家门派.玩家职位).toBe('外门弟子');
        expect(commandBase.玩家门派.重要成员.length).toBeGreaterThanOrEqual(6);
    });

    it('开局门派贡献足够时自动学习当前最好的可学功法', () => {
        const openingBase = 创建开场基础状态(
            {
                姓名: '杨培强',
                所属门派ID: '杨家堡',
                门派职位: '少主',
                门派贡献: 500,
                当前内力: 30,
                最大内力: 30,
                境界: '开脉境三重',
                境界层级: 3,
                功法列表: []
            } as any,
            {} as any,
            {
                开局生成门派: true,
                开局生成同门: true
            } as any
        );

        expect(openingBase.角色.功法列表[0]?.名称).toBe('踏云步');
        expect(openingBase.角色.功法列表[0]?.来源).toBe('杨家堡藏经阁');
    });

    it('无门派但已有修炼事实时补基础功法', () => {
        const openingBase = 创建开场基础状态(
            {
                姓名: '散修',
                所属门派ID: 'none',
                门派职位: '无',
                门派贡献: 0,
                当前内力: 12,
                最大内力: 12,
                境界: '开脉境一重',
                境界层级: 1,
                功法列表: []
            } as any,
            {} as any,
            {
                开局生成门派: false,
                开局生成同门: false
            } as any
        );

        expect(openingBase.玩家门派.名称).toBe('无门无派');
        expect(openingBase.角色.功法列表[0]?.名称).toBe('基础吐纳诀');
    });

    it('明确凡人无门派时不开局补功法', () => {
        const openingBase = 创建开场基础状态(
            {
                姓名: '凡人',
                所属门派ID: 'none',
                门派职位: '无',
                门派贡献: 0,
                当前内力: 0,
                最大内力: 0,
                境界: '未入境',
                境界层级: 0,
                功法列表: []
            } as any,
            {} as any,
            {
                开局生成门派: false,
                开局生成同门: false
            } as any
        );

        expect(openingBase.角色.功法列表).toEqual([]);
    });

    it('开局生成门派不会被模型命令覆盖回无门无派', () => {
        const base = 创建开场命令基态(创建开场基础状态(
            {
                姓名: '沈墨',
                所属门派ID: '玄墨派',
                门派职位: '外门弟子',
                门派贡献: 100
            } as any,
            {} as any,
            {
                初始关系模板: '师门牵引',
                关系侧重: ['师门'],
                开局切入偏好: '门派起手',
                开局生成门派: true,
                开局生成同门: true
            } as any
        ));

        const protectedState = 保护开局生成门派状态({
            ...base,
            角色: { ...base.角色, 所属门派ID: 'none', 门派职位: '无', 门派贡献: 0 },
            玩家门派: { ID: 'none', 名称: '无门无派', 玩家职位: '无' }
        }, base, { 开局生成门派: true } as any);

        expect(protectedState.玩家门派.名称).toBe('玄墨派');
        expect(protectedState.玩家门派.重要成员.length).toBeGreaterThanOrEqual(6);
        expect(protectedState.角色.所属门派ID).toBe('玄墨派');
        expect(protectedState.角色.门派职位).toBe('外门弟子');
    });
});
