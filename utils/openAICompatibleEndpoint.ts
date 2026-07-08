const OPENAI_CHAT_COMPLETIONS_SUFFIX = /\/chat\/completions$/i;
const OPENAI_VERSION_SEGMENT = /^v\d+(?:beta)?$/i;

export const 清理OpenAI兼容地址末尾斜杠 = (baseUrlRaw: unknown): string => {
    const raw = typeof baseUrlRaw === 'string' ? baseUrlRaw.trim() : '';
    return raw.replace(/\/+$/u, '');
};

export const 去除OpenAI兼容聊天端点 = (baseUrlRaw: unknown): string => {
    return 清理OpenAI兼容地址末尾斜杠(baseUrlRaw).replace(OPENAI_CHAT_COMPLETIONS_SUFFIX, '');
};

const 读取路径片段 = (baseUrlRaw: unknown): string[] => {
    const base = 清理OpenAI兼容地址末尾斜杠(baseUrlRaw);
    if (!base) return [];
    try {
        return new URL(base).pathname.split('/').filter(Boolean);
    } catch {
        const withoutQuery = base.split(/[?#]/u)[0] || '';
        return withoutQuery.split('/').filter(Boolean);
    }
};

export const OpenAI兼容路径片段是版本号 = (segment: string): boolean => OPENAI_VERSION_SEGMENT.test(segment);

export const OpenAI兼容地址已包含版本路径 = (baseUrlRaw: unknown): boolean => {
    return 读取路径片段(baseUrlRaw).some(OpenAI兼容路径片段是版本号);
};

export const 读取OpenAI兼容地址源站 = (baseUrlRaw: unknown): string => {
    const base = 清理OpenAI兼容地址末尾斜杠(baseUrlRaw);
    if (!base) return '';
    try {
        return new URL(base).origin;
    } catch {
        const match = base.match(/^(https?:\/\/[^/]+)/i);
        return match?.[1] || '';
    }
};

export const 构建OpenAI兼容版本路径父地址 = (baseUrlRaw: unknown): string => {
    const base = 清理OpenAI兼容地址末尾斜杠(baseUrlRaw);
    if (!base) return '';
    try {
        const url = new URL(base);
        const segments = url.pathname.split('/').filter(Boolean);
        let versionIndex = -1;
        for (let index = segments.length - 1; index >= 0; index -= 1) {
            if (OpenAI兼容路径片段是版本号(segments[index])) {
                versionIndex = index;
                break;
            }
        }
        if (versionIndex < 0) return '';
        const parentSegments = segments.slice(0, versionIndex);
        url.pathname = parentSegments.length ? `/${parentSegments.join('/')}` : '/';
        url.search = '';
        url.hash = '';
        return 清理OpenAI兼容地址末尾斜杠(url.toString());
    } catch {
        return '';
    }
};
