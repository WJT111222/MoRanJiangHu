import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import NovelDecompositionWorkbenchModal from '../components/features/NovelDecomposition/NovelDecompositionWorkbenchModal';

vi.mock('../components/features/Settings/NovelDecompositionSettings', () => ({
    default: () => <div data-testid="novel-decomposition-settings">settings</div>
}));

describe('小说分解工作台布局', () => {
    it('桌面工作台使用接近全屏的可用空间', () => {
        const html = renderToStaticMarkup(
            <NovelDecompositionWorkbenchModal
                open
                settings={{} as any}
                onSave={() => undefined}
                onClose={() => undefined}
            />
        );

        expect(html).toContain('h-[100dvh]');
        expect(html).toContain('md:h-[calc(100dvh-1.5rem)]');
        expect(html).toContain('md:max-w-[calc(100vw-1.5rem)]');
        expect(html).not.toContain('md:max-w-7xl');
        expect(html).not.toContain('md:h-[88vh]');
        expect(html).not.toContain('md:max-h-[92vh]');
    });

    it('章节筛选和分段校对默认展开并用数据集切换替代折叠入口', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'components/features/Settings/NovelDecompositionSettings.tsx'),
            'utf8'
        );

        expect(source).not.toContain('showChapterSection');
        expect(source).not.toContain('showSegmentSection');
        expect(source).not.toContain('列表已折叠');
        expect(source).not.toContain('面板已折叠');
        expect(source).not.toContain('展开列表');
        expect(source).not.toContain('双栏模式');
        expect(source).toContain('切换数据集');
    });

    it('分段档案编辑区使用卡片分区网格避免字段浪费或截断', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'components/features/Settings/NovelDecompositionSettings.tsx'),
            'utf8'
        );

        expect(source).toContain('novel-archive-fields');
        expect(source).toContain('novel-archive-short-grid');
        expect(source).toContain('grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]');
        expect(source).toContain('novel-archive-long-grid');
        expect(source).toContain('grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]');
        expect(source).toContain('novel-archive-long-textarea');
        expect(source).toContain('novel-segment-detail-scroll');
        expect(source).toContain('segmentDetailScrollRef.current?.scrollTo({ top: 0 })');
        expect(source).not.toContain('2xl:grid-cols-8');
        expect(source).not.toContain('xl:grid-cols-3');
        expect(source).not.toContain('pr-6 grid grid-cols-2 md:grid-cols-4 gap-2');
        expect(source).not.toContain('pr-6 grid grid-cols-2 md:grid-cols-3 gap-2');
        expect(source).not.toContain('sticky bottom-0 -mx-4 lg:-mx-5');
    });

    it('分段核心摘要和事实字段在宽屏并排展示', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'components/features/Settings/NovelDecompositionSettings.tsx'),
            'utf8'
        );

        expect(source).toContain('novel-segment-summary-grid');
        expect(source).toContain('grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]');
        expect(source).toContain('本组概括 (上帝视角)');
        expect(source).toContain('开局已成立事实');
        expect(source).toContain('前组延续事实');
    });
});
