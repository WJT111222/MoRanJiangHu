const 判定固定名称列表 = [
    '(?:NSFW)?判定',
    '先机',
    '瞄准',
    '接战',
    '对撞',
    '对抗',
    '防御',
    '化解',
    '伤害',
    '态势',
    '反击',
    '反馈',
    '消耗',
    '洞察',
    '衰退'
];

const 判定固定名称正则 = new RegExp(`^(?:${判定固定名称列表.join('|')})$`);
const 判定固定前缀正则 = new RegExp(`^(?:【\\s*(?:${判定固定名称列表.join('|')})\\s*】|\\[\\s*(?:${判定固定名称列表.join('|')})\\s*\\])`);
const 判定自定义分类前缀正则 = /^(【\s*[^】｜\n\r]{1,16}\s*】|\[\s*[^\]｜\n\r]{1,16}\s*\])/;
const 判定值难度特征正则 = /判定值\s*[+\-]?\d+(?:\.\d+)?\s*\/\s*难度\s*[+\-]?\d+(?:\.\d+)?/;
const 判定结果特征正则 = /(?:^|[｜\s])结果\s*=/;

export const 提取判定日志前缀 = (value: unknown): string => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (判定固定名称正则.test(text)) return text;
    const fixedMatch = text.match(判定固定前缀正则);
    if (fixedMatch?.[0]) return fixedMatch[0];

    const customMatch = text.match(判定自定义分类前缀正则);
    if (!customMatch?.[0]) return '';
    if (!判定值难度特征正则.test(text) || !判定结果特征正则.test(text)) return '';
    return customMatch[0];
};

export const 是否判定日志文本 = (value: unknown): boolean => Boolean(提取判定日志前缀(value));
