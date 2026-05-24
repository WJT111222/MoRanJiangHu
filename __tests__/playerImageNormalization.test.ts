import { describe, expect, it } from 'vitest';
import { 规范化角色物品容器映射 } from '../hooks/useGame/stateTransforms';

describe('player image normalization', () => {
    it('repairs an unbound successful player avatar from image history', () => {
        const role = 规范化角色物品容器映射({
            姓名: '刀哥',
            装备: {},
            物品列表: [],
            图片档案: {
                生图历史: [
                    {
                        id: 'avatar-from-history',
                        构图: '头像',
                        状态: 'success',
                        图片URL: 'https://img.example/avatar.webp',
                        生成时间: 1000
                    }
                ]
            }
        } as any);

        expect(role.图片档案?.已选头像图片ID).toBe('avatar-from-history');
    });

    it('repairs an unbound successful player avatar from recent image result', () => {
        const role = 规范化角色物品容器映射({
            姓名: '刀哥',
            装备: {},
            物品列表: [],
            最近生图结果: {
                id: 'avatar-from-recent',
                构图: '头像',
                状态: 'success',
                图片URL: 'https://img.example/recent-avatar.webp',
                生成时间: 1000
            }
        } as any);

        expect(role.图片档案?.已选头像图片ID).toBe('avatar-from-recent');
        expect(role.图片档案?.生图历史?.[0]?.id).toBe('avatar-from-recent');
    });
});
