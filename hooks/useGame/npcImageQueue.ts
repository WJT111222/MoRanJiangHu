type NPC生图等待队列项 = {
    npc: any;
    options: any;
    deps: any;
};

const NPC生图等待队列: NPC生图等待队列项[] = [];

export const 清空NPC生图等待队列 = () => {
    NPC生图等待队列.length = 0;
};

export const 入队NPC生图 = (item: NPC生图等待队列项) => {
    NPC生图等待队列.push(item);
};

export const 出队NPC生图 = (): NPC生图等待队列项 | undefined => {
    return NPC生图等待队列.shift();
};

export const 获取NPC生图队列长度 = (): number => {
    return NPC生图等待队列.length;
};
