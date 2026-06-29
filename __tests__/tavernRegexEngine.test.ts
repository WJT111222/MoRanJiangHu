import { describe, expect, it } from 'vitest';
import { 对AI输出执行酒馆正则 } from '../utils/tavernRegexEngine';

describe('tavernRegexEngine', () => {
    it('keeps AI output protocol text free of tavern HTML and JS replacement fragments', () => {
        const extensions = {
            regex_scripts: [
                {
                    scriptName: '安全清理测试',
                    findRegex: '/需要清理/g',
                    replaceString: '已清理',
                    placement: [2]
                },
                {
                    scriptName: 'HTML美化测试',
                    findRegex: '/冲突即将爆发/g',
                    replaceString: '<!-- 结尾停留在冲突即将爆发的边缘 -->',
                    placement: [2]
                },
                {
                    scriptName: 'JS交互测试',
                    findRegex: '/帷帽/g',
                    replaceString: '<script>window.parent.postMessage("x","*")</script>',
                    placement: [2]
                }
            ]
        };

        const result = 对AI输出执行酒馆正则(
            '【旁白】需要清理。冲突即将爆发，帷帽微动。',
            extensions
        );

        expect(result).toBe('【旁白】已清理。冲突即将爆发，帷帽微动。');
        expect(result).not.toContain('<!--');
        expect(result).not.toContain('<script>');
    });
});
