import { describe, expect, it } from 'vitest';
import { shouldPlayTurnNotification } from '../utils/turnNotificationState';

describe('turn notification state', () => {
    it('正文结束但后台队列仍在处理时不播放提示音', () => {
        expect(shouldPlayTurnNotification({
            wasTurnProcessing: true,
            loading: false,
            postStoryQueueRunning: true,
            view: 'game',
            enabled: true
        })).toBe(false);
    });

    it('正文和后台队列都结束后才播放提示音', () => {
        expect(shouldPlayTurnNotification({
            wasTurnProcessing: true,
            loading: false,
            postStoryQueueRunning: false,
            view: 'game',
            enabled: true
        })).toBe(true);
    });

    it('不在游戏页或关闭提示音时不播放提示音', () => {
        expect(shouldPlayTurnNotification({
            wasTurnProcessing: true,
            loading: false,
            postStoryQueueRunning: false,
            view: 'settings',
            enabled: true
        })).toBe(false);

        expect(shouldPlayTurnNotification({
            wasTurnProcessing: true,
            loading: false,
            postStoryQueueRunning: false,
            view: 'game',
            enabled: false
        })).toBe(false);
    });

    it('没有经历处理中的回合时不播放提示音', () => {
        expect(shouldPlayTurnNotification({
            wasTurnProcessing: false,
            loading: false,
            postStoryQueueRunning: false,
            view: 'game',
            enabled: true
        })).toBe(false);
    });
});
