import type { NPC性别 } from '../models/social';

export const 是男性 = (性别?: string): boolean => {
    return 性别 === '男' || 性别 === '男性';
};

export const 是女性 = (性别?: string): boolean => {
    return 性别 === '女' || 性别 === '女性';
};

export const 是男娘 = (性别?: string): boolean => {
    return 性别 === '男娘';
};

export const 是扶她 = (性别?: string): boolean => {
    return 性别 === '扶她';
};

export const 规范化性别 = (性别?: string): NPC性别 => {
    if (性别 === '男性') return '男';
    if (性别 === '女性') return '女';
    if (['男', '女', '男娘', '扶她'].includes(性别 || '')) {
        return 性别 as NPC性别;
    }
    return '男';
};
