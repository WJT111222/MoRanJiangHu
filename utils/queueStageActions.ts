export type 队列阶段重新生成动作 = 'reroll' | 'retry-variable' | 'quick-opening';

type 队列阶段动作参数 = {
    stageId: string;
    isOpeningQueue?: boolean;
    hasReroll?: boolean;
    hasRetryLatestVariableGeneration?: boolean;
    hasQuickRestart?: boolean;
};

const 开局不可重跑阶段 = new Set(['opening-input', 'opening-save']);

export const 获取队列阶段重新生成动作 = (params: 队列阶段动作参数): 队列阶段重新生成动作 | null => {
    const stageId = typeof params.stageId === 'string' ? params.stageId.trim() : '';
    if (!stageId) return null;

    if (params.isOpeningQueue) {
        if (开局不可重跑阶段.has(stageId)) return null;
        if (params.hasQuickRestart) return 'quick-opening';
        return null;
    }

    if (stageId === 'story' && params.hasReroll) return 'reroll';
    if (stageId === 'variable' && params.hasRetryLatestVariableGeneration) return 'retry-variable';
    return null;
};
