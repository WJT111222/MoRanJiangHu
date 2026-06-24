import { describe, expect, it } from 'vitest';
import { 获取队列阶段重新生成动作 } from '../utils/queueStageActions';

describe('queue stage rerun actions', () => {
    it('uses opening restart for opening story when quick restart is available', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'opening-story',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: false,
            hasQuickRestart: true
        })).toBe('quick-opening');
    });

    it('uses variable retry for normal variable stage', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'variable',
            isOpeningQueue: false,
            hasReroll: false,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: false
        })).toBe('retry-variable');
    });

    it('uses opening restart for skipped opening sub-stages', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'opening-polish',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBe('quick-opening');
        expect(获取队列阶段重新生成动作({
            stageId: 'world',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBe('quick-opening');
        expect(获取队列阶段重新生成动作({
            stageId: 'planning',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBe('quick-opening');
    });

    it('does not expose a rerun button for normal stages with no real handler', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'world',
            isOpeningQueue: false,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBeNull();
    });
});
