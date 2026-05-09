import type { 任务结构, 任务目标 } from '../models/task';

const 取数字 = (value: unknown, fallback = 0): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

export const 任务目标已完成 = (objective: Partial<任务目标> | any): boolean => {
    if (!objective || typeof objective !== 'object') return false;
    if (objective.完成状态 === true) return true;
    const total = 取数字(objective.总需进度, 0);
    if (total <= 0) return false;
    return 取数字(objective.当前进度, 0) >= total;
};

export const 规范化任务自动结算 = (task: 任务结构 | any): 任务结构 | any => {
    if (!task || typeof task !== 'object') return task;
    const objectives = Array.isArray(task.目标列表)
        ? task.目标列表.map((objective: any) => {
            const done = 任务目标已完成(objective);
            const total = Math.max(0, 取数字(objective?.总需进度, 0));
            const current = Math.max(0, 取数字(objective?.当前进度, done ? total : 0));
            return {
                ...objective,
                当前进度: done && total > 0 ? Math.max(current, total) : current,
                完成状态: done,
            };
        })
        : [];
    const allObjectivesDone = objectives.length > 0 && objectives.every(任务目标已完成);
    const currentStatus = typeof task.当前状态 === 'string' && task.当前状态.trim()
        ? task.当前状态
        : '进行中';
    const shouldAutoComplete = allObjectivesDone && currentStatus !== '已完成' && currentStatus !== '已失败';
    return {
        ...task,
        当前状态: shouldAutoComplete ? '已完成' : currentStatus,
        目标列表: objectives,
    };
};

export const 规范化任务列表自动结算 = (tasks: any[]): any[] => (
    Array.isArray(tasks) ? tasks.map(规范化任务自动结算) : []
);

