import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const readSource = (relativePath: string): string => (
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
);

describe('酒馆预设 UI 源码约束', () => {
    it('设置页当前预设下拉框不再追加创意工坊可选预设分组', () => {
        const source = readSource('components/features/Settings/TavernPresetSettings.tsx');

        expect(source).not.toContain('创意工坊可选预设');
        expect(source).not.toContain('workshopPresetOptions');
        expect(source).not.toContain('应用工坊预设');
    });

    it('创意工坊酒馆预设入口使用预览预设文案', () => {
        const source = readSource('components/features/Workshop/CreativeWorkshopModal.tsx');

        expect(source).toContain('预览预设');
        expect(source).toContain('PRESET PREVIEW');
    });
});
