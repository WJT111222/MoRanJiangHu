export type 队列阶段重新生成动作 = 'reroll' | 'retry-variable' | 'retry-stage' | 'quick-opening-all';

type 队列阶段动作参数 = {
    stageId: string;
    phase?: string;
    isOpeningQueue?: boolean;
    hasReroll?: boolean;
    hasRetryLatestVariableGeneration?: boolean;
    hasRetryLatestStage?: boolean;
    hasQuickRestart?: boolean;
};

const 开局不可重跑阶段 = new Set(['opening-input', 'opening-save']);
const 开局完整重跑阶段 = new Set(['opening-story']);
const 可独立重试阶段 = new Set(['polish', 'world', 'planning', 'map']);
const 可重试失败状态 = new Set(['error', 'skipped', 'cancelled']);

export const 获取队列阶段重新生成动作 = (params: 队列阶段动作参数): 队列阶段重新生成动作 | null => {
    const stageId = typeof params.stageId === 'string' ? params.stageId.trim() : '';
    if (!stageId) return null;

    if (params.isOpeningQueue) {
        if (开局不可重跑阶段.has(stageId)) return null;
        if (!开局完整重跑阶段.has(stageId)) return null;
        if (params.hasQuickRestart) return 'quick-opening-all';
        return null;
    }

    if (stageId === 'story' && params.hasReroll) return 'reroll';
    if (stageId === 'variable' && params.hasRetryLatestVariableGeneration) return 'retry-variable';
    if (
        params.hasRetryLatestStage
        && 可独立重试阶段.has(stageId)
        && 可重试失败状态.has(typeof params.phase === 'string' ? params.phase : '')
    ) {
        return 'retry-stage';
    }
    return null;
};
