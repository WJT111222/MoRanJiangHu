import { describe, expect, it } from 'vitest';
import { 解析世界书导入数据 } from '../utils/worldbook';

describe('SillyTavern 世界书导入', () => {
    it('converts object-shaped World Info entries', () => {
        const books = 解析世界书导入数据({
            entries: {
                0: {
                    key: ['青云门'],
                    keysecondary: [],
                    comment: '门派设定',
                    content: '青云门是测试门派。',
                    constant: false,
                    selective: true,
                    order: 100,
                    disable: false,
                    uid: 7
                },
                1: {
                    key: [],
                    keysecondary: [],
                    comment: '常驻规则',
                    content: '这是常驻规则。',
                    constant: true,
                    selective: true,
                    order: 90,
                    disable: false,
                    uid: 8
                }
            },
            originalData: {}
        });

        expect(books).toHaveLength(1);
        expect(books[0].条目).toHaveLength(2);
        expect(books[0].条目[0]).toMatchObject({
            id: '7',
            标题: '门派设定',
            内容: '青云门是测试门派。',
            注入模式: 'match_any',
            关键词: ['青云门'],
            作用域: ['all'],
            启用: true
        });
        expect(books[0].条目[1]).toMatchObject({
            id: '8',
            标题: '常驻规则',
            注入模式: 'always',
            关键词: []
        });
    });
});
