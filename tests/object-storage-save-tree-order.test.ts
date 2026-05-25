import { describe, expect, it } from 'vitest';
import type { 对象存储云存档元数据 } from '../services/objectStorageSync';
import { 构建对象存储云存档时间树 } from '../utils/cloudPlaySaveTree';

const makeSave = (overrides: Partial<对象存储云存档元数据>): 对象存储云存档元数据 => ({
    id: overrides.id || 'save',
    fileName: `${overrides.id || 'save'}.json`,
    title: overrides.title || '测试角色',
    type: overrides.type || 'manual',
    saveTimestamp: overrides.saveTimestamp || 0,
    savedAt: overrides.savedAt || '',
    syncedAt: overrides.syncedAt || '',
    deviceType: 'computer',
    deviceLabel: 'E2E',
    appVersion: '1.0.315',
    versionCode: 316,
    hash: overrides.hash || `${overrides.id || 'save'}-hash`,
    size: 128,
    location: overrides.location || '竹屋',
    gameTime: overrides.gameTime || '1:1:1:8',
    turnCount: overrides.turnCount || 0,
    seriesId: overrides.seriesId,
    parentHash: overrides.parentHash,
    rootHash: overrides.rootHash,
    openingSnippet: overrides.openingSnippet,
    ...overrides
});

describe('对象存储云存档时间树排序', () => {
    it('系列列表按真实保存时间由新到旧显示，而不是按回合数抢前', () => {
        const olderHighProgress = makeSave({
            id: 'older-high-progress',
            title: '旧进度高',
            seriesId: 'series-old',
            turnCount: 28,
            savedAt: '2026-05-24T08:00:00+08:00',
            syncedAt: '2026-05-24T08:01:00+08:00',
            saveTimestamp: 1779571200000
        });
        const newerLowProgress = makeSave({
            id: 'newer-low-progress',
            title: '新保存低进度',
            seriesId: 'series-new',
            turnCount: 2,
            savedAt: '2026-05-25T08:00:00+08:00',
            syncedAt: '2026-05-25T08:01:00+08:00',
            saveTimestamp: 1779657600000
        });

        const trees = 构建对象存储云存档时间树([olderHighProgress, newerLowProgress]);

        expect(trees.map((item) => item.title)).toEqual(['新保存低进度', '旧进度高']);
    });

    it('同一系列的代表节点使用最新保存的节点', () => {
        const root = makeSave({
            id: 'root',
            seriesId: 'series-a',
            hash: 'root-hash',
            turnCount: 1,
            savedAt: '2026-05-24T08:00:00+08:00'
        });
        const child = makeSave({
            id: 'child',
            seriesId: 'series-a',
            hash: 'child-hash',
            parentHash: 'root-hash',
            turnCount: 2,
            savedAt: '2026-05-25T08:00:00+08:00'
        });

        const [tree] = 构建对象存储云存档时间树([root, child]);

        expect(tree.latest.id).toBe('child');
    });
});
