import { describe, expect, it } from 'vitest';
import { 净化角色对白行, 解析正文日志文本 } from '../hooks/useGame/bodyPolish';

describe('body polish dialogue parsing', () => {
    it('keeps dialogue when the speaker tag and quoted line are split across lines', () => {
        const logs = 净化角色对白行(解析正文日志文本([
            '【旁白】',
            '半空中的主神光球依然在散发着冷光。',
            '',
            '【主角】',
            '“醒醒。别睡了。”',
            '',
            '【俞月荷】',
            '“你……杨培强？你怎么会在这里？”',
            '',
            '【旁白】',
            '她抬头看着你，等待着你的决定。'
        ].join('\n')));

        expect(logs).toEqual([
            { sender: '旁白', text: '半空中的主神光球依然在散发着冷光。' },
            { sender: '主角', text: '醒醒。别睡了。' },
            { sender: '俞月荷', text: '你……杨培强？你怎么会在这里？' },
            { sender: '旁白', text: '她抬头看着你，等待着你的决定。' }
        ]);
    });
});
