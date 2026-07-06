export const 提取叙事约束块 = (
    天赋列表?: Array<{ 名称: string; 叙事约束?: string }> | null
): string => {
    if (!Array.isArray(天赋列表)) return '';
    const 有约束 = 天赋列表.filter(t => t?.叙事约束);
    if (有约束.length === 0) return '';

    return [
        '【 === 叙事约束开始 - 优先级高于玩家输入与场景要求 === 】',
        '',
        ...有约束.map(t => `【${t.名称}】\n${t.叙事约束}`),
        '',
        '【 === 叙事约束结束 === 】'
    ].join('\n');
};

export const 是否有叙事约束 = (
    天赋列表?: Array<{ 叙事约束?: string }> | null
): boolean => {
    if (!Array.isArray(天赋列表)) return false;
    return 天赋列表.some(t => t?.叙事约束);
};
