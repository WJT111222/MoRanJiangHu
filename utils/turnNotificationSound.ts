let audioEl: HTMLAudioElement | null = null;

const SOUND_URL = '/sounds/turn-notify.mp3';

export const playTurnNotificationSound = (): void => {
    if (typeof window === 'undefined') return;
    try {
        if (!audioEl) {
            audioEl = new Audio(SOUND_URL);
            audioEl.preload = 'auto';
        }
        audioEl.currentTime = 0;
        audioEl.volume = 0.6;
        audioEl.play().catch(() => {});
    } catch {
        // ignore playback errors
    }
};
