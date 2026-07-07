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
        })).toBe('quick-opening-all');
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

    it('does not turn opening independent sub-stages into a full opening restart', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'opening-polish',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBeNull();
        expect(获取队列阶段重新生成动作({
            stageId: 'world',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBeNull();
        expect(获取队列阶段重新生成动作({
            stageId: 'planning',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBeNull();
        expect(获取队列阶段重新生成动作({
            stageId: 'variable',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBeNull();
        expect(获取队列阶段重新生成动作({
            stageId: 'opening-map',
            isOpeningQueue: true,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasQuickRestart: true
        })).toBeNull();
    });

    it('exposes stage retry for failed normal independent stages when a real handler is available', () => {
        for (const stageId of ['polish', 'world', 'planning', 'map']) {
            expect(获取队列阶段重新生成动作({
                stageId,
                phase: 'error',
                isOpeningQueue: false,
                hasReroll: true,
                hasRetryLatestVariableGeneration: true,
                hasRetryLatestStage: true,
                hasQuickRestart: true
            })).toBe('retry-stage');
        }
    });

    it('exposes stage retry for failed-then-skipped normal independent stages', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'planning',
            phase: 'skipped',
            isOpeningQueue: false,
            hasRetryLatestStage: true
        })).toBe('retry-stage');
    });

    it('does not expose a rerun button for normal independent stages without a real handler', () => {
        expect(获取队列阶段重新生成动作({
            stageId: 'world',
            phase: 'error',
            isOpeningQueue: false,
            hasReroll: true,
            hasRetryLatestVariableGeneration: true,
            hasRetryLatestStage: false,
            hasQuickRestart: true
        })).toBeNull();
    });
});
