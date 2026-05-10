import { describe, expect, it } from 'vitest';
import { 规范化角色物品容器映射 } from '../hooks/useGame/stateTransforms';

describe('角色装备标准化', () => {
    it('不会为缺失物品对象的装备栏引用生成自动补全占位装备', () => {
        const role = 规范化角色物品容器映射({
            姓名: '杨培强',
            装备: {
                胸部: '朴素青衫'
            },
            物品列表: []
        } as any);

        expect((role.装备 as any).胸部).toBe('无');
        expect(role.物品列表.some((item: any) => String(item?.描述 || '').includes('自动补全'))).toBe(false);
        expect(role.物品列表.some((item: any) => item?.名称 === '朴素青衫')).toBe(false);
    });
});
