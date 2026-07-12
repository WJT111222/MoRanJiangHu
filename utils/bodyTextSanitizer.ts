const 标准游戏时间真值行规则 = /^(?:此时|此刻|当前(?:时间|时刻)?|现在(?:时间)?|时间)\s*(?:是|为|[:：])?\s*["“”']?\d{1,4}:\d{2}:\d{2}:\d{2}:\d{2}["“”']?\s*[。.!！?？]?$/u;

export const 是否裸标准游戏时间行 = (line: string): boolean => (
    标准游戏时间真值行规则.test((line || '').trim())
);

export const 检测裸标准游戏时间行 = (body: string): string | null => {
    const lines = (body || '').replace(/\r\n/g, '\n').split('\n');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (是否裸标准游戏时间行(line)) return line;
    }
    return null;
};

// ── 正文段泄漏检测（供正文优化 bodyPolish 复用，与 storyResponseParser 的逻辑保持一致）──
// 酒馆预设或模型偶尔把变量命令/规划/选项/动态世界等内容混进正文段，正文优化渲染前必须剥离。

// 变量命令路径标签行：如 【环境.时间】、【俞月荷.好感度】=62
const 变量命令路径标签行规则 = /^【\s*[^】\n]*(?:[.．][^】\n]+|\[\s*\d+\s*\])[^】\n]*】\s*(?:[=＝].*)?$/u;
// 变量命令动词行：如 set 环境.时间 = ...、push 社交[0].记忆 {...
const 变量命令动词行规则 = /^(?:[-*•]\s*|\d+[.)、]\s*)?(?:add|set|push|delete)\s+[^\s=＝]+/i;
// 【标签】= / push / set 形式的赋值行
const 变量命令赋值行规则 = /^【\s*[^】\n]+】\s*(?:[=＝]|\bpush\b|\bset\b|\badd\b|\bdelete\b)/iu;
// markdown 列表形式的路径赋值，如 - 角色.内力: 89 -> 69、- 社交[0].好感度: 40 -> 45
const 路径赋值列表行规则 = /^[-*•]\s*[^\s:：（(]*(?:[.．][^\s:：（(]+|\[\s*\d+\s*\])[^\s:：（(]*\s*[:：]/u;

export const 是否变量命令泄漏行 = (line: string): boolean => {
    const text = (line || '').trim();
    if (!text) return false;
    return 变量命令路径标签行规则.test(text)
        || 变量命令动词行规则.test(text)
        || 变量命令赋值行规则.test(text)
        || 路径赋值列表行规则.test(text);
};

// 非正文协议标签（正文/角色名标签不在其列）。用于识别混进正文段的协议标签，
// 包括畸形/半开写法（漏掉闭合 `>`，如 `<变量规划`）与英文别名。
const 非正文协议标签别名集合 = new Set<string>([
    '短期记忆', 'shortterm', 'shorttermmemory', 'shortmemory', 'memory', 'summary', 'recap', 'memo',
    '变量规划', 'varplan', 'variableplan', 'variableplanning',
    '剧情规划', 'storyplan', 'storyplanning', 'narrativeplan',
    '命令', 'command', 'commands', 'cmd',
    '行动选项', 'actionoption', 'actionoptions', 'option', 'options', 'choice', 'choices',
    '动态世界', 'dynamicworld', 'worldevent', 'worldevents',
    'thinking', 'think', 'thought', 'thoughts', 'cot'
]);

const 归一化标签名键 = (tagName: string): string => (
    (tagName || '').trim().toLowerCase().replace(/[\s_-]/g, '')
);

const 提取行首标签名 = (line: string): string => {
    const match = (line || '').trim().replace(/[＜〈《]/g, '<').match(/^<\s*\/?\s*([A-Za-z0-9_\u3400-\u9fff]+)/u);
    return match ? (match[1] || '') : '';
};

// 检测混进正文段的非正文协议标签起始行，含畸形/半开标签（如 `<变量规划`、`<options>`、`</短期记忆`）。
export const 是否畸形非正文协议标签行 = (line: string): boolean => {
    const tagToken = 提取行首标签名(line);
    if (!tagToken) return false;
    if (归一化标签名键(tagToken) === '正文' || 归一化标签名键(tagToken) === 'body') return false;
    return 非正文协议标签别名集合.has(归一化标签名键(tagToken));
};

// 综合判断：某一行是否属于“应从正文段剥离的非正文内容”。
export const 是否正文段泄漏行 = (line: string): boolean => (
    是否变量命令泄漏行(line) || 是否畸形非正文协议标签行(line)
);
