import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string): string => (
    readFileSync(resolve(process.cwd(), path), 'utf8')
);

describe('image manager queue tab composition', () => {
    it('does not stack the desktop queue tab with a separate history tab', () => {
        const source = readSource('components/features/Social/ImageManagerModal.tsx');

        expect(source).not.toContain("activeTab === 'queue' && <>{renderQueueTab()}<div className=\"mt-6\">{renderHistoryTab()}</div></>");
        expect(source).toContain("activeTab === 'queue' && renderHistoryTab(true)");
        expect(source).toContain('实时队列状态');
    });

    it('does not stack the mobile queue tab with a separate history tab', () => {
        const source = readSource('components/features/Social/mobile/MobileImageManagerModal.tsx');

        expect(source).not.toContain('return <><QueueTabContent {...propsForTabs} /><div className="mt-4"><HistoryTabContent {...propsForTabs} /></div></>;');
        expect(source).toContain('return <HistoryTabContent {...propsForTabs} queueMode />;');
        expect(source).toContain('下方继续沿用生成历史框架展示完整记录。');
    });
});
