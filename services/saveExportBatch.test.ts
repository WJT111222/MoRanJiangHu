import { describe, expect, it } from 'vitest';
import { 顺序导出存档, 存档批量导出错误 } from './saveExportBatch';

describe('顺序导出存档', () => {
    it('写完当前存档后才读取下一条', async () => {
        const events: string[] = [];
        const result = await 顺序导出存档({
            items: [{ id: 1 }, { id: 2 }],
            readSave: async (item) => {
                events.push(`read:${item.id}`);
                return { id: item.id, payload: `save-${item.id}` };
            },
            buildArchive: async (save) => {
                events.push(`build:${save.id}`);
                return { id: save.id, bytes: new Uint8Array([save.id]) };
            },
            writeArchive: async (archive) => {
                events.push(`write:${archive.id}`);
            }
        });

        expect(events).toEqual([
            'read:1',
            'build:1',
            'write:1',
            'read:2',
            'build:2',
            'write:2'
        ]);
        expect(result).toEqual({ completed: 2, total: 2 });
    });

    it('中途失败时报告已完成数量和失败位置', async () => {
        const progress: Array<{ completed: number; current: number; total: number }> = [];

        await expect(顺序导出存档({
            items: [{ id: 1 }, { id: 2 }, { id: 3 }],
            readSave: async (item) => ({ id: item.id }),
            buildArchive: async (save) => ({ id: save.id }),
            writeArchive: async (archive) => {
                if (archive.id === 2) throw new Error('设备写入失败');
            },
            onProgress: (state) => progress.push({
                completed: state.completed,
                current: state.current,
                total: state.total
            })
        })).rejects.toMatchObject({
            name: '存档批量导出错误',
            completed: 1,
            failedIndex: 1,
            total: 3
        } satisfies Partial<存档批量导出错误>);

        expect(progress.at(-1)).toEqual({ completed: 1, current: 2, total: 3 });
    });
});
