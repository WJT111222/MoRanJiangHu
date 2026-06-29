/**
 * 酒馆（SillyTavern）沙箱 iframe 桥接引擎
 *
 * 将含有 JS 交互的正则脚本产出在沙箱 iframe 中安全渲染，
 * 通过 postMessage 桥接协议将 iframe 内的交互行为映射到 React App API。
 *
 * 架构：
 * ┌─ React App ─────────────────────────────┐
 * │  SandboxedCard                           │
 * │  ┌─ sandboxed iframe ────────────────┐   │
 * │  │  用户 HTML + <script>              │   │
 * │  │  + bridge-shim.js (注入的垫片)     │   │
 * │  │    window.parent.*  →  postMessage │   │
 * 佛山  └──────────────────────────────────┘   │
 * └──────────────────────────────────────────┘
 *
 * 安全保证：
 * - sandbox="allow-scripts" 不带 allow-same-origin → JS 无法访问主页 DOM/Storage
 * - 桥接白名单：只转发预定义的 action 类型
 * - 外部脚本加载(<script src) 的脚本不进入沙箱，由分类层"仍跳过"
 */

import DOMPurify from 'dompurify';
import type { 酒馆沙箱动作, 酒馆沙箱动作类型 } from '../models/system';

// ─── 主题快照 ───

/** 传递给 iframe 的主题变量快照 */
export interface 主题快照 {
    /** CSS 自定义属性键值对（如 --c-ink-black: "248 244 232"） */
    variables: Record<string, string>;
    /** 当前 data-theme 值（如 'ink', 'day' 等） */
    dataTheme: string;
    /** 是否为浅色主题 */
    isLight: boolean;
    /** 主文字字体 */
    fontFamily: string;
    /** 主文字大小 */
    fontSize: string;
    /** 主文字颜色 */
    textColor: string;
}

// ─── DOMPurify 配置 ───

/**
 * 用于 HTML 美化脚本产出的 DOMPurify 配置
 * 允许常见 HTML 标签但禁止 script/iframe/object/embed
 */
const HTML_BEAUTIFY_PURIFY_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: [
        'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'details', 'summary', 'button', 'a', 'img', 'figure', 'figcaption',
        'blockquote', 'pre', 'code', 'em', 'strong', 'b', 'i', 'u', 's', 'del', 'ins',
        'mark', 'small', 'sub', 'sup', 'abbr', 'cite', 'dfn', 'kbd', 'samp', 'var',
        'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
        'style', 'input', 'label', 'fieldset', 'legend', 'datalist',
        'select', 'option', 'textarea', 'form', 'progress', 'meter',
    ],
    ALLOWED_ATTR: [
        'class', 'id', 'style', 'title', 'lang', 'dir',
        'data-action', 'data-value', 'data-target', 'data-option-text',
        'href', 'src', 'alt', 'width', 'height', 'loading',
        'open', 'type', 'name', 'value', 'placeholder', 'disabled',
        'role', 'aria-label', 'aria-expanded', 'aria-hidden',
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet', 'form'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
};

/** 清洗 HTML 美化脚本产出的 HTML（不含 JS 的安全渲染） */
export const 清洗HTML美化产出 = (html: string): string => {
    return DOMPurify.sanitize(html, HTML_BEAUTIFY_PURIFY_CONFIG);
};

// ─── 桥接垫片 JS ───

/**
 * 桥接垫片 JS 代码——注入到 iframe 的 <head> 中
 *
 * 核心功能：
 * 1. 定义 window.__bridge 对象，将 window.parent.* 调用替换为 postMessage
 * 2. 在 DOMContentLoaded 时发送 'ready' 通知
 * 3. 监听来自 React 的 postMessage 回复（主题变量等）
 * 4. 声明式 data-action 按钮：自动为 [data-action="inject"] 绑定点击事件
 */
const BRIDGE_SHIM_JS = `
(function() {
    'use strict';

    // ─── 主题变量缓存 ───
    var __themeCache = {
        textColor: '{{textColor}}',
        fontFamily: '{{fontFamily}}',
        fontSize: '{{fontSize}}',
        isLight: {{isLight}},
        variables: {}
    };

    // ─── 桥接 API ───
    window.__bridge = {
        querySelector: function(selector) {
            if (selector === '#send_textarea') {
                return {
                    value: '',
                    dispatchEvent: function() {},
                    focus: function() {},
                    set _v(v) { this.value = v; },
                    get _v() { return this.value; }
                };
            }
            return null;
        },
        getComputedStyle: function() {
            return {
                getPropertyValue: function(prop) {
                    if (prop && prop.indexOf('--SmartTheme') === 0) {
                        var key = prop.replace('--SmartTheme', '').replace(/([A-Z])/g, '-$1').toLowerCase();
                        return __themeCache.variables[prop] || __themeCache.textColor || '';
                    }
                    // 颜色映射
                    if (prop === 'color') return __themeCache.textColor;
                    if (prop === 'font-family') return __themeCache.fontFamily;
                    if (prop === 'font-size') return __themeCache.fontSize;
                    return '';
                }
            };
        },
        triggerSlash: function(cmd) {
            if (cmd && cmd.indexOf('/setinput') === 0) {
                var text = cmd.replace(/^\\/setinput\\s+/, '');
                window.parent.postMessage({
                    type: 'tavern_sandbox',
                    action: 'inject_text',
                    value: text
                }, '*');
                return;
            }
            // 其他斜杠命令不桥接
        }
    };

    // ─── window.parent 拦截 ───
    // 为 window.parent 创建一个 Proxy，将 document.querySelector / getComputedStyle / triggerSlash
    // 重定向到 __bridge
    try {
        var _origParent = window.parent;
        // 注意：sandbox 不带 allow-same-origin 时 window.parent 无法访问，所以这里只在同源时备用
        if (_origParent && _origParent !== window) {
            // 无法覆盖 window.parent（只读），所以我们在脚本中通过字符串替换处理
        }
    } catch(e) {}

    // ─── postMessage 发送 ───
    function sendMessage(data) {
        try {
            window.parent.postMessage(data, '*');
        } catch(e) {}
    }

    // ─── 注入文本到输入框 ───
    function injectText(text) {
        sendMessage({ type: 'tavern_sandbox', action: 'inject_text', value: text });
    }

    // ─── 请求调整 iframe 高度 ───
    function resizeFrame() {
        try {
            var h = document.body ? document.body.scrollHeight : 0;
            sendMessage({ type: 'tavern_sandbox', action: 'resize', height: h });
        } catch(e) {}
    }

    // ─── 监听来自 React 的消息 ───
    window.addEventListener('message', function(event) {
        var data = event.data;
        if (!data || data.type !== 'tavern_sandbox_response') return;

        if (data.action === 'theme_update') {
            if (data.theme) {
                __themeCache.textColor = data.theme.textColor || __themeCache.textColor;
                __themeCache.fontFamily = data.theme.fontFamily || __themeCache.fontFamily;
                __themeCache.fontSize = data.theme.fontSize || __themeCache.fontSize;
                __themeCache.isLight = data.theme.isLight != null ? data.theme.isLight : __themeCache.isLight;
                if (data.theme.variables) {
                    Object.assign(__themeCache.variables, data.theme.variables);
                }
            }
            // 触发自定义事件让预设脚本感知
            document.dispatchEvent(new CustomEvent('tavern-theme-change'));
        }
    });

    // ─── 声明式 data-action 按钮绑定 ───
    function bindDataActionButtons() {
        var buttons = document.querySelectorAll('[data-action="inject"]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function(e) {
                e.preventDefault();
                var value = this.getAttribute('data-value') || this.getAttribute('data-option-text') || this.textContent || '';
                if (value) injectText(value.trim());
            });
        }
        // send action: inject and send immediately
        var sendButtons = document.querySelectorAll('[data-action="send"]');
        for (var j = 0; j < sendButtons.length; j++) {
            sendButtons[j].addEventListener('click', function(e) {
                e.preventDefault();
                var value = this.getAttribute('data-value') || this.getAttribute('data-option-text') || this.textContent || '';
                if (value) sendMessage({ type: 'tavern_sandbox', action: 'send_text', value: value.trim() });
            });
        }
    }

    // ─── iframe 高度自适应 ───
    var resizeRAF = null;
    function scheduleResize() {
        if (resizeRAF) return;
        resizeRAF = requestAnimationFrame(function() {
            resizeFrame();
            resizeRAF = null;
        });
    }

    // ─── DOMContentLoaded 初始化 ───
    function init() {
        bindDataActionButtons();
        resizeFrame();

        // 监控 DOM 高度变化
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(function() { scheduleResize(); });
            ro.observe(document.body || document.documentElement);
        }

        // details 元素 toggle 时更新高度
        var detailsList = document.querySelectorAll('details');
        for (var k = 0; k < detailsList.length; k++) {
            detailsList[k].addEventListener('toggle', function() {
                setTimeout(scheduleResize, 50);
            });
        }

        // 通知 React 端 iframe 已就绪
        sendMessage({ type: 'tavern_sandbox', action: 'ready' });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();`;

// ─── JS 代码中的 window.parent.* 替换 ───

/**
 * 将预设 JS 代码中的 window.parent.* 调用替换为 __bridge.* 调用
 * 这是桥接的核心——让原始预设 JS 可以不经修改地在沙箱中运行
 */
const 注入桥接替换 = (jsCode: string): string => {
    let result = jsCode;

    // window.parent.document.querySelector('#send_textarea') → __bridge.querySelector('#send_textarea')
    result = result.replace(
        /window\.parent\.document\.querySelector\s*\(\s*['"]#send_textarea['"]\s*\)/g,
        "__bridge.querySelector('#send_textarea')"
    );

    // window.parent.document.querySelector(...) → __bridge.querySelector(...)
    result = result.replace(
        /window\.parent\.document\.querySelector\s*\(/g,
        '__bridge.querySelector('
    );

    // window.parent.document.querySelectorAll(...) → document.querySelectorAll(...)
    // (querySelectorAll 在 iframe 内部 DOM 上可以直接执行，不需要桥接)
    result = result.replace(
        /window\.parent\.document\.querySelectorAll\s*\(/g,
        'document.querySelectorAll('
    );

    // window.parent.getComputedStyle(...) → __bridge.getComputedStyle(...)
    result = result.replace(
        /window\.parent\.getComputedStyle\s*\(/g,
        '__bridge.getComputedStyle('
    );

    // window.parent.triggerSlash(...) → __bridge.triggerSlash(...)
    result = result.replace(
        /window\.parent\.triggerSlash\s*\(/g,
        '__bridge.triggerSlash('
    );

    // window.parent.document.documentElement
    // 替换为 document.documentElement（iframe 内部有自己的 documentElement）
    // 但注入了主题 CSS 变量，所以 CSS 变量读取可以正常工作
    result = result.replace(
        /window\.parent\.document\.documentElement/g,
        'document.documentElement'
    );

    // window.parent.document.body
    result = result.replace(
        /window\.parent\.document\.body/g,
        'document.body'
    );

    // window.frameElement.style.height → 直接发 postMessage
    // 这比较难用简单正则替换，在垫片中 override window.frameElement
    result = result.replace(
        /window\.frameElement\.style\.height\s*=\s*([^;]+);/g,
        '(function(_h){try{window.parent.postMessage({type:"tavern_sandbox",action:"resize",height:parseInt(_h)||0},"*")}catch(e){}})($1);'
    );

    // window.parent.document.body.classList / classList 操作 → 判断亮暗主题
    // 替换为读取 __themeCache.isLight
    result = result.replace(
        /window\.parent\.document\.body\.classList\.(add|remove|toggle|contains)\s*\(\s*['"]lt['"]\s*\)/g,
        (match, method) => {
            if (method === 'contains') return '(__themeCache.isLight)';
            // add/remove/toggle 'lt' → 更新 isLight 标记
            return `(__themeCache.isLight = ${method === 'add' ? 'true' : method === 'remove' ? 'false' : '!__themeCache.isLight'})`;
        }
    );

    // window.parent.document.body.addEventListener('classchange'...) → 不桥接，忽略
    // MutationObserver on window.parent.document → 不桥接

    return result;
};

/**
 * 处理 regex 替换产出中 <script> 标签内的 JS 代码
 * 替换 window.parent.* 为 __bridge.* 调用
 */
const 处理HTML中的脚本 = (html: string): string => {
    return html.replace(
        /<script([^>]*)>([\s\S]*?)<\/script>/gi,
        (match, attrs, jsCode) => {
            const processedJS = 注入桥接替换(jsCode);
            return `<script${attrs}>${processedJS}</script>`;
        }
    );
};

// ─── iframe 文档生成 ───

/**
 * 生成沙箱 iframe 的完整 HTML 文档
 *
 * @param htmlContent 正则替换后的 HTML 产出（可能含 <script>）
 * @param theme 当前主题快照
 * @returns 可用于 iframe srcdoc 的完整 HTML 文档
 */
export const 生成沙箱HTML文档 = (htmlContent: string, theme: 主题快照): string => {
    // 1. 处理 JS 中的 window.parent.* 调用 → __bridge.*
    const bridgeReadyHTML = 处理HTML中的脚本(htmlContent);

    // 2. 构建桥接垫片 JS（填充主题变量）
    const shimJS = BRIDGE_SHIM_JS
        .replace(/\{\{textColor\}\}/g, theme.textColor || '#e6e6e6')
        .replace(/\{\{fontFamily\}\}/g, theme.fontFamily || 'sans-serif')
        .replace(/\{\{fontSize\}\}/g, theme.fontSize || '14px')
        .replace(/\{\{isLight\}\}/g, theme.isLight ? 'true' : 'false');

    // 3. 构建 CSS 变量注入
    const cssVars = Object.entries(theme.variables || {})
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n');

    // 4. 组装完整 HTML 文档
    return `<!DOCTYPE html>
<html data-theme="${theme.dataTheme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
:root {
${cssVars}
  color-scheme: ${theme.isLight ? 'light' : 'dark'};
}
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: ${theme.textColor || '#e6e6e6'};
  font-family: ${theme.fontFamily || 'sans-serif'};
  font-size: ${theme.fontSize || '14px'};
  line-height: 1.6;
  overflow-x: hidden;
  word-break: break-word;
}
/* 酒馆主题兼容变量映射 */
:root {
  --SmartThemeTextColor: ${theme.textColor || '#e6e6e6'};
  --SmartThemeFontColor: ${theme.textColor || '#e6e6e6'};
  --SmartThemeQuoteColor: ${theme.textColor || '#e6e6e6'};
  --SmartThemeBotMesStyleColor: ${theme.isLight ? '#1a1a1a' : '#e6e6e6'};
  --SmartThemeUserMesStyleColor: ${theme.isLight ? '#1a1a1a' : '#e6e6e6'};
  --SmartThemeBlurTintColor: ${theme.isLight ? 'rgba(255,255,255,0.8)' : 'rgba(20,20,20,0.8)'};
}
.mes_text { color: ${theme.textColor || '#e6e6e6'}; }
body.lt { background: #fff; color: #1a1a1a; }
body:not(.lt) { background: transparent; color: ${theme.textColor || '#e6e6e6'}; }
</style>
<script>${shimJS}</script>
</head>
<body>
${bridgeReadyHTML}
</body>
</html>`;
};

// ─── 声明式 data-action 协议 ───

/**
 * 检测 HTML 中是否包含 data-action 声明式交互标记
 * 用于判断是否需要使用 iframe 沙箱渲染
 */
export const 包含声明式交互 = (html: string): boolean => {
    return /data-action\s*=\s*["'](?:inject|send|collapse)["']/i.test(html);
};

/**
 * 检测文本中是否包含 ````html` 代码块（酒馆预设正则替换常见的输出格式）
 */
export const 包含HTML代码块 = (text: string): boolean => {
    return /```html/i.test(text);
};

/**
 * 从文本中提取 ````html` 代码块的内容
 * @returns 提取的 HTML 数组（可能有多个代码块）
 */
export const 提取HTML代码块内容 = (text: string): string[] => {
    const results: string[] = [];
    const regex = /```html\s*\n?([\s\S]*?)```/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        results.push(match[1].trim());
    }
    return results;
};

// ─── 消息动作路由 ───

/** 判断 postMessage 事件是否为合法的沙箱动作 */
export const 是否沙箱动作 = (data: unknown): data is 酒馆沙箱动作 => {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return d.type === 'tavern_sandbox'
        && typeof d.action === 'string'
        && ['inject_text', 'send_text', 'resize', 'get_theme', 'ready'].includes(d.action);
};

/** 安全的沙箱动作类型守卫值列表 */
export const 沙箱动作白名单: 酒馆沙箱动作类型[] = [
    'inject_text',
    'send_text',
    'resize',
    'get_theme',
    'ready',
];

// ─── 主题快照构建 ───

/**
 * 从当前 DOM 读取主题变量构建快照
 * 可在 React 组件中调用以获取当前主题状态
 */
export const 构建当前主题快照 = (): 主题快照 => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    // 读取 CSS 自定义属性
    const variables: Record<string, string> = {};
    // 项目使用的 RGB 三通道变量
    const cssVarNames = [
        '--c-ink-black', '--c-ink-gray', '--c-wuxia-gold',
        '--c-wuxia-gold-dark', '--c-wuxia-cyan', '--c-wuxia-red',
        '--c-paper-white',
    ];
    for (const varName of cssVarNames) {
        const val = computedStyle.getPropertyValue(varName).trim();
        if (val) variables[varName] = val;
    }

    const dataTheme = root.dataset.theme || 'ink';
    const isLight = dataTheme === 'day';
    const textColor = isLight
        ? computedStyle.getPropertyValue('--day-ink-strong')?.trim() || '#1F2937'
        : computedStyle.getPropertyValue('--c-paper-white')?.trim()
            ? `rgb(${computedStyle.getPropertyValue('--c-paper-white').trim()})`
            : '#e6e6e6';

    return {
        variables,
        dataTheme,
        isLight,
        fontFamily: computedStyle.fontFamily || 'sans-serif',
        fontSize: computedStyle.fontSize || '14px',
        textColor,
    };
};

// ─── HTML 产出检测 ───

/**
 * 检测正则替换后的文本是否需要使用 iframe 沙箱渲染
 * 条件：包含 <script> 标签 但不合理跳过的脚本
 */
export const 需要iframe沙箱渲染 = (processedText: string): boolean => {
    // 包含 <script> 标签（不含 src=，因为外部脚本被分类层过滤）
    return /<\s*script\b(?!.*\bsrc\s*=)[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i.test(processedText);
};

/**
 * 检测正则替换后的文本是否包含 HTML 美化内容
 * 需要用 DOMPurify + dangerouslySetInnerHTML 渲染
 */
export const 需要HTML美化渲染 = (processedText: string): boolean => {
    if (需要iframe沙箱渲染(processedText)) return false;
    // 包含 HTML 标签但不含 <script>
    return /<(?:div|span|p|section|details|summary|style|h[1-6]|ul|ol|li|table|blockquote|figure|img|button|a)\b[^>]*>/i.test(processedText);
};
