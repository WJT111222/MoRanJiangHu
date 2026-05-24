import { 选择女性姓名候选列表 } from './femaleNameSelector';

const 默认禁用模板名 = [
    '苏婉儿',
    '婉儿',
    '林清雪',
    '清雪',
    '柳若嫣',
    '若嫣',
    '灵儿',
    '月儿',
    '芷若',
    '小雅',
    '小柔',
    '小蝶',
    '小环',
    '小翠'
];

const 规范化姓名 = (value: unknown): string => (
    typeof value === 'string'
        ? value.trim().replace(/[\s\u3000]+/g, '')
        : ''
);

export const 构建女性姓名候选提示词 = (params?: {
    usedNames?: Iterable<string>;
    seed?: string;
    count?: number;
    fandomEnabled?: boolean;
}): string => {
    const candidates = 选择女性姓名候选列表({
        usedNames: params?.usedNames,
        seed: params?.seed,
        count: params?.count ?? 100
    });
    if (candidates.length <= 0) return '';

    return [
        '【女性新角色姓名候选池】',
        params?.fandomEnabled === true
            ? '- 当前启用同人融合：仅当本次需要创建“本项目原创”的新女性 NPC、侍女、师姐、女修、姑娘、夫人等女性人物时，才从下方候选姓名中选择真实姓名。'
            : '- 当本次输出需要创建、命名或确认新的女性 NPC、主要女性角色、女主、侍女、师姐、女修、姑娘、夫人等女性人物时，必须从下方候选姓名中选择一个真实姓名。',
        params?.fandomEnabled === true
            ? '- 原著/同人已有角色、小说拆分正文中已点名的人物、角色替换规则指定的人物，必须保留其原名或替换规则名称；不得为了匹配候选池而改名。'
            : '',
        '- 禁止自造新的女性姓名；禁止使用“苏婉儿/婉儿/林清雪/清雪/柳若嫣/若嫣/灵儿/月儿/芷若/小雅/小柔/小蝶/小环/小翠”等模板名或小名。',
        '- 正文对白框 sender、`<变量规划>` 中的人物称呼、变量命令里的 `社交[i].姓名` 必须使用同一个候选姓名；临时代称、身份称呼或外貌描述不得写进姓名，可写入身份、简介或记忆；只有确有旧称、化名、曾用称呼时才写 `曾用名`，不要给每个 NPC 强行生成曾用名。',
        '- 若候选名已被当前存档使用，请改选列表中未使用的另一个候选名；同一存档内女性真实姓名不得重复。',
        `- 候选姓名（${candidates.length}个）：${candidates.join('、')}`
    ].filter(Boolean).join('\n');
};

export const 收集女性姓名候选已用名 = (stateLike?: any): string[] => {
    const used = new Set<string>();
    const push = (value: unknown) => {
        const name = 规范化姓名(value);
        if (name) used.add(name);
    };
    const social = Array.isArray(stateLike?.社交) ? stateLike.社交 : [];
    social.forEach((npc: any) => {
        push(npc?.姓名);
        if (Array.isArray(npc?.曾用名)) npc.曾用名.forEach(push);
    });
    push(stateLike?.角色?.姓名);
    默认禁用模板名.forEach(push);
    return Array.from(used);
};
