import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { 创意工坊模块列表 } from '../data/creativeWorkshopModules';
import { 规范化游戏设置 } from '../utils/gameSettings';
import { 构建酒馆预设选择列表, 酒馆预设条目可删除 } from '../utils/tavernPresetSelection';
import type { 酒馆预设条目结构 } from '../types';

const minimalPreset = {
    prompts: [{ identifier: 'main', name: 'Main', role: 'system' as const, content: 'content' }],
    prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }],
};

const readSource = (relativePath: string): string => (
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
);

describe('酒馆预设 UI 源码约束', () => {
    it('当前预设下拉框会始终合并创意工坊酒馆预设候选', () => {
        const candidates = 构建酒馆预设选择列表([], 创意工坊模块列表);

        expect(candidates.some((entry) => entry.id === 'workshop:tavern-preset-izumi-0623')).toBe(true);
        expect(candidates.find((entry) => entry.id === 'workshop:tavern-preset-izumi-0623')).toMatchObject({
            名称: 'Izumi 0623',
            来源: '创意工坊',
            可删除: false,
        });
    });

    it('本地上传预设保留在下拉候选中且允许删除', () => {
        const localEntry: 酒馆预设条目结构 = {
            id: 'local-upload',
            名称: '玩家上传预设',
            预设: minimalPreset,
            来源: '玩家自行上传',
        };
        const candidates = 构建酒馆预设选择列表([localEntry], 创意工坊模块列表);

        expect(candidates[0]).toMatchObject({ id: 'local-upload', 可删除: true });
        expect(酒馆预设条目可删除(localEntry)).toBe(true);
    });

    it('保存设置时保留已加载的创意工坊酒馆预设选择', () => {
        const normalized = 规范化游戏设置({
            启用酒馆预设模式: true,
            酒馆预设列表: [{
                id: 'local-upload',
                名称: '玩家上传预设',
                预设: minimalPreset,
                来源: '玩家自行上传',
            }],
            当前酒馆预设ID: 'workshop:tavern-preset-izumi-0623',
            酒馆预设: minimalPreset,
            酒馆预设名称: 'Izumi 0623',
            酒馆预设角色ID: 100001,
        });

        expect(normalized.当前酒馆预设ID).toBe('workshop:tavern-preset-izumi-0623');
        expect(normalized.酒馆预设名称).toBe('Izumi 0623');
        expect(normalized.酒馆预设?.prompts[0]).toMatchObject({ identifier: 'main', content: 'content' });
        expect(normalized.酒馆预设角色ID).toBe(100001);
    });

    it('源码包含本地上传删除前确认与工坊预设删除保护', () => {
        const source = readSource('components/features/Settings/TavernPresetSettings.tsx');

        expect(source).toContain('window.confirm');
        expect(source).toContain('创意工坊预设不可删除');
    });

    it('设置页从完整创意工坊服务同步社区与本地酒馆预设', () => {
        const source = readSource('components/features/Settings/TavernPresetSettings.tsx');

        expect(source).toContain('列出创意工坊模块');
    });

    it('创意工坊酒馆预设入口使用预览预设文案', () => {
        const source = readSource('components/features/Workshop/CreativeWorkshopModal.tsx');

        expect(source).toContain('预览预设');
        expect(source).toContain('PRESET PREVIEW');
    });
});
