import { describe, expect, it } from 'vitest';
import { 解析模型规则编辑选中ID } from '../utils/modelRuleEditorSelection';

describe('model rule editor selection', () => {
    const presetIds = ['active-rule', 'custom-rule', 'backup-rule'];

    it('keeps a manually selected valid rule instead of snapping back to the active rule', () => {
        expect(解析模型规则编辑选中ID({
            当前编辑ID: 'custom-rule',
            可选规则ID列表: presetIds,
            默认规则ID: 'active-rule'
        })).toBe('custom-rule');
    });

    it('falls back to the active rule only when the editor selection is empty or stale', () => {
        expect(解析模型规则编辑选中ID({
            当前编辑ID: '',
            可选规则ID列表: presetIds,
            默认规则ID: 'active-rule'
        })).toBe('active-rule');

        expect(解析模型规则编辑选中ID({
            当前编辑ID: 'deleted-rule',
            可选规则ID列表: presetIds,
            默认规则ID: 'active-rule'
        })).toBe('active-rule');
    });
});
