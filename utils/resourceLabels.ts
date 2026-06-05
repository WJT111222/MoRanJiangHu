import type { ModeRuntimeProfile, OpeningConfig, 题材模式类型 } from '../models/system';
import { 获取题材模式配置 } from './topicModeProfiles';

export type 资源槽位 = 'vitality' | 'stamina' | 'innerPower';

export interface 资源展示项 {
    label: string;
    currentKeys: string[];
    maxKeys: string[];
}

export interface 资源展示文案 {
    sectionTitle: string;
    vitality: 资源展示项;
    stamina: 资源展示项;
    innerPower: 资源展示项;
}

export interface 题材资源文案 {
    分组标题: string;
    气血: string;
    精力: string;
    能量: string;
    气血当前字段: string[];
    气血最大字段: string[];
    精力当前字段: string[];
    精力最大字段: string[];
    能量当前字段: string[];
    能量最大字段: string[];
}

export interface 题材界面文案 {
    菜单: Record<
        | 'character'
        | 'battle'
        | 'equipment'
        | 'inventory'
        | 'social'
        | 'kungfu'
        | 'skills'
        | 'world'
        | 'map'
        | 'team'
        | 'sect'
        | 'task'
        | 'agreement'
        | 'story'
        | 'plan'
        | 'memory'
        | 'auctionHouse'
        | 'imageManager'
        | 'settings',
        string
    >;
    标题: {
        装备: string;
        背包: string;
        背包容量: string;
        社交: string;
        队伍: string;
        队伍成员: string;
        队伍空状态: string;
        队员选择提示: string;
        队员时间标记: string;
        队员未变化: string;
        基础属性: string;
        武器装备: string;
        服饰装备: string;
        随身物品: string;
        随身物品空状态: string;
        系统设置: string;
    };
    组织: {
        组织入口: string;
        总览: string;
        商城: string;
        能力库: string;
        成员名录: string;
        晋升路径: string;
        贡献: string;
        组织实力: string;
        成员计量: string;
        规则: string;
        宗旨: string;
        补给名称: string;
        领取补给: string;
        已领取补给: string;
        下次补给时间: string;
        本期预计可领: string;
        兑换提示: string;
        消耗提示: string;
        学习动作: string;
        已学习: string;
        可学习: string;
    };
}

const 资源文案表: Record<题材模式类型, 资源展示文案> = {
    武侠: {
        sectionTitle: '气血精元',
        vitality: { label: '气血', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '精力', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '内力', currentKeys: ['当前内力'], maxKeys: ['最大内力'] }
    },
    仙侠: {
        sectionTitle: '灵机命元',
        vitality: { label: '命元', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '精力', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '灵力', currentKeys: ['当前灵力', '当前内力'], maxKeys: ['最大灵力', '最大内力'] }
    },
    西方奇幻: {
        sectionTitle: '生命与魔力',
        vitality: { label: '生命', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '体能', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '法力', currentKeys: ['当前内力', '当前灵力'], maxKeys: ['最大内力', '最大灵力'] }
    },
    灵气复苏: {
        sectionTitle: '体征与灵能',
        vitality: { label: '体征', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '体能', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '灵能', currentKeys: ['当前灵力', '当前内力'], maxKeys: ['最大灵力', '最大内力'] }
    },
    都市修仙: {
        sectionTitle: '体征与真元',
        vitality: { label: '体征', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '精力', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '真元', currentKeys: ['当前内力', '当前灵力'], maxKeys: ['最大内力', '最大灵力'] }
    },
    现代都市: {
        sectionTitle: '健康与状态',
        vitality: { label: '健康', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '体力', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '专注', currentKeys: ['当前内力'], maxKeys: ['最大内力'] }
    },
    末日丧尸: {
        sectionTitle: '生命与体能',
        vitality: { label: '生命', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '体能', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '意志', currentKeys: ['当前内力'], maxKeys: ['最大内力'] }
    },
    无限流: {
        sectionTitle: '状态与负荷',
        vitality: { label: '生命', currentKeys: ['当前血量'], maxKeys: ['最大血量'] },
        stamina: { label: '体能', currentKeys: ['当前精力'], maxKeys: ['最大精力'] },
        innerPower: { label: '精神负荷', currentKeys: ['当前内力', '当前灵力'], maxKeys: ['最大内力', '最大灵力'] }
    }
};

export const 获取资源展示文案 = (openingConfig?: Pick<OpeningConfig, '题材模式'> | null): 资源展示文案 => {
    const mode = openingConfig?.题材模式;
    return mode && 资源文案表[mode] ? 资源文案表[mode] : 资源文案表.武侠;
};

export const 获取题材资源文案 = (
    mode?: 题材模式类型 | null,
    _runtimeProfile?: ModeRuntimeProfile | null
): 题材资源文案 => {
    const labels = 获取资源展示文案(mode ? { 题材模式: mode } : null);
    return {
        分组标题: labels.sectionTitle,
        气血: labels.vitality.label,
        精力: labels.stamina.label,
        能量: labels.innerPower.label,
        气血当前字段: labels.vitality.currentKeys,
        气血最大字段: labels.vitality.maxKeys,
        精力当前字段: labels.stamina.currentKeys,
        精力最大字段: labels.stamina.maxKeys,
        能量当前字段: labels.innerPower.currentKeys,
        能量最大字段: labels.innerPower.maxKeys
    };
};

const 创建界面文案 = (mode?: 题材模式类型 | null): 题材界面文案 => {
    const profile = 获取题材模式配置(mode || undefined);
    const auctionHouse = profile.auctionName || '拍卖行';
    const base: 题材界面文案 = {
        菜单: {
            character: '角色',
            battle: '战斗',
            equipment: '全身披挂',
            inventory: '江湖行囊',
            social: '江湖谱',
            kungfu: '功法',
            skills: '技艺',
            world: '世界',
            map: '地图',
            team: '同行',
            sect: '门派',
            task: '任务',
            agreement: '约定',
            story: '剧情',
            plan: '规划',
            memory: '记忆',
            auctionHouse,
            imageManager: '图册',
            settings: '江湖设置'
        },
        标题: {
            装备: '全身披挂',
            背包: '江湖行囊',
            背包容量: '行囊格位',
            社交: '江湖谱',
            队伍: '队伍预览',
            队伍成员: '同行之人',
            队伍空状态: '暂无其他同行之人',
            队员选择提示: '请选择同行之人',
            队员时间标记: '前尘印记',
            队员未变化: '宛如初见，并无变故',
            基础属性: '武道根基',
            武器装备: '神兵利器',
            服饰装备: '裙衫装束',
            随身物品: '随身行囊',
            随身物品空状态: '囊空如洗，并无余物',
            系统设置: '江湖设置'
        },
        组织: {
            组织入口: '门派',
            总览: '宗门大殿',
            商城: '聚宝阁',
            能力库: '藏经阁',
            成员名录: '同门名录',
            晋升路径: '晋升之路',
            贡献: '贡献点',
            组织实力: '门派实力',
            成员计量: '弟子',
            规则: '戒律',
            宗旨: '宗门宗旨',
            补给名称: '月俸',
            领取补给: '领取月俸',
            已领取补给: '本月已领取',
            下次补给时间: '下次月俸领取时间',
            本期预计可领: '本月预计可领',
            兑换提示: '贡献点足够即可兑换。兑换消耗当前贡献，不影响晋升所需的累计贡献。',
            消耗提示: '晋升只看累计生成过的贡献点，聚宝阁兑换只消耗当前可用贡献。',
            学习动作: '学习',
            已学习: '已学习',
            可学习: '可学'
        }
    };

    switch (profile.group) {
        case 'xianxia':
            return {
                ...base,
                菜单: { ...base.菜单, equipment: '法宝装备', inventory: '乾坤袋', social: '道友录', skills: '百艺', team: '同道', sect: '宗门', auctionHouse },
                标题: {
                    ...base.标题,
                    装备: '法宝装备',
                    背包: '乾坤袋',
                    背包容量: '乾坤格位',
                    社交: '道友录',
                    队伍: '同道预览',
                    队伍成员: '同行同道',
                    队伍空状态: '暂无其他同行同道',
                    队员选择提示: '请选择同行同道',
                    队员时间标记: '近况记录',
                    基础属性: '修行根基',
                    武器装备: '法器法宝',
                    服饰装备: '法衣装束',
                    随身物品: '随身储物',
                    随身物品空状态: '乾坤袋中暂无余物',
                    系统设置: '修行设置'
                }
            };
        case 'western_fantasy':
            return {
                ...base,
                菜单: { ...base.菜单, equipment: '冒险装备', inventory: '冒险行囊', social: '同伴名册', kungfu: '能力', skills: '专长', team: '队伍', sect: '公会', auctionHouse, settings: '系统设置' },
                标题: {
                    ...base.标题,
                    装备: '冒险装备',
                    背包: '冒险行囊',
                    背包容量: '背包格位',
                    社交: '同伴名册',
                    队伍: '队伍预览',
                    队伍成员: '队伍成员',
                    队伍空状态: '暂无其他队伍成员',
                    队员选择提示: '请选择队伍成员',
                    队员时间标记: '近况记录',
                    基础属性: '能力基础',
                    武器装备: '武器装备',
                    服饰装备: '服饰装束',
                    随身物品: '随身物品',
                    随身物品空状态: '背包中暂无物品',
                    系统设置: '系统设置'
                },
                组织: {
                    ...base.组织,
                    组织入口: '公会',
                    总览: '公会总览',
                    商城: '团队商城',
                    能力库: '能力库',
                    成员名录: '成员名录',
                    晋升路径: '职阶晋升',
                    贡献: '公会声望',
                    组织实力: '公会实力',
                    成员计量: '成员',
                    规则: '守则',
                    宗旨: '公会准则',
                    补给名称: '津贴',
                    领取补给: '领取津贴',
                    已领取补给: '本期已领取',
                    下次补给时间: '下次津贴领取时间',
                    本期预计可领: '本期预计可领'
                }
            };
        case 'urban_xianxia':
            return {
                ...base,
                菜单: { ...base.菜单, equipment: '随身装备', inventory: '随身物品', social: '关系网', kungfu: '修行法', skills: '技能', team: '团队', sect: '组织', auctionHouse, settings: '系统设置' },
                标题: {
                    ...base.标题,
                    装备: '随身装备',
                    背包: '随身物品',
                    背包容量: '收纳格位',
                    社交: '关系网',
                    队伍: '团队预览',
                    队伍成员: '团队成员',
                    队伍空状态: '暂无其他团队成员',
                    队员选择提示: '请选择团队成员',
                    队员时间标记: '近况记录',
                    基础属性: '能力基础',
                    武器装备: '装备与器械',
                    服饰装备: '服饰装束',
                    随身物品: '随身物品',
                    随身物品空状态: '暂无随身物品',
                    系统设置: '系统设置'
                },
                组织: {
                    ...base.组织,
                    组织入口: '组织',
                    总览: '组织总览',
                    商城: '资源库',
                    能力库: '能力库',
                    成员名录: '成员名录',
                    晋升路径: '岗位晋升',
                    贡献: '组织信用',
                    组织实力: '组织能力',
                    成员计量: '成员',
                    规则: '守则',
                    宗旨: '组织准则',
                    补给名称: '津贴',
                    领取补给: '领取津贴',
                    已领取补给: '本期已领取',
                    下次补给时间: '下次津贴领取时间',
                    本期预计可领: '本期预计可领'
                }
            };
        case 'modern':
            return {
                ...base,
                菜单: { ...base.菜单, equipment: '随身装备', inventory: '随身物品', social: '联系人', kungfu: '能力', skills: '技能', team: '团队', sect: '组织', auctionHouse, settings: '系统设置' },
                标题: {
                    ...base.标题,
                    装备: '随身装备',
                    背包: '随身物品',
                    背包容量: '物品格位',
                    社交: '联系人',
                    队伍: '团队预览',
                    队伍成员: '团队成员',
                    队伍空状态: '暂无其他团队成员',
                    队员选择提示: '请选择团队成员',
                    队员时间标记: '近况记录',
                    基础属性: '能力基础',
                    武器装备: '装备与工具',
                    服饰装备: '服饰装束',
                    随身物品: '随身物品',
                    随身物品空状态: '暂无随身物品',
                    系统设置: '系统设置'
                },
                组织: {
                    ...base.组织,
                    组织入口: '组织',
                    总览: '组织总览',
                    商城: '资源库',
                    能力库: '能力库',
                    成员名录: '成员名录',
                    晋升路径: '岗位晋升',
                    贡献: '组织信用',
                    组织实力: '组织能力',
                    成员计量: '成员',
                    规则: '守则',
                    宗旨: '组织准则',
                    补给名称: '津贴',
                    领取补给: '领取津贴',
                    已领取补给: '本期已领取',
                    下次补给时间: '下次津贴领取时间',
                    本期预计可领: '本期预计可领'
                }
            };
        case 'apocalypse':
            return {
                ...base,
                菜单: { ...base.菜单, equipment: '求生装备', inventory: '物资背包', social: '幸存者档案', kungfu: '技能', skills: '生存技能', team: '小队', sect: '营地', auctionHouse, settings: '系统设置' },
                标题: {
                    ...base.标题,
                    装备: '求生装备',
                    背包: '物资背包',
                    背包容量: '背包格位',
                    社交: '幸存者档案',
                    队伍: '小队预览',
                    队伍成员: '小队成员',
                    队伍空状态: '暂无其他小队成员',
                    队员选择提示: '请选择小队成员',
                    队员时间标记: '近况记录',
                    基础属性: '生存状态',
                    武器装备: '武器装备',
                    服饰装备: '防护装束',
                    随身物品: '随身物资',
                    随身物品空状态: '暂无随身物资',
                    系统设置: '系统设置'
                },
                组织: {
                    ...base.组织,
                    组织入口: '营地',
                    总览: '据点总览',
                    商城: '物资库',
                    能力库: '训练资料',
                    成员名录: '成员名录',
                    晋升路径: '分工晋升',
                    贡献: '贡献点',
                    组织实力: '据点能力',
                    成员计量: '成员',
                    规则: '守则',
                    宗旨: '据点准则',
                    补给名称: '补给配给',
                    领取补给: '领取配给',
                    已领取补给: '本期已领取',
                    下次补给时间: '下次配给时间',
                    本期预计可领: '本期预计可领',
                    兑换提示: '营地贡献足够即可领取物资。领取消耗当前贡献，不影响分工晋升所需的累计贡献。',
                    消耗提示: '晋升只看累计贡献，物资库领取只消耗当前可用贡献。'
                }
            };
        case 'infinite':
            return {
                ...base,
                菜单: { ...base.菜单, equipment: '强化装备', inventory: '储物清单', social: '轮回者档案', kungfu: '能力', skills: '专长', team: '小队', sect: '团队', auctionHouse, settings: '系统设置' },
                标题: {
                    ...base.标题,
                    装备: '强化装备',
                    背包: '储物清单',
                    背包容量: '储物格位',
                    社交: '轮回者档案',
                    队伍: '小队预览',
                    队伍成员: '小队成员',
                    队伍空状态: '暂无其他小队成员',
                    队员选择提示: '请选择小队成员',
                    队员时间标记: '近况记录',
                    基础属性: '能力基础',
                    武器装备: '武装配置',
                    服饰装备: '防护装束',
                    随身物品: '随身储备',
                    随身物品空状态: '储物清单暂无物品',
                    系统设置: '系统设置'
                },
                组织: {
                    ...base.组织,
                    组织入口: '团队',
                    总览: '小队总览',
                    商城: '团队商城',
                    能力库: '能力库',
                    成员名录: '轮回者名录',
                    晋升路径: '轮回进阶',
                    贡献: '奖励点',
                    组织实力: '小队能力',
                    成员计量: '轮回者',
                    规则: '准则',
                    宗旨: '小队信条',
                    补给名称: '结算补给',
                    领取补给: '领取补给',
                    已领取补给: '本期已领取',
                    下次补给时间: '下次补给时间',
                    本期预计可领: '本期预计可领',
                    兑换提示: '奖励点足够即可兑换强化、装备或能力。兑换消耗当前奖励点，不影响进阶所需的累计奖励点。',
                    消耗提示: '进阶只看累计获得的奖励点，团队商城兑换只消耗当前可用奖励点。',
                    学习动作: '解锁',
                    已学习: '已解锁',
                    可学习: '可解锁'
                }
            };
        default:
            return base;
    }
};

export const 获取题材界面文案 = (
    mode?: 题材模式类型 | null,
    _runtimeProfile?: ModeRuntimeProfile | null
): 题材界面文案 => 创建界面文案(mode);

export const 读取资源数值 = (source: unknown, keys: string[], fallback = 0): number => {
    const data = source && typeof source === 'object' ? source as Record<string, unknown> : {};
    for (const key of keys) {
        const parsed = Number(data[key]);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};
