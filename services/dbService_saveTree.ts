import type { 存档结构 } from '../types';
import { 读取存档保护状态, 读取存档摘要列表, 读取存档, 批量删除存档, 保存存档, type 存档摘要结构 } from './dbService';

export const 收集存档树节点ID = async (rootId: number, allSaves: 存档摘要结构[]): Promise<number[]> => {
    const collected = new Set<number>();
    const byHash = new Map<string, 存档摘要结构>();
    const byId = new Map<number, 存档摘要结构>();
    
    const 匹配存档哈希 = (targetHash: string, save: 存档摘要结构): boolean => {
        const fullHash = typeof save.元数据?.存档哈希 === 'string' ? save.元数据.存档哈希.trim() : '';
        if (!fullHash || !targetHash) return false;
        return fullHash === targetHash
            || fullHash.slice(0, 16) === targetHash.slice(0, 16)
            || fullHash.slice(-8) === targetHash.slice(-8);
    };

    allSaves.forEach((save) => {
        if (typeof save.id === 'number') byId.set(save.id, save);
        const hash = typeof save.元数据?.存档哈希 === 'string' ? save.元数据.存档哈希.trim() : '';
        if (hash) byHash.set(hash, save);
    });

    const root = byId.get(rootId);
    if (!root) return [];

    const traverse = (node: 存档摘要结构) => {
        if (typeof node.id !== 'number' || collected.has(node.id)) return;
        collected.add(node.id);
        
        const parentHash = typeof node.元数据?.存档父节点哈希 === 'string' ? node.元数据.存档父节点哈希.trim() : '';
        if (parentHash) {
            const parent = allSaves.find((s) => 匹配存档哈希(parentHash, s));
            if (parent) traverse(parent);
        }

        const nodeHash = typeof node.元数据?.存档哈希 === 'string' ? node.元数据.存档哈希.trim() : '';
        allSaves.forEach((child) => {
            const childParentHash = typeof child.元数据?.存档父节点哈希 === 'string' ? child.元数据.存档父节点哈希.trim() : '';
            if (childParentHash && nodeHash && 匹配存档哈希(childParentHash, { 元数据: { 存档哈希: nodeHash } } as any)) {
                traverse(child);
            }
        });
    };

    traverse(root);
    return Array.from(collected);
};

export const 删除存档树并重新保存全量存档 = async (saveId: number): Promise<void> => {
    if (await 读取存档保护状态()) {
        throw new Error('存档保护已开启，请先在"设置-数据存储"中关闭后再删除存档树。');
    }

    const fullSave = await 读取存档(saveId);
    if (!fullSave) throw new Error('存档不存在');

    const allSaves = await 读取存档摘要列表();
    const treeIds = await 收集存档树节点ID(saveId, allSaves);
    
    if (treeIds.length === 0) throw new Error('未找到存档树节点');

    // 先保存新全量存档，再删除旧树，避免图片资源在新存档写入前被清理
    const cleanedSave: 存档结构 = {
        ...fullSave,
        类型: 'manual',
        元数据: {
            ...fullSave.元数据,
            存档父节点哈希: '',
            存档根节点哈希: ''
        }
    };

    // 用新ID保存，避免与旧树冲突
    const newSave = { ...cleanedSave, id: undefined };
    await 保存存档(newSave as 存档结构);

    // 新存档写入成功后再删除旧树
    await 批量删除存档(treeIds);
};
