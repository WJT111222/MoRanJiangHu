export type 存档批量导出进度<TItem> = {
    completed: number;
    current: number;
    total: number;
    item: TItem;
    phase: 'reading' | 'building' | 'writing' | 'done';
};

export class 存档批量导出错误<TItem = unknown> extends Error {
    completed: number;
    failedIndex: number;
    total: number;
    item: TItem;
    cause?: unknown;

    constructor(params: {
        completed: number;
        failedIndex: number;
        total: number;
        item: TItem;
        cause: unknown;
    }) {
        const detail = params.cause instanceof Error ? params.cause.message : String(params.cause || '未知错误');
        super(`批量导出在第 ${params.failedIndex + 1}/${params.total} 条中断，已完成 ${params.completed} 条：${detail}`);
        this.name = '存档批量导出错误';
        this.completed = params.completed;
        this.failedIndex = params.failedIndex;
        this.total = params.total;
        this.item = params.item;
        this.cause = params.cause;
    }
}

export const 顺序导出存档 = async <TItem, TSave, TArchive>(params: {
    items: TItem[];
    readSave: (item: TItem, index: number) => Promise<TSave>;
    buildArchive: (save: TSave, item: TItem, index: number) => Promise<TArchive>;
    writeArchive: (archive: TArchive, save: TSave, item: TItem, index: number) => Promise<void>;
    onProgress?: (progress: 存档批量导出进度<TItem>) => void;
}): Promise<{ completed: number; total: number }> => {
    const total = params.items.length;
    let completed = 0;

    for (let index = 0; index < total; index += 1) {
        const item = params.items[index];
        const notify = (phase: 存档批量导出进度<TItem>['phase']) => params.onProgress?.({
            completed,
            current: index + 1,
            total,
            item,
            phase
        });
        try {
            notify('reading');
            const save = await params.readSave(item, index);
            notify('building');
            const archive = await params.buildArchive(save, item, index);
            notify('writing');
            await params.writeArchive(archive, save, item, index);
            completed += 1;
            notify('done');
        } catch (cause) {
            throw new 存档批量导出错误({
                completed,
                failedIndex: index,
                total,
                item,
                cause
            });
        }
    }

    return { completed, total };
};
