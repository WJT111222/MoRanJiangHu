export interface TurnNotificationState {
    wasTurnProcessing: boolean;
    loading: boolean;
    postStoryQueueRunning: boolean;
    view: string;
    enabled: boolean;
}

export const isTurnProcessing = (state: Pick<TurnNotificationState, 'loading' | 'postStoryQueueRunning'>): boolean => {
    return state.loading || state.postStoryQueueRunning;
};

export const shouldPlayTurnNotification = (state: TurnNotificationState): boolean => {
    return state.wasTurnProcessing
        && !isTurnProcessing(state)
        && state.view === 'game'
        && state.enabled;
};
