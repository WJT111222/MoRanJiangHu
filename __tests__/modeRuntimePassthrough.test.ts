import { describe, expect, it } from 'vitest';
import type { ModeRuntimeProfile } from '../models/system';
import { 获取题材模式配置, 题材模式顺序 } from '../utils/topicModeProfiles';
import { 构建官方模式运行时配置, 规范化模式运行时配置 } from '../utils/modeRuntimeProfile';
import { 是否自定义模式运行时配置, 解析生效题材配置 } from '../utils/effectiveTopicProfile';
import { 获取题材界面文案, 获取题材资源文案, 获取题材档案文案 } from '../utils/resourceLabels';
import { 格式化能力类别 } from '../utils/abilityCategoryLabels';
import { 获取题材关系侧重选项, 获取题材开局配置文案 } from '../utils/openingConfig';
import { 创建事件拍卖品, 生成行情列表, 获取题材行情模板 } from '../services/auctionHouse';
import { 构建题材模式提示词 } from '../prompts/runtime/openingConfig';
import { buildRealmExtraPromptForDiy, buildWorldContextForDiy } from '../components/features/NewGame/NewGameDiyTools';

const 构建红楼运行时配置 = (extra?: Record<string, unknown>): ModeRuntimeProfile => {
    const base: Record<string, any> = {
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
        }
    };
    const merged: Record<string, any> = { ...base, ...(extra || {}) };
    for (const key of Object.keys(base)) {
        if (extra?.[key] && typeof extra[key] === 'object' && !Array.isArray(extra[key])) {
            merged[key] = { ...base[key], ...(extra[key] as Record<string, unknown>) };
        }
    }
    return 规范化模式运行时配置(merged, '武侠');
};

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

    it('生成行情时剔除命中 bannedKeywords 的新模板', () => {
        const runtime = 构建红楼运行时配置({
            economy: {
                marketEventTemplates: [
                    { 标题: '灵石走俏', 描述: '灵石价格上涨。', 影响类型: '材料', 价格倍率: 1.2 },
                    { 标题: '绸缎到货', 描述: '新绸缎入市。', 影响类型: '材料', 价格倍率: 0.9 }
                ]
            }
        });
        const generated = 生成行情列表(true, [], 0, '武侠', runtime).行情列表;
        expect(generated.map((item) => item.标题)).toEqual(['绸缎到货']);
    });

    it('事件未声明热点时保持普通事件', () => {
        const auction = 创建事件拍卖品({ 事件名称: '普通流通事件', 物品: { 名称: '旧书一册' } });
        expect(auction.是否限时热点).toBe(false);
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

    it('自定义 runtime 以 identity.baseMode 作为所有官方回退的题材基线', () => {
        const runtime = 构建红楼运行时配置({ identity: { baseMode: '仙侠' } });
        expect(解析生效题材配置('武侠', runtime).group).toBe('xianxia');
        expect(格式化能力类别('招式', '武侠', runtime)).toBe('术式');
        expect(获取题材资源文案('武侠', runtime)).toEqual(获取题材资源文案('仙侠', null));
    });

    it('prompt 口径仅拼接非空字段，不因尾字段为空丢失整行', () => {
        const runtime = 构建红楼运行时配置({
            organization: { contributionName: '' },
            ability: { combatResolution: '' }
        });
        const prompt = 解析生效题材配置('武侠', runtime).promptLines.join('\n');
        expect(prompt).toContain('组织口径：门第 / 府中人');
        expect(prompt).toContain('能力口径：族望、门第声望、家宅权柄与才情文名');
    });

    it('行情影响类型白名单保留装备、任务道具和杂项', () => {
        const runtime = 构建红楼运行时配置({
            economy: {
                marketEventTemplates: ['装备', '任务道具', '杂项'].map((影响类型) => ({
                    标题: `${影响类型}行情`, 描述: '测试描述', 影响类型, 价格倍率: 1
                }))
            }
        });
        expect(runtime.economy.marketEventTemplates?.map((item) => item.影响类型)).toEqual(['装备', '任务道具', '杂项']);
    });

    it('DIY prompt 使用模式包题材名，并在主轴为空时不输出空标签', () => {
        const normalized = 构建红楼运行时配置();
        const runtime = { ...normalized, ability: { ...normalized.ability, primaryAxis: '' } };
        const worldConfig = { worldName: '大观园', worldSize: '中型', sectDensity: '适中', dynastySetting: '', tianjiaoSetting: '', modeRuntimeProfile: runtime } as any;
        const openingConfig = { 题材模式: '武侠', modeRuntimeProfile: runtime } as any;
        expect(buildWorldContextForDiy(worldConfig, openingConfig)).not.toContain('模式包能力口径：');
        expect(buildRealmExtraPromptForDiy(worldConfig, openingConfig)).toContain('当前题材：红楼梦同人模式包');
        expect(buildRealmExtraPromptForDiy(worldConfig, openingConfig)).not.toContain('当前题材：武侠');
    });
});
