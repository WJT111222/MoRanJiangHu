export type 游戏时间片段 = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};

const toGameDayValue = (time: 游戏时间片段 | null | undefined): number | null => {
    if (!time) return null;
    const year = Number(time.year);
    const month = Number(time.month);
    const day = Number(time.day);
    if (![year, month, day].every(Number.isFinite)) return null;
    return (Math.trunc(year) * 12 + Math.max(0, Math.trunc(month) - 1)) * 31 + Math.max(0, Math.trunc(day) - 1);
};

export const 计算游戏历程天数 = (
    current: 游戏时间片段 | null | undefined,
    initial: 游戏时间片段 | null | undefined
): number => {
    const currentDay = toGameDayValue(current);
    const initialDay = toGameDayValue(initial);
    if (currentDay == null || initialDay == null) return 1;
    return Math.max(1, currentDay - initialDay + 1);
};
