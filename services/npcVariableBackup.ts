import type { NPC结构 } from '../types';
import * as dbService from './dbService';
import { 设置键 } from '../utils/settingsSchema';

export type NPC变量备份来源 = 'manual' | 'auto_turn' | 'before_manual_delete' | 'restore';

export interface NPC变量备份记录 {
    id: string;
    创建时间: string;
    来源: NPC变量备份来源;
    标签?: string;
    NPC数量: number;
    社交: NPC结构[];
    签名: string;
}

const 最大备份数量 = 30;

const 深拷贝 = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const 清理NPC图片字段 = (npc: any): any => {
    if (!npc || typeof npc !== 'object' || Array.isArray(npc)) return npc;
    const next = 深拷贝(npc);
    delete next.图片档案;
    delete next.最近生图结果;
    delete next.头像图片URL;
    delete next.图片URL;
    delete next.dataUrl;
    delete next.base64;
    return next;
};

const 清理社交备份列表 = (socialList: any[]): NPC结构[] => (
    (Array.isArray(socialList) ? socialList : [])
        .filter((npc) => npc && typeof npc === 'object' && !Array.isArray(npc))
        .map((npc) => 清理NPC图片字段(npc))
);

const 生成备份ID = (): string => `npc_backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const 计算备份签名 = (socialList: NPC结构[]): string => {
    try {
        return JSON.stringify(socialList);
    } catch {
        return `${socialList.length}:${Date.now()}`;
    }
};

export const 读取NPC变量备份列表 = async (): Promise<NPC变量备份记录[]> => {
    const raw = await dbService.读取设置(设置键.NPC变量备份);
    return Array.isArray(raw)
        ? raw.filter((item) => item && typeof item === 'object' && Array.isArray(item.社交))
        : [];
};

export const 保存NPC变量本地备份 = async (
    socialList: any[],
    options?: { 来源?: NPC变量备份来源; 标签?: string }
): Promise<NPC变量备份记录 | null> => {
    const 社交 = 清理社交备份列表(socialList);
    if (社交.length <= 0) return null;

    const 签名 = 计算备份签名(社交);
    const existing = await 读取NPC变量备份列表();
    if (existing[0]?.签名 === 签名) {
        return existing[0];
    }

    const record: NPC变量备份记录 = {
        id: 生成备份ID(),
        创建时间: new Date().toISOString(),
        来源: options?.来源 || 'manual',
        标签: options?.标签,
        NPC数量: 社交.length,
        社交,
        签名
    };
    await dbService.保存设置(设置键.NPC变量备份, [record, ...existing].slice(0, 最大备份数量));
    return record;
};

export const 读取最新NPC变量备份 = async (): Promise<NPC变量备份记录 | null> => {
    const list = await 读取NPC变量备份列表();
    return list[0] || null;
};

export const 读取NPC变量自动备份开启 = async (): Promise<boolean> => {
    const value = await dbService.读取设置(设置键.NPC变量自动备份);
    return value === true;
};

export const 设置NPC变量自动备份开启 = async (enabled: boolean): Promise<void> => {
    await dbService.保存设置(设置键.NPC变量自动备份, enabled === true);
};

export const 自动备份NPC变量 = async (
    socialList: any[],
    options?: { 标签?: string }
): Promise<NPC变量备份记录 | null> => {
    if (!(await 读取NPC变量自动备份开启())) return null;
    return 保存NPC变量本地备份(socialList, {
        来源: 'auto_turn',
        标签: options?.标签
    });
};
