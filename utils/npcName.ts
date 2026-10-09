// 比较键只用于匹配，不写回显示姓名。
export const normalizeNpcNameKey = (value: unknown): string => typeof value === 'string'
    ? value.normalize('NFC').trim().replace(/\s+/gu, ' ').replace(/’/g, "'").toLowerCase()
    : '';

export const hasNpcNamePollution = (value: string): boolean => /[\p{Cc}\p{Cf}<>＝=\[\]{}]/u.test(value);

// 只检查字符格式，不证明文本是人物姓名；调用方仍须检查叙事语义和栏目/占位标签。
export const isNpcNameFormatValid = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    const name = value.trim();
    if (hasNpcNamePollution(value) || Array.from(name).length < 2 || Array.from(name).length > 64) return false;
    return /\p{L}/u.test(name) && /^[\p{L}\p{M}]+(?:(?: +|[’'\-])[\p{L}\p{M}]+)*$/u.test(name.normalize('NFC'));
};

export const isMultilingualNpcName = (value: string): boolean => (
    isNpcNameFormatValid(value) && !/^[\p{Script=Han}\p{M}]+$/u.test(value.trim())
);

// 外文名需要字母边界，避免 Alex 命中 Alexander；中文保留正文连续书写的匹配方式。
export const textMentionsNpcName = (text: string, name: string): boolean => {
    const key = normalizeNpcNameKey(name);
    if (!key) return false;
    const source = normalizeNpcNameKey(text);
    if (!isMultilingualNpcName(name)) return source.includes(key);
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\p{Script=Han}|[^\\p{L}\\p{M}\\p{N}'’-])${escaped}(?=$|\\p{Script=Han}|[^\\p{L}\\p{M}\\p{N}'’-])`, 'u').test(source);
};
