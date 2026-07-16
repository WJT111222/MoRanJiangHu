import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TurnItem from '../components/features/Chat/TurnItem';
import { parseStoryRawText } from '../services/ai/storyResponseParser';

describe('Judge 正文解析与界面渲染端到端', () => {
    it('标准闭合 judge 区块之后的正文仍会显示在回合内容中', () => {
        const rawText = [
            '<正文>',
            '【旁白】前文仍然可见。',
            '<judge>',
            '判定类型：洞察',
            '判定值：8',
            '难度值：6',
            '</judge>',
            '【判定】[洞察]辨认来者｜判定值 8/难度 6｜结果=成功',
            '【旁白】判定之后的剧情也必须显示。',
            '</正文>',
            '<短期记忆>玩家完成了一次洞察判定。</短期记忆>'
        ].join('\n');
        const response = parseStoryRawText(rawText);

        const html = renderToStaticMarkup(
            <TurnItem
                response={response}
                turnNumber={1}
                rawJson={rawText}
                onSaveEdit={() => null}
            />
        );

        expect(html).toContain('前文仍然可见');
        expect(html).toContain('辨认来者');
        expect(html).toContain('判定之后的剧情也必须显示');
        expect(html).not.toContain('&lt;judge&gt;');
    });
});
