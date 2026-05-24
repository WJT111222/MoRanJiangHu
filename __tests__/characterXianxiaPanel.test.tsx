import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterProfileCard from '../components/features/Character/CharacterProfileCard';
import MobileCharacter from '../components/features/Character/MobileCharacter';
import { 默认游戏设置 } from '../utils/gameSettings';

const makeCharacter = () => ({
    姓名: '顾青玄',
    称号: '无称号',
    性别: '男',
    年龄: 18,
    出生日期: '1-1',
    外貌: '眉目清朗。',
    性格: '沉稳。',
    境界: '炼气三层',
    境界层级: 3,
    出身背景: { 名称: '散修', 描述: '山中散修。', 效果: '悟性略高' },
    天赋列表: [],
    力量: 3,
    敏捷: 3,
    体质: 3,
    根骨: 10,
    悟性: 10,
    福源: 5,
    当前负重: 0,
    最大负重: 100,
    当前精力: 100,
    最大精力: 100,
    当前内力: 50,
    最大内力: 50,
    当前饱腹: 100,
    最大饱腹: 100,
    当前口渴: 100,
    最大口渴: 100,
    头部当前血量: 22,
    头部最大血量: 22,
    头部状态: '正常',
    胸部当前血量: 32,
    胸部最大血量: 32,
    胸部状态: '正常',
    腹部当前血量: 29,
    腹部最大血量: 29,
    腹部状态: '正常',
    左手当前血量: 16,
    左手最大血量: 16,
    左手状态: '正常',
    右手当前血量: 16,
    右手最大血量: 16,
    右手状态: '正常',
    左腿当前血量: 16,
    左腿最大血量: 16,
    左腿状态: '正常',
    右腿当前血量: 16,
    右腿最大血量: 16,
    右腿状态: '正常',
    装备: {
        头部: '无',
        胸部: '无',
        背部: '无',
        腰部: '无',
        腿部: '无',
        足部: '无',
        手部: '无',
        主武器: '无',
        副武器: '无',
        暗器: '无',
        坐骑: '无'
    },
    物品列表: [],
    功法列表: [],
    技艺: [],
    玩家BUFF: [],
    金钱: { 金元宝: 0, 银子: 0, 铜钱: 0 },
    灵根: '火木双灵根',
    灵根资质: '上品',
    当前灵力: 10,
    最大灵力: 10,
    当前神识: 15,
    最大神识: 15,
    丹田状态: '稳固',
    道基状态: '未筑基',
    心魔值: 2,
    功德: 7,
    业力: 1
} as any);

describe('主角仙侠面板', () => {
    it('默认字数要求为 1500', () => {
        expect(默认游戏设置.字数要求).toBe(1500);
    });

    it('桌面角色档案显示仙侠属性', () => {
        const html = renderToStaticMarkup(<CharacterProfileCard character={makeCharacter()} />);
        expect(html).toContain('修真档案');
        expect(html).toContain('火木双灵根');
        expect(html).toContain('10/10');
        expect(html).toContain('15/15');
        expect(html).toContain('稳固');
        expect(html).toContain('未筑基');
    });

    it('移动角色档案显示仙侠属性', () => {
        const html = renderToStaticMarkup(
            <MobileCharacter
                character={makeCharacter()}
                gameConfig={{ ...默认游戏设置, 启用修炼体系: true }}
                onClose={() => undefined}
            />
        );
        expect(html).toContain('仙侠修真');
        expect(html).toContain('火木双灵根');
        expect(html).toContain('灵根资质');
        expect(html).toContain('10/10');
        expect(html).toContain('15/15');
        expect(html).toContain('功德');
        expect(html).toContain('业力');
    });
});
