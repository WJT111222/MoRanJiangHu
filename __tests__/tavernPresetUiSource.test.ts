import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { 创意工坊模块列表 } from '../data/creativeWorkshopModules';
import { 规范化游戏设置 } from '../utils/gameSettings';
import { 应用酒馆预设条目改动, 构建酒馆预设选择列表, 酒馆预设条目可删除 } from '../utils/tavernPresetSelection';
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

    it('编辑创意工坊酒馆预设时保存为玩家本地副本，不改写工坊默认项', () => {
        const workshopEntry = 构建酒馆预设选择列表([], [{
            id: 'tavern-preset-double',
            type: 'tavern_preset',
            title: '双人成行',
            subtitle: '酒馆预设',
            description: '创意工坊预设',
            tags: [],
            payload: {},
            injectionPreview: [],
            source: 'cloud',
            tavernPreset: minimalPreset,
        }], {})[0];

        const editedPreset = {
            ...minimalPreset,
            prompt_order: [{
                character_id: 100001,
                order: [{ identifier: 'main', enabled: false }],
            }],
        };

        const result = 应用酒馆预设条目改动({
            form: {
                启用酒馆预设模式: true,
                酒馆预设列表: [],
                当前酒馆预设ID: workshopEntry.id,
                酒馆预设: minimalPreset,
                酒馆预设名称: workshopEntry.名称,
                酒馆预设角色ID: 100001,
            } as any,
            localPresetList: [],
            selectedEntry: workshopEntry,
            patch: { 预设: editedPreset },
            generateId: () => 'preset_local_double',
            now: () => 123456,
            resolveRoleId: (preset, value) => (
                preset?.prompt_order.some((group) => group.character_id === value) ? Number(value) : null
            ),
        });

        expect(result?.createdLocalCopy).toBe(true);
        expect(result?.nextConfig.当前酒馆预设ID).toBe('preset_local_double');
        expect(result?.nextConfig.酒馆预设列表).toHaveLength(1);
        expect(result?.nextConfig.酒馆预设列表?.[0]).toMatchObject({
            id: 'preset_local_double',
            名称: '双人成行',
            来源: '玩家自行上传',
            工坊模块ID: 'tavern-preset-double',
            工坊来源: 'cloud',
        });
        expect(result?.nextConfig.酒馆预设列表?.[0]?.预设.prompt_order[0].order[0].enabled).toBe(false);
        expect(workshopEntry.预设?.prompt_order[0].order[0].enabled).toBe(true);
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
