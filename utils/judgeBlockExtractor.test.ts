import { describe, expect, it } from 'vitest';

import { 提取并清理Judge区块 } from './judgeBlockExtractor';

describe('提取并清理Judge区块', () => {
    it('extracts a standard judge block and preserves trailing body', () => {
        const result = 提取并清理Judge区块([
            '【旁白】前文。',
            '<judge>',
            '判定类型：洞察',
            '判定值：8',
            '</judge>',
            '【判定】洞察成功。',
            '【旁白】后续正文。'
        ].join('\n'));

        expect(result.blocks).toEqual(['判定类型：洞察\n判定值：8']);
        expect(result.cleanText).toContain('【旁白】前文。');
        expect(result.cleanText).toContain('【判定】洞察成功。');
        expect(result.cleanText).toContain('【旁白】后续正文。');
        expect(result.cleanText).not.toContain('<judge>');
    });

    it('treats a repeated opening tag as the malformed closing boundary', () => {
        const result = 提取并清理Judge区块([
            '【旁白】前文。',
            '<judge>',
            '判定类型：洞察',
            '判定值：8',
            '<judge>',
            '【判定】洞察成功。',
            '【旁白】后续正文。'
        ].join('\n'));

        expect(result.blocks).toEqual(['判定类型：洞察\n判定值：8']);
        expect(result.cleanText).toContain('【判定】洞察成功。');
        expect(result.cleanText).toContain('【旁白】后续正文。');
    });

    it('removes only an unclosed opening tag instead of swallowing trailing body', () => {
        const result = 提取并清理Judge区块([
            '【旁白】前文。',
            '<judge>',
            '【判定】洞察成功。',
            '【旁白】后续正文。'
        ].join('\n'));

        expect(result.blocks).toEqual([]);
        expect(result.cleanText).toContain('【判定】洞察成功。');
        expect(result.cleanText).toContain('【旁白】后续正文。');
        expect(result.cleanText).not.toContain('<judge>');
    });

    it('supports HTML-escaped judge tags', () => {
        const result = 提取并清理Judge区块([
            '【旁白】前文。',
            '&lt;judge&gt;',
            '判定类型：洞察',
            '&lt;/judge&gt;',
            '【旁白】后续正文。'
        ].join('\n'));

        expect(result.blocks).toEqual(['判定类型：洞察']);
        expect(result.cleanText).toContain('【旁白】后续正文。');
        expect(result.cleanText).not.toContain('&lt;judge&gt;');
    });
});
