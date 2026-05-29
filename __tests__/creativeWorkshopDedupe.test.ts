import { describe, expect, it } from 'vitest';
import { 创意工坊模块列表, type 创意工坊模块条目 } from '../data/creativeWorkshopModules';
import {
    buildCreativeWorkshopContentFingerprint,
    filterCreativeWorkshopDuplicates,
    isOfficialCreativeWorkshopDuplicate
} from '../utils/creativeWorkshopDedupe';

const cloneOfficialAsCommunity = (entry: 创意工坊模块条目): 创意工坊模块条目 => ({
    ...JSON.parse(JSON.stringify(entry)),
    id: `cloud-copy-${entry.id}`,
    source: 'cloud',
    contributor: '玩家贡献',
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
    downloadUrl: '/api/workshop/modules?action=download&id=cloud-copy'
});

describe('创意工坊官方重复内容拦截', () => {
    it('用内容指纹识别官方模板被换来源重复贡献', () => {
        const official = 创意工坊模块列表[0];
        const communityCopy = cloneOfficialAsCommunity(official);

        expect(buildCreativeWorkshopContentFingerprint(communityCopy)).toBe(buildCreativeWorkshopContentFingerprint(official));
        expect(isOfficialCreativeWorkshopDuplicate(communityCopy, 创意工坊模块列表)).toBe(true);
    });

    it('列表合并时保留官方模板并过滤社区重复项', () => {
        const official = 创意工坊模块列表[0];
        const communityCopy = cloneOfficialAsCommunity(official);
        const entries = filterCreativeWorkshopDuplicates([official, communityCopy]);

        expect(entries).toHaveLength(1);
        expect(entries[0]).toBe(official);
    });

    it('玩家真正改过内容后不视为官方重复', () => {
        const official = 创意工坊模块列表[0];
        const changed = {
            ...cloneOfficialAsCommunity(official),
            description: `${official.description} 玩家新增了一条独立规则。`
        };

        expect(isOfficialCreativeWorkshopDuplicate(changed, 创意工坊模块列表)).toBe(false);
    });
});
