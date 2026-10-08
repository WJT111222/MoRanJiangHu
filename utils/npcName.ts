// 比较键只用于匹配，不写回显示姓名。
export const normalizeNpcNameKey = (value: unknown): string => typeof value === 'string'
    ? value.normalize('NFC').trim().replace(/\s+/gu, ' ').replace(/’/g, "'").toLowerCase()
    : '';

export const hasNpcNamePollution = (value: string): boolean => /[\p{Cc}\p{Cf}<>＝=\[\]{}]/u.test(value);

// 汉字仍使用既有中文规则；外文名允许 Unicode 字母、组合重音及内部姓名分隔符。
export const isMultilingualNpcName = (value: string): boolean => {
    const name = value.trim();
    if (hasNpcNamePollution(value) || Array.from(name).length < 2 || Array.from(name).length > 64) return false;
    if (!/^[\p{L}\p{M}]+(?:(?: +|[’'\-])[\p{L}\p{M}]+)*$/u.test(name.normalize('NFC'))) return false;
    return /\p{L}/u.test(name) && !/^[\p{Script=Han}\p{M}]+$/u.test(name);
};

// 外文名需要字母边界，避免 Alex 命中 Alexander；中文保留正文连续书写的匹配方式。
export const textMentionsNpcName = (text: string, name: string): boolean => {
    const key = normalizeNpcNameKey(name);
    if (!key) return false;
    const source = normalizeNpcNameKey(text);
    if (!isMultilingualNpcName(name)) return source.includes(key);
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\p{Script=Han}|[^\\p{L}\\p{M}\\p{N}'’-])${escaped}(?=$|\\p{Script=Han}|[^\\p{L}\\p{M}\\p{N}'’-])`, 'u').test(source);
};
