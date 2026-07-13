import { describe, expect, it } from 'vitest';
import type { ModeRuntimeProfile } from '../models/system';
import { 获取题材模式配置, 题材模式顺序 } from '../utils/topicModeProfiles';
import { 构建官方模式运行时配置, 规范化模式运行时配置 } from '../utils/modeRuntimeProfile';
import { 是否自定义模式运行时配置, 解析生效题材配置 } from '../utils/effectiveTopicProfile';
import { 获取题材界面文案, 获取题材资源文案, 获取题材档案文案 } from '../utils/resourceLabels';
import { 格式化能力类别 } from '../utils/abilityCategoryLabels';
import { 获取题材关系侧重选项, 获取题材开局配置文案 } from '../utils/openingConfig';
import { 获取题材行情模板 } from '../services/auctionHouse';
import { 构建题材模式提示词 } from '../prompts/runtime/openingConfig';

const 构建红楼运行时配置 = (extra?: Record<string, unknown>): ModeRuntimeProfile => 规范化模式运行时配置({
    identity: {
        modeId: '红楼梦同人',
        displayName: '红楼梦同人模式包',
        baseMode: '武侠',
        isFandomIp: true
    },
    economy: {
        marketName: '当铺牙行',
        marketVerb: '典当或转卖',
        primaryCurrency: '日常交易使用制钱、碎银、银两与金锭。',
        exchangeRules: '底层货币=制钱，中层货币=银两，上层货币=金锭。',
        bannedKeywords: ['灵石', '破境丹', '飞剑法宝']
    },
    organization: {
        organizationName: '门第',
        memberName: '府中人',
        contributionName: '体面',
        organizationAliases: ['门第', '世家', '府邸', '商号'],
        rankNames: ['门外', '依附', '入府', '近前', '掌事', '当家']
    },
    ability: {
        primaryAxis: '族望、门第声望、家宅权柄与才情文名',
        skillPool: ['才情', '应酬', '观人', '手腕', '理事', '谋局'],
        combatResolution: '多数冲突先按身份、礼法、证据与人物意志结算。'
    },
    items: {
        initialItemPool: ['月钱袋', '名帖', '钥匙串'],
        rewardItemPool: ['银钱月例', '衣料首饰', '名帖荐书']
    },
    map: {
        mapPrompt: '地图按天下—省府—州县—府邸—院落—房舍六层组织。'
    },
    npc: {
        defaultIdentityPool: ['老爷', '太太', '奶奶', '姑娘', '丫鬟', '管家']
    },
    ...extra
}, '武侠');

describe('官方模式零回归', () => {
    it('无 runtime 时生效配置与官方配置逐字段一致', () => {
        for (const mode of 题材模式顺序) {
            const official = 获取题材模式配置(mode);
            const effective = 解析生效题材配置(mode, null);
            for (const key of Object.keys(official) as Array<keyof typeof official>) {
                expect(effective[key], `${mode}.${String(key)}`).toEqual(official[key]);
            }
            expect(effective.usesCustomRuntime).toBe(false);
        }
    });

    it('官方生成的 runtime 不触发自定义覆盖', () => {
        for (const mode of 题材模式顺序) {
            const officialRuntime = 构建官方模式运行时配置(mode);
            expect(是否自定义模式运行时配置(officialRuntime, mode)).toBe(false);
            const official = 获取题材模式配置(mode);
            const effective = 解析生效题材配置(mode, officialRuntime);
            expect(effective.label).toBe(official.label);
            expect(effective.auctionName).toBe(official.auctionName);
            expect(effective.worldSizeLabel).toBe(official.worldSizeLabel);
            const 官方界面 = 获取题材界面文案(mode, null);
            const 生效界面 = 获取题材界面文案(mode, officialRuntime);
            expect(生效界面).toEqual(官方界面);
        }
    });

    it('官方武侠行情模板保持不变', () => {
        const templates = 获取题材行情模板('武侠', null);
        expect(templates.some((t) => t.标题.includes('镖道'))).toBe(true);
        const withOfficialRuntime = 获取题材行情模板('武侠', 构建官方模式运行时配置('武侠'));
        expect(withOfficialRuntime).toEqual(templates);
    });
});

describe('自定义 runtime 派生换源', () => {
    const runtime = 构建红楼运行时配置();

    it('识别为自定义 runtime', () => {
        expect(是否自定义模式运行时配置(runtime, '武侠')).toBe(true);
    });

    it('生效题材配置换源到 runtime 字段', () => {
        const effective = 解析生效题材配置('武侠', runtime);
        expect(effective.label).toBe('红楼梦同人模式包');
        expect(effective.auctionName).toBe('当铺牙行');
        expect(effective.marketVerb).toBe('典当或转卖');
        expect(effective.currencyPrompt).toContain('制钱');
        expect(effective.mapPrompt).toContain('府邸');
        expect(effective.skillNames).toEqual(['才情', '应酬', '观人', '手腕', '理事', '谋局']);
        expect(effective.presetItemKeywords).toEqual(['月钱袋', '名帖', '钥匙串']);
        expect(effective.promptLines.join('')).not.toContain('武侠/江湖为核心题材');
        expect(effective.usesCustomRuntime).toBe(true);
    });

    it('界面文案组织段按 runtime 派生', () => {
        const 界面 = 获取题材界面文案('武侠', runtime);
        expect(界面.组织.组织入口).toBe('门第');
        expect(界面.组织.成员名录).toBe('府中人名录');
        expect(界面.组织.贡献).toBe('体面');
        expect(界面.组织.组织实力).toBe('门第实力');
        expect(界面.组织.成员计量).toBe('府中人');
        expect(界面.菜单.sect).toBe('门第');
        expect(界面.菜单.auctionHouse).toBe('当铺牙行');
    });

    it('开局配置文案与关系侧重换源', () => {
        const copy = 获取题材开局配置文案('武侠', runtime);
        expect(copy.organizationTitle).toBe('开局生成门第');
        expect(copy.memberTitle).toBe('开局生成府中人');
        const 关系选项 = 获取题材关系侧重选项('武侠', runtime);
        const 师门项 = 关系选项.find((item) => item.value === '师门');
        expect(师门项?.label).toBe('门第');
    });
});

describe('uiLabels 深覆盖', () => {
    const runtime = 构建红楼运行时配置({
        uiLabels: {
            菜单: { inventory: '随身箱笼', social: '金兰谱', 不存在的键: '应被忽略' },
            标题: { 背包: '随身箱笼', 基础属性: '闺阁根基' },
            组织: { 能力库: '家塾书房' },
            资源: { 分组标题: '身心气色', 能量: '心气' },
            档案: { 档案题头: '府中人物档案' },
            能力类别: { 招式: '才艺章法' },
            向导: { worldSizeLabel: '红楼版图', dynastyLabel: '本朝家国局势' }
        }
    });

    it('uiLabels 覆盖生效且非法键被剥离', () => {
        const 界面 = 获取题材界面文案('武侠', runtime);
        expect(界面.菜单.inventory).toBe('随身箱笼');
        expect(界面.菜单.social).toBe('金兰谱');
        expect((界面.菜单 as Record<string, string>)['不存在的键']).toBeUndefined();
        expect(界面.标题.背包).toBe('随身箱笼');
        expect(界面.标题.基础属性).toBe('闺阁根基');
        expect(界面.组织.能力库).toBe('家塾书房');
        expect(界面.组织.组织入口).toBe('门第');
        expect(界面.标题.装备).toBe(获取题材界面文案('武侠', null).标题.装备);
    });

    it('资源与档案文案覆盖生效', () => {
        const 资源 = 获取题材资源文案('武侠', runtime);
        expect(资源.分组标题).toBe('身心气色');
        expect(资源.能量).toBe('心气');
        expect(资源.气血).toBe('气血');
        expect(资源.能量当前字段).toEqual(['当前内力']);
        const 档案 = 获取题材档案文案('武侠', runtime);
        expect(档案.档案题头).toBe('府中人物档案');
        expect(档案.六维).toBe(获取题材档案文案('武侠', null).六维);
    });

    it('能力类别映射覆盖生效', () => {
        expect(格式化能力类别('招式', '武侠', runtime)).toBe('才艺章法');
        expect(格式化能力类别('招式', '武侠', null)).toBe('武技');
        expect(格式化能力类别('招式', '仙侠', null)).toBe('术式');
    });

    it('向导表单标签覆盖生效', () => {
        const effective = 解析生效题材配置('武侠', runtime);
        expect(effective.worldSizeLabel).toBe('红楼版图');
        expect(effective.dynastyLabel).toBe('本朝家国局势');
        expect(effective.densityLabel).toBe(获取题材模式配置('武侠').densityLabel);
    });
});

describe('拍卖行情贯通', () => {
    it('自定义包未填行情模板时回落题材中性模板', () => {
        const runtime = 构建红楼运行时配置();
        const templates = 获取题材行情模板('武侠', runtime);
        expect(templates.length).toBeGreaterThan(0);
        const joined = templates.map((t) => `${t.标题}${t.描述}`).join('');
        expect(joined).not.toMatch(/镖|宗门|门派|江湖|灵石/);
    });

    it('自定义包填写 marketEventTemplates 时优先使用', () => {
        const runtime = 构建红楼运行时配置({
            economy: {
                marketName: '当铺牙行',
                marketEventTemplates: [
                    { 标题: '节礼采买', 描述: '年节将近，衣料首饰与吃食礼盒行情看涨。', 影响类型: '杂物', 价格倍率: 1.2, 热点标签: '节礼采买' }
                ]
            }
        });
        const templates = 获取题材行情模板('武侠', runtime);
        expect(templates.length).toBe(1);
        expect(templates[0].标题).toBe('节礼采买');
        expect(templates[0].价格倍率).toBeCloseTo(1.2);
    });
});

describe('prompt 泄漏修复', () => {
    it('题材模式提示词在自定义 runtime 下不注入官方武侠词', () => {
        const runtime = 构建红楼运行时配置();
        const prompt = 构建题材模式提示词({ 题材模式: '武侠', modeRuntimeProfile: runtime } as any);
        expect(prompt).toContain('当铺牙行');
        expect(prompt).not.toContain('天下拍卖行');
        expect(prompt).not.toContain('本存档以武侠/江湖为核心题材');
    });

    it('无 runtime 时官方提示词保持原样', () => {
        const prompt = 构建题材模式提示词({ 题材模式: '武侠' } as any);
        expect(prompt).toContain('武侠');
    });
});

describe('审计加固回归', () => {
    it('自定义判定：modeId 非官方值即为自定义（displayName 为空或与官方同名也能识别）', () => {
        const 空名包 = 规范化模式运行时配置({
            identity: { modeId: 'red-mansion', displayName: '', baseMode: '武侠' },
            economy: { marketName: '当铺牙行' }
        }, '武侠');
        expect(是否自定义模式运行时配置(空名包, '武侠')).toBe(true);
        const 同名包 = 规范化模式运行时配置({
            identity: { modeId: 'custom-wuxia-hardcore', displayName: '武侠世界', baseMode: '武侠' }
        }, '武侠');
        expect(是否自定义模式运行时配置(同名包, '武侠')).toBe(true);
    });

    it('自定义判定：官方 runtime 与存档模式暂时不配对时不误判为自定义', () => {
        const 官方仙侠 = 构建官方模式运行时配置('仙侠');
        expect(是否自定义模式运行时配置(官方仙侠, '武侠')).toBe(false);
    });

    it('官方 runtime 不改变关系侧重选项（与无 runtime 输出逐字节一致）', () => {
        for (const mode of 题材模式顺序) {
            const 官方 = 构建官方模式运行时配置(mode);
            expect(获取题材关系侧重选项(mode, 官方)).toEqual(获取题材关系侧重选项(mode));
        }
    });

    it('uiLabels 覆盖剥离原型继承键', () => {
        const runtime = 构建红楼运行时配置({
            uiLabels: { 菜单: { constructor: '异常文案', inventory: '随身箱笼' } }
        });
        const labels = 获取题材界面文案('武侠', runtime);
        expect((labels.菜单 as Record<string, string>).inventory).toBe('随身箱笼');
        expect(Object.prototype.hasOwnProperty.call(labels.菜单, 'constructor')).toBe(false);
    });

    it('密度选项覆盖：仅替换命中的官方选项文案', () => {
        const runtime = 构建红楼运行时配置({
            uiLabels: { 密度选项: { 适中: '适中 (数座府邸)' } }
        });
        const effective = 解析生效题材配置('武侠', runtime);
        const official = 获取题材模式配置('武侠');
        const 适中项 = effective.densityOptions.find((item) => item.value === '适中');
        expect(适中项?.label).toBe('适中 (数座府邸)');
        for (const item of effective.densityOptions) {
            if (item.value === '适中') continue;
            expect(item.label).toBe(official.densityOptions.find((o) => o.value === item.value)?.label);
        }
    });

    it('行情模板规范化：非法影响类型回落全部、数量截断', () => {
        const runtime = 规范化模式运行时配置({
            identity: { modeId: 'stress-pack', displayName: '压力包', baseMode: '武侠' },
            economy: {
                marketEventTemplates: Array.from({ length: 40 }, (_, i) => ({
                    标题: `模板${i}`,
                    描述: `描述${i}`,
                    影响类型: i === 0 ? '<script>' : '全部',
                    价格倍率: 1.1
                }))
            }
        }, '武侠');
        const templates = runtime.economy.marketEventTemplates || [];
        expect(templates.length).toBeLessThanOrEqual(24);
        expect(templates[0]?.影响类型).toBe('全部');
    });

    it('自定义包 promptBoundary 与开局提示词不再泄漏官方组织词', () => {
        const runtime = 构建红楼运行时配置();
        const effective = 解析生效题材配置('武侠', runtime);
        expect(effective.promptBoundary).not.toContain('门派');
        expect(effective.promptBoundary).toContain('门第');
        expect(effective.promptLines.join('\n')).not.toContain('官方基底');
    });

    it('官方模式 promptBoundary 保持原文', () => {
        for (const mode of 题材模式顺序) {
            expect(解析生效题材配置(mode, 构建官方模式运行时配置(mode)).promptBoundary)
                .toBe(获取题材模式配置(mode).promptBoundary);
        }
    });
});
