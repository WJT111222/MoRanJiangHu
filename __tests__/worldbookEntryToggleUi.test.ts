import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('附加世界书条目开关 UI', () => {
    it('提供条目级启用开关和列表状态提示', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'components/features/Worldbook/WorldbookManagerModal.tsx'),
            'utf8'
        );

        expect(source).toContain('启用这个条目');
        expect(source).toContain('checked={selectedEntry.启用 !== false}');
        expect(source).toContain("entry.启用 === false ? '已停用' : '已启用'");
    });
});

