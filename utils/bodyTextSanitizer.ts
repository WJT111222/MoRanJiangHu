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
