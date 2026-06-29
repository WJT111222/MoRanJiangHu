/**
 * 酒馆（SillyTavern）正则引擎核心
 *
 * 对齐 SillyTavern `public/scripts/extensions/regex/engine.js` 的核心执行逻辑，
 * 在安全沙箱内执行预设内嵌的正则脚本。
 *
 * 安全策略：
 * - 安全清理脚本：直接执行正则替换
 * - 选项渲染脚本：不走此引擎，由 tavernOptionRenderer.ts 处理
 * - HTML美化脚本：执行正则替换但 HTML 标签由 markdown 渲染器安全处理
 * - 危险脚本（含 <script>/JS/DOM/网络）：完全跳过
 */

import type {
    酒馆正则脚本结构,
    酒馆正则脚本分类条目,
    酒馆正则脚本安全类型,
    酒馆正则脚本执行状态,
    酒馆正则放置位置,
    酒馆正则宏替换模式,
} from '../models/system';

// ─── 正则缓存（LRU） ───

const REGEX_CACHE_MAX = 200;
const regexCache = new Map<string, RegExp>();

const compileRegex = (pattern: string, flags?: string): RegExp | null => {
    const cacheKey = `${flags || ''}:${pattern}`;
    const cached = regexCache.get(cacheKey);
    if (cached) return cached;

    try {
        const regex = new RegExp(pattern, flags);
        if (regexCache.size >= REGEX_CACHE_MAX) {
            const firstKey = regexCache.keys().next().value;
            if (firstKey !== undefined) regexCache.delete(firstKey);
        }
        regexCache.set(cacheKey, regex);
        return regex;
    } catch {
        return null;
    }
};

// ─── 安全分类（5 级：安全清理 → 选项渲染 → HTML美化 → JS交互 → 仍跳过） ───

/** 检测脚本是否包含 JS/DOM/网络操作（原"危险脚本"宽松检测） */
const 是否危险脚本 = (script: 酒馆正则脚本结构): boolean => {
    const replaceString = script.replaceString || '';
    return /<\s*script\b|javascript\s*:|window\.|document\.|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|eval\s*\(/i.test(replaceString);
};

/**
 * 检测含 JS 的脚本是否可桥接到沙箱 iframe
 * 排除不可桥接的操作：外部脚本加载、网络请求、复杂存储 API、深度 DOM 遍历
 */
const 是否可桥接JS脚本 = (script: 酒馆正则脚本结构): boolean => {
    const replaceString = script.replaceString || '';

    // ❌ 外部脚本加载（含 CDN React/JSX、Music.js 等）
    if (/<\s*script\b[^>]*\bsrc\s*=/i.test(replaceString)) return false;

    // ❌ 任意网络请求
    if (/\bfetch\s*\(|XMLHttpRequest/i.test(replaceString)) return false;

    // ❌ 复杂存储 API
    if (/\bindexedDB\b|\bcrypto\.subtle\b/i.test(replaceString)) return false;

    // ❌ 远程字体/资源加载（@import url 注入）
    if (/@import\s+url\s*\(/i.test(replaceString)) return false;

    // ❌ 深度 DOM 遍历（对话渲染器的跨 iframe 父级文档补丁）
    if (/window\.__dcHostBridge|__dc-html-embed/i.test(replaceString)) return false;

    // ✅ 其余 window.parent.* / document.* / localStorage(简单)/ createElement / innerHTML
    //    都可以在沙箱 iframe 中通过桥接垫片安全运行
    return true;
};

const 是否选项渲染脚本 = (script: 酒馆正则脚本结构): boolean => {
    if (script.disabled) return false;
    const findRegex = (script.findRegex || '').toLowerCase();
    const replaceString = (script.replaceString || '').toLowerCase();
    const scriptName = (script.scriptName || '').toLowerCase();
    const targetsOptionBlock = /<\s*(options|branches)/.test(findRegex);
    const rendersHtml = /```html|<!doctype html|<html|<style|class\s*=/.test(replaceString);
    return /data-option-text|option-link|option-list/.test(replaceString)
        || (targetsOptionBlock && rendersHtml && /选项栏|option|choice/.test(scriptName));
};

const 是否包含HTML渲染 = (script: 酒馆正则脚本结构): boolean => {
    const findRegex = script.findRegex || '';
    const replaceString = script.replaceString || '';
    return /<[a-z][\s\S]*?>/i.test(replaceString)
        || /<!--|<!\s*--?/i.test(replaceString)
        || /<(?:details|summary|html|body|style|script|div|span|button|section|article)\b/i.test(findRegex);
};

/** 对正则脚本做安全分类（5 级） */
export const 分类正则脚本 = (script: 酒馆正则脚本结构): 酒馆正则脚本安全类型 => {
    if (是否危险脚本(script)) {
        // 危险脚本进一步细分：可桥接 → JS交互，不可桥接 → 仍跳过
        return 是否可桥接JS脚本(script) ? 'JS交互' : '仍跳过';
    }
    if (是否选项渲染脚本(script)) return '选项渲染';
    if (是否包含HTML渲染(script)) return 'HTML美化';
    return '安全清理';
};

/** 根据安全类型映射执行状态注解 */
const 安全类型到执行状态 = (safetyType: 酒馆正则脚本安全类型): 酒馆正则脚本执行状态 => {
    switch (safetyType) {
        case '安全清理': return '已安全执行';
        case '选项渲染': return '已适配为选项按钮';
        case 'HTML美化': return 'HTML美化已执行';
        case 'JS交互': return 'iframe沙箱已渲染';
        case '仍跳过': return '已跳过';
    }
};

/** 从预设 extensions 中提取并分类所有正则脚本 */
export const 提取并分类正则脚本 = (
    extensions: Record<string, unknown> | undefined
): 酒馆正则脚本分类条目[] => {
    const raw = (extensions as any)?.regex_scripts;
    if (!Array.isArray(raw)) return [];

    return raw
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any): 酒馆正则脚本分类条目 | null => {
            const script = 规范化正则脚本(item);
            if (!script) return null;
            const safetyType = 分类正则脚本(script);
            const executionStatus = 安全类型到执行状态(safetyType);
            return { script, safetyType, executionStatus };
        })
        .filter((item): item is 酒馆正则脚本分类条目 => item !== null);
};

// ─── 脚本规范化 ───

const 读取文本 = (value: unknown): string => (typeof value === 'string' ? value : '');
const 读取布尔 = (value: unknown): boolean => value === true;
const 读取数值 = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return fallback;
};
const 读取数值数组 = (value: unknown): number[] => {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item: unknown) => typeof item === 'number' && Number.isFinite(item))
        .map((item: number) => Math.floor(item));
};
const 读取字符串数组 = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item: unknown) => typeof item === 'string');
};

/** 从原始 JSON 对象规范化为 酒馆正则脚本结构 */
export const 规范化正则脚本 = (raw: any): 酒馆正则脚本结构 | null => {
    if (!raw || typeof raw !== 'object') return null;
    const id = 读取文本(raw.id).trim();
    const scriptName = 读取文本(raw.scriptName).trim();
    const findRegex = 读取文本(raw.findRegex).trim();
    if (!findRegex) return null;

    return {
        id: id || `regex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        scriptName: scriptName || '未命名脚本',
        findRegex,
        replaceString: 读取文本(raw.replaceString),
        trimStrings: 读取字符串数组(raw.trimStrings),
        placement: 读取数值数组(raw.placement),
        disabled: 读取布尔(raw.disabled),
        markdownOnly: 读取布尔(raw.markdownOnly),
        promptOnly: 读取布尔(raw.promptOnly),
        runOnEdit: 读取布尔(raw.runOnEdit),
        substituteRegex: 读取数值(raw.substituteRegex, 0) as 酒馆正则宏替换模式,
        minDepth: 读取数值(raw.minDepth, -1),
        maxDepth: 读取数值(raw.maxDepth, 0),
    };
};

// ─── 正则解析与执行 ───

/**
 * 解析 findRegex 字符串，支持 SillyTavern 的两种格式：
 * 1. JavaScript 正则字面量格式: /pattern/flags
 * 2. 纯正则字符串格式: pattern（需由调用方提供 flags）
 */
const parseFindRegex = (findRegex: string): { pattern: string; flags: string } | null => {
    const trimmed = findRegex.trim();
    if (!trimmed) return null;

    // 匹配 /pattern/flags 格式
    const literalMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/s);
    if (literalMatch) {
        return { pattern: literalMatch[1], flags: literalMatch[2] };
    }

    // 非 literal 格式，作为纯正则字符串使用
    return { pattern: trimmed, flags: 'g' };
};

/**
 * 对替换字符串中的捕获组引用进行后处理
 * - $0 / {{match}} → 完整匹配
 * - $1, $2, ... → 编号组
 * - $<name> → 命名组
 * - trimStrings: 对每个捕获组执行 trim
 */
const processReplaceString = (
    replaceString: string,
    match: string,
    groups: Record<string, string>,
    numberedGroups: string[],
    trimStrings: string[]
): string => {
    let result = replaceString;

    // {{match}} → $0 完整匹配
    result = result.replace(/\{\{\s*match\s*\}\}/gi, match);

    // $<name> → 命名组
    result = result.replace(/\$<([^>]+)>/g, (_: string, name: string) => {
        const value = groups[name] || '';
        const trimmed = trimStrings.some(t => t)
            ? value.trim()
            : value;
        return trimmed;
    });

    // $1, $2, ... → 编号组（注意 $0 是完整匹配）
    result = result.replace(/\$(\d+)/g, (_: string, numStr: string) => {
        const num = parseInt(numStr, 10);
        if (num === 0) return match;
        const value = numberedGroups[num - 1] || '';
        return trimStrings.some(t => t) ? value.trim() : value;
    });

    return result;
};

/** 执行单个正则脚本的替换 */
const runRegexScript = (
    text: string,
    script: 酒馆正则脚本结构,
    options?: {
        isMarkdown?: boolean;
        isPrompt?: boolean;
        chatDepth?: number;
        macroResolver?: (text: string, mode: 酒馆正则宏替换模式) => string;
    }
): string => {
    if (script.disabled) return text;
    if (!script.findRegex) return text;

    // 上下文过滤: markdownOnly / promptOnly
    const isMarkdown = options?.isMarkdown ?? false;
    const isPrompt = options?.isPrompt ?? false;
    if (script.markdownOnly && !isMarkdown) return text;
    if (script.promptOnly && !isPrompt) return text;

    // 深度过滤
    const chatDepth = options?.chatDepth;
    if (chatDepth !== undefined) {
        if (script.minDepth >= 0 && chatDepth < script.minDepth) return text;
        if (script.maxDepth > 0 && chatDepth > script.maxDepth) return text;
    }

    // 宏替换（对 findRegex）
    let resolvedPattern = script.findRegex;
    if (script.substituteRegex !== 0 && options?.macroResolver) {
        resolvedPattern = options.macroResolver(resolvedPattern, script.substituteRegex);
    }

    const parsed = parseFindRegex(resolvedPattern);
    if (!parsed) return text;

    const regex = compileRegex(parsed.pattern, parsed.flags);
    if (!regex) return text;

    // 执行替换
    try {
        return text.replace(regex, (match: string, ...args: any[]) => {
            // 从函数参数中提取捕获组和命名组
            // replace callback 的参数结构: match, p1, p2, ..., offset, fullString, namedGroups
            const lastArg = args[args.length - 1];
            const namedGroups: Record<string, string> =
                (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg))
                    ? lastArg as Record<string, string>
                    : {};
            // 编号组是中间参数（offset 和 namedGroups 是最后两个）
            const offsetIndex = typeof lastArg === 'object' ? args.length - 2 : args.length - 1;
            const numberedGroups: string[] = args.slice(0, Math.max(0, offsetIndex));

            return processReplaceString(
                script.replaceString,
                match,
                namedGroups,
                numberedGroups,
                script.trimStrings
            );
        });
    } catch {
        return text;
    }
};

// ─── 公共 API ───

/** 正则引擎执行上下文 */
export interface 正则引擎上下文 {
    placement: 酒馆正则放置位置;
    isMarkdown?: boolean;
    isPrompt?: boolean;
    chatDepth?: number;
    /** 宏替换回调，用于 {{user}}/{{char}} 等变量 */
    macroResolver?: (text: string, mode: 酒馆正则宏替换模式) => string;
    /** 跳过指定安全类型的脚本 */
    skipSafetyTypes?: 酒馆正则脚本安全类型[];
}

/**
 * 对文本执行预设内嵌的所有匹配正则脚本
 *
 * @param text 要处理的文本
 * @param classifiedScripts 已分类的脚本列表
 * @param context 执行上下文（放置位置、markdown/prompt 模式等）
 * @returns 处理后的文本
 */
export const 执行酒馆正则替换 = (
    text: string,
    classifiedScripts: 酒馆正则脚本分类条目[],
    context: 正则引擎上下文
): string => {
    if (!text || !classifiedScripts.length) return text;

    const { placement, skipSafetyTypes } = context;
    const skipSet = new Set(skipSafetyTypes || []);

    let result = text;

    for (const { script, safetyType } of classifiedScripts) {
        // 跳过不可桥接脚本
        if (safetyType === '仍跳过') continue;

        // 跳过调用方指定跳过的安全类型
        if (skipSet.has(safetyType)) continue;

        // 跳过不匹配 placement 的脚本
        if (script.placement.length > 0 && !script.placement.includes(placement)) continue;

        // 选项渲染脚本跳过（由 tavernOptionRenderer.ts 处理）
        if (safetyType === '选项渲染') continue;

        // 安全清理 / HTML美化 / JS交互 都执行正则替换
        // JS交互 的产出包含 <script>，由沙箱 iframe 渲染，但正则替换本身在此执行
        result = runRegexScript(result, script, {
            isMarkdown: context.isMarkdown,
            isPrompt: context.isPrompt,
            chatDepth: context.chatDepth,
            macroResolver: context.macroResolver,
        });
    }

    return result;
};

/**
 * 便捷函数：从预设 extensions 提取脚本并执行针对 AI 输出的正则替换
 *
 * @param text AI 输出文本
 * @param extensions 预设的 extensions 对象
 * @param options 可选上下文
 * @returns 处理后的文本
 */
export const 对AI输出执行酒馆正则 = (
    text: string,
    extensions: Record<string, unknown> | undefined,
    options?: {
        isMarkdown?: boolean;
        chatDepth?: number;
        macroResolver?: (text: string, mode: 酒馆正则宏替换模式) => string;
    }
): string => {
    const classifiedScripts = 提取并分类正则脚本(extensions);
    return 执行酒馆正则替换(text, classifiedScripts, {
        placement: 2, // AI_OUTPUT
        skipSafetyTypes: ['选项渲染', 'HTML美化', 'JS交互', '仍跳过'],
        isMarkdown: options?.isMarkdown ?? true,
        chatDepth: options?.chatDepth,
        macroResolver: options?.macroResolver,
    });
};

/**
 * 便捷函数：对用户输入执行正则替换
 */
export const 对用户输入执行酒馆正则 = (
    text: string,
    extensions: Record<string, unknown> | undefined,
    options?: {
        chatDepth?: number;
        macroResolver?: (text: string, mode: 酒馆正则宏替换模式) => string;
    }
): string => {
    const classifiedScripts = 提取并分类正则脚本(extensions);
    return 执行酒馆正则替换(text, classifiedScripts, {
        placement: 1, // USER_INPUT
        skipSafetyTypes: ['选项渲染'],
        chatDepth: options?.chatDepth,
        macroResolver: options?.macroResolver,
    });
};

/**
 * 便捷函数：对世界书内容执行正则替换
 */
export const 对世界书执行酒馆正则 = (
    text: string,
    extensions: Record<string, unknown> | undefined,
    options?: {
        macroResolver?: (text: string, mode: 酒馆正则宏替换模式) => string;
    }
): string => {
    const classifiedScripts = 提取并分类正则脚本(extensions);
    return 执行酒馆正则替换(text, classifiedScripts, {
        placement: 5, // WORLD_INFO
        skipSafetyTypes: ['选项渲染'],
        isPrompt: true,
        macroResolver: options?.macroResolver,
    });
};

// ─── 清理缓存（用于测试） ───

export const 清理正则缓存 = (): void => {
    regexCache.clear();
};
