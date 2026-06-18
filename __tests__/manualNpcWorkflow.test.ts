import { describe, expect, it, vi } from 'vitest';
import { 创建手动NPC工作流 } from '../hooks/useGame/manualNpcWorkflow';
import { 规范化社交列表 } from '../hooks/useGame/stateTransforms';

describe('手动 NPC 工作流', () => {
    it('删除门派同门 NPC 时同步移除玩家门派重要成员', () => {
        let social: any[] = [
            {
                id: 'NPC002',
                姓名: '杨承岳',
                来源: '玩家门派.重要成员'
            },
            {
                id: 'npc_manual_1',
                姓名: '路人甲'
            }
        ];
        let sect: any = {
            ID: 'Org001',
            名称: '杨家堡',
            重要成员: [
                { id: 'NPC002', 姓名: '杨承岳', 性别: '男', 年龄: 48, 身份: '堡主', 境界: '先天', 简介: '' },
                { id: 'NPC003', 姓名: '杨若雪', 性别: '女', 年龄: 19, 身份: '弟子', 境界: '开脉', 简介: '' }
            ]
        };
        const autoSave = vi.fn();
        const workflow = 创建手动NPC工作流({
            获取环境: () => ({}),
            环境时间转标准串: () => '',
            规范化社交列表: (list) => list,
            设置社交: (updater: any) => {
                social = typeof updater === 'function' ? updater(social) : updater;
            },
            获取玩家门派: () => sect,
            设置玩家门派: (updater: any) => {
                sect = typeof updater === 'function' ? updater(sect) : updater;
            },
            执行社交自动存档: autoSave,
            保存图片资源: async (dataUrl: string) => dataUrl
        });

        workflow.deleteNpcManually('NPC002');

        expect(social.map((npc) => npc.姓名)).toEqual(['路人甲']);
        expect(sect.重要成员.map((member: any) => member.姓名)).toEqual(['杨若雪']);
        expect(autoSave).toHaveBeenCalledTimes(1);
        expect(autoSave).toHaveBeenCalledWith(social, sect);
    });

    it('保存 NPC 时保留男娘/扶她性别以及手动编辑的背景天赋', () => {
        let social: any[] = [
            {
                id: 'npc_custom_femboy',
                姓名: '沈清辞',
                性别: '男娘',
                年龄: 19,
                身份: '宗门乐师',
                简介: '以柔雅装束示人的少年。',
                出身背景: { 名称: '梨园旧客', 描述: '自幼学艺。', 效果: '表演与社交更敏锐。' },
                天赋列表: [{ 名称: '玲珑声线', 描述: '嗓音清亮。', 效果: '更易安抚人心。' }]
            }
        ];
        const autoSave = vi.fn();
        const workflow = 创建手动NPC工作流({
            获取环境: () => ({}),
            环境时间转标准串: () => '',
            规范化社交列表,
            设置社交: (updater: any) => {
                social = typeof updater === 'function' ? updater(social) : updater;
            },
            执行社交自动存档: autoSave,
            保存图片资源: async (dataUrl: string) => dataUrl
        });

        workflow.updateNpcManually('npc_custom_femboy', {
            ...social[0],
            性别: '扶她',
            出身背景: { 名称: '月下旧族', 描述: '手动改写后的背景。', 效果: '保留玩家编辑。' },
            天赋列表: [{ 名称: '月影灵姿', 描述: '身法轻盈。', 效果: '潜行更稳。' }]
        } as any);

        expect(social[0].性别).toBe('扶她');
        expect(social[0].出身背景).toMatchObject({ 名称: '月下旧族', 描述: '手动改写后的背景。', 效果: '保留玩家编辑。' });
        expect(social[0].天赋列表).toEqual([{ 名称: '月影灵姿', 描述: '身法轻盈。', 效果: '潜行更稳。' }]);
        expect(autoSave).toHaveBeenCalledTimes(1);
    });
});
