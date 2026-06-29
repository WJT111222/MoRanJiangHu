/**
 * 酒馆模板引擎 — 处理 Instruct / Context / Sysprompt / Reasoning 模板
 * 与 SillyTavern 的模板行为对齐：
 *   - Instruct: 用 input_sequence / output_sequence / system_sequence 包装消息
 *   - Context: 构造故事字符串、chat_start、示例分隔符
 *   - Sysprompt: 注入主系统提示词与 post_history 提示词
 *   - Reasoning: 用 prefix / suffix / separator 包装推理/思维块
 */

import type {
    Instruct模板结构,
    Context模板结构,
    SystemPrompt模板结构,
    Reasoning模板结构,
} from '../models/system';

// ─── 宏替换工具 ───────────────────────────────────────────

/** 将 {{user}}, {{char}}, {{model}} 等常见宏替换为实际值 */
export const 替换模板宏 = (
    text: string,
    vars: {
        userName?: string;
        charName?: string;
        modelName?: string;
        [key: string]: string | undefined;
    }
): string => {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
        if (typeof value !== 'string' || !value) continue;
        // 支持 {{key}} 和 <key> 两种写法
        const braceRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        const tagRegex = new RegExp(`<\\s*${key}\\s*>`, 'gi');
        result = result.replace(braceRegex, value);
        result = result.replace(tagRegex, value);
    }
    return result;
};

// ─── Instruct 模板处理 ────────────────────────────────────

export type 消息角色类型 = 'system' | 'user' | 'assistant';

export interface Instruct格式化消息 {
    role: 消息角色类型;
    content: string;
    /** 原始发送者名称，用于 names_behavior */
    senderName?: string;
    /** 该消息是否是聊天历史中的第一条用户消息 */
    isFirstUser?: boolean;
    /** 该消息是否是聊天历史中的最后一条用户消息 */
    isLastUser?: boolean;
    /** 该消息是否是聊天历史中的最后一条助手消息 */
    isLastAssistant?: boolean;
}

/**
 * 判断消息是否应该渲染名称前缀
 * names_behavior:
 *   'force'  — 群聊或强制头像时显示名称
 *   'surround' — 始终在非叙述者消息上显示名称
 *   'none'   — 不显示名称
 */
const 是否包含名称 = (params: {
    instruct: Instruct模板结构;
    msgRole: 消息角色类型;
    senderName?: string;
    /** 是否处于类似群聊场景 */
    isGroupContext?: boolean;
    isForceAvatar?: boolean;
}): boolean => {
    const { instruct, msgRole, senderName, isGroupContext, isForceAvatar } = params;
    const behavior = instruct.names_behavior || 'none';

    if (behavior === 'surround' || behavior === 'always') {
        // 叙述者/系统消息不显示名称
        return msgRole !== 'system';
    }
    if (behavior === 'force') {
        // 仅在群聊/强制头像时、非用户消息显示名称
        if (msgRole === 'user') return false;
        return Boolean(isGroupContext || isForceAvatar);
    }
    return false; // 'none'
};

/**
 * 获取消息的前缀序列
 * 优先级：first/last 序列 > 默认序列
 */
const 获取消息前缀 = (params: {
    instruct: Instruct模板结构;
    role: 消息角色类型;
    isFirst?: boolean;
    isLast?: boolean;
}): string => {
    const { instruct, role, isFirst, isLast } = params;
    const 系统同用户 = instruct.system_same_as_user === true;

    if (role === 'system') {
        return 系统同用户 ? (instruct.input_sequence || '') : (instruct.system_sequence || '');
    }
    if (role === 'user') {
        if (isFirst && instruct.first_input_sequence) return instruct.first_input_sequence;
        if (isLast && instruct.last_input_sequence) return instruct.last_input_sequence;
        return instruct.input_sequence || '';
    }
    // assistant
    if (isFirst && instruct.first_output_sequence) return instruct.first_output_sequence;
    if (isLast && instruct.last_output_sequence) return instruct.last_output_sequence;
    return instruct.output_sequence || '';
};

/**
 * 获取消息的后缀序列
 */
const 获取消息后缀 = (params: {
    instruct: Instruct模板结构;
    role: 消息角色类型;
}): string => {
    const { instruct, role } = params;
    const 系统同用户 = instruct.system_same_as_user === true;

    if (role === 'system') {
        return 系统同用户 ? (instruct.input_suffix || '') : (instruct.system_suffix || '');
    }
    if (role === 'user') return instruct.input_suffix || '';
    return instruct.output_suffix || '';
};

/**
 * 使用 Instruct 模板格式化聊天消息
 * 与 SillyTavern formatInstructModeChat 对齐
 */
export const 使用Instruct模板格式化消息 = (params: {
    messages: Instruct格式化消息[];
    instruct: Instruct模板结构;
    vars?: {
        userName?: string;
        charName?: string;
    };
    isGroupContext?: boolean;
}): string[] => {
    const { messages, instruct, vars = {}, isGroupContext } = params;
    const wrap = instruct.wrap !== false; // 默认 true
    const lines: string[] = [];

    // 统计首末消息位置
    let firstUserIdx = -1;
    let lastUserIdx = -1;
    let lastAssistantIdx = -1;
    messages.forEach((msg, i) => {
        if (msg.role === 'user' && firstUserIdx < 0) firstUserIdx = i;
        if (msg.role === 'user') lastUserIdx = i;
        if (msg.role === 'assistant') lastAssistantIdx = i;
    });

    messages.forEach((msg, i) => {
        const isFirst = msg.role === 'user' && i === firstUserIdx;
        const isLastUser = msg.role === 'user' && i === lastUserIdx;
        const isLastAssistant = msg.role === 'assistant' && i === lastAssistantIdx;

        let prefix = 获取消息前缀({
            instruct,
            role: msg.role,
            isFirst,
            isLast: isLastUser || isLastAssistant,
        });
        let suffix = 获取消息后缀({ instruct, role: msg.role });

        // 应用宏替换
        if (instruct.macro) {
            prefix = 替换模板宏(prefix, vars);
            suffix = 替换模板宏(suffix, vars);
        }

        // 如果 suffix 为空且 wrap 启用，默认 suffix 为换行
        if (!suffix && wrap) suffix = '\n';

        // 组装消息内容
        const includeName = 是否包含名称({
            instruct,
            msgRole: msg.role,
            senderName: msg.senderName,
            isGroupContext,
        });

        const parts: string[] = [];
        if (prefix) parts.push(prefix);
        if (includeName && msg.senderName) {
            parts.push(`${msg.senderName}: ${msg.content}${suffix}`);
        } else {
            parts.push(`${msg.content}${suffix}`);
        }

        const line = parts.filter((p) => p !== undefined && p !== null).join(wrap ? '\n' : '');
        lines.push(line);
    });

    return lines;
};

// ─── Context 模板处理 ─────────────────────────────────────

export type Context注入位置 =
    | 0  // 在聊天历史之前（默认）
    | 1  // 在聊天历史之后
    | 2; // 绝对深度

/**
 * 使用 Context 模板构建故事字符串
 * story_string 是 Handlebars 风格模板，支持注入:
 *   {{persona}}, {{char}}, {{scenario}}, {{worldInfoScenarios}}, {{user}}, {{model}} 等
 */
export const 使用Context模板构建故事字符串 = (params: {
    context: Context模板结构;
    vars: {
        persona?: string;
        charDescription?: string;
        scenario?: string;
        worldInfoBefore?: string;
        worldInfoAfter?: string;
        userName?: string;
        charName?: string;
        [key: string]: string | undefined;
    };
}): string => {
    const { context, vars } = params;
    let storyString = context.story_string || '';

    // 替换 Handlebars 风格变量（双花括号）
    // 支持 SillyTavern 标准宏
    const macroMap: Record<string, string> = {
        persona: vars.persona || '',
        char: vars.charDescription || vars.charName || '',
        scenario: vars.scenario || '',
        worldInfoBefore: vars.worldInfoBefore || '',
        worldInfoAfter: vars.worldInfoAfter || '',
        worldInfoScenarios: vars.worldInfoScenarios || '',
        user: vars.userName || '',
        charName: vars.charName || '',
        model: vars.modelName || '',
    };
    // 合并自定义变量
    for (const [k, v] of Object.entries(vars)) {
        if (!macroMap[k] && v) macroMap[k] = v;
    }
    for (const [key, value] of Object.entries(macroMap)) {
        if (!value) continue;
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
        storyString = storyString.replace(regex, value);
    }

    return storyString.trim();
};

/**
 * 获取 Context 模板中 chat_start 文本
 * chat_start 在聊天历史开头显示，标记对话开始
 */
export const 获取ChatStart文本 = (context: Context模板结构): string => {
    return (context.chat_start || '').trim();
};

/**
 * 获取 Context 模板中 example_separator 文本
 * 用于分隔角色示例对话和其他内容
 */
export const 获取ExampleSeparator = (context: Context模板结构): string => {
    return (context.example_separator || '').trim();
};

// ─── System Prompt 模板处理 ───────────────────────────────

/**
 * 判断 System Prompt 模板是否有效（有 content 或 post_history）
 */
export const 系统提示词模板有效 = (sysprompt: SystemPrompt模板结构 | null | undefined): boolean => {
    if (!sysprompt) return false;
    return Boolean(
        (typeof sysprompt.content === 'string' && sysprompt.content.trim())
        || (typeof sysprompt.post_history === 'string' && sysprompt.post_history.trim())
    );
};

/**
 * 获取主系统提示词内容
 * 当 sysprompt 启用时替代预设中的 'main' 标识符提示词
 */
export const 获取主系统提示词 = (sysprompt: SystemPrompt模板结构 | null | undefined): string => {
    if (!sysprompt) return '';
    return (sysprompt.content || '').trim();
};

/**
 * 获取 post_history 提示词内容
 * 在聊天历史之后注入
 */
export const 获取PostHistory提示词 = (sysprompt: SystemPrompt模板结构 | null | undefined): string => {
    if (!sysprompt) return '';
    return (sysprompt.post_history || '').trim();
};

// ─── Reasoning 模板处理 ───────────────────────────────────

/**
 * 使用 Reasoning 模板格式化推理/思维块
 * 格式: prefix + reasoning + suffix + separator + content
 * 无推理时直接返回原内容
 */
export const 使用Reasoning模板格式化 = (params: {
    reasoning: string | null | undefined;
    content: string;
    template: Reasoning模板结构 | null | undefined;
    vars?: {
        userName?: string;
        charName?: string;
    };
}): { formatted: string; contentOnly: string } => {
    const { reasoning, content, template, vars = {} } = params;

    // 无推理内容或无模板配置 → 直接返回原文
    if (!reasoning || !template?.prefix || !template.suffix) {
        return { formatted: content, contentOnly: content };
    }

    let prefix = template.prefix || '';
    let suffix = template.suffix || '';
    let separator = template.separator || '';

    // 应用宏替换
    prefix = 替换模板宏(prefix, vars);
    suffix = 替换模板宏(suffix, vars);
    separator = 替换模板宏(separator, vars);

    const formatted = `${prefix}${reasoning}${suffix}${separator}${content}`;
    return { formatted, contentOnly: content };
};

/**
 * 从文本中解析推理块
 * 根据 prefix/suffix 从 AI 输出文本中提取推理内容
 */
export const 从文本解析推理块 = (params: {
    text: string;
    template: Reasoning模板结构 | null | undefined;
    strict?: boolean; // 是否要求推理块在文本开头
}): { reasoning: string; content: string } | null => {
    const { text, template, strict = true } = params;
    if (!template?.prefix || !template.suffix) return null;

    // 转义正则特殊字符
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixEsc = escapeRegex(template.prefix);
    const suffixEsc = escapeRegex(template.suffix);

    try {
        const regex = new RegExp(
            `${strict ? '^\\s*?' : ''}${prefixEsc}(.*?)${suffixEsc}`,
            's'
        );
        let reasoning = '';
        let didMatch = false;
        const content = String(text).replace(regex, (_match, capture) => {
            didMatch = true;
            reasoning = capture;
            return '';
        });

        if (didMatch) {
            return {
                reasoning: reasoning.trim(),
                content: content.trim(),
            };
        }
    } catch {
        // 正则构建失败时静默返回
    }
    return null;
};

// ─── 组装辅助：将模板集成到消息链 ──────────────────────────

export interface 模板增强消息 {
    role: 'system' | 'user' | 'assistant';
    content: string;
    /** 标记消息来源，用于后处理 */
    source: 'sysprompt_main' | 'sysprompt_post_history' | 'context_story_string' |
            'context_chat_start' | 'instruct_wrapped' | 'reasoning_formatted' |
            'worldbook' | 'preset' | 'history' | 'latest_input' | 'persona';
    /** 可选的发送者名称，用于 instruct names_behavior */
    senderName?: string;
}

/**
 * 判断预设是否包含有效的附加模板
 */
export const 预设包含附加模板 = (preset: {
    instruct?: Instruct模板结构;
    context?: Context模板结构;
    sysprompt?: SystemPrompt模板结构;
    reasoning?: Reasoning模板结构;
}): boolean => {
    return Boolean(preset.instruct || preset.context || preset.sysprompt || preset.reasoning);
};
