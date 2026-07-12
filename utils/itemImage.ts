import type { 游戏物品, 物品生图结果 } from '../models/item';
import type { 题材模式类型 } from '../models/system';
import { 获取图片展示地址, 是否远程图片地址 } from './imageAssets';
import { 获取预置物品图片URL, 精确匹配预置图片 } from '../data/presetItemImages';

const 读取物品生图历史 = (item?: 游戏物品 | null): 物品生图结果[] => {
    if (!Array.isArray(item?.图片档案?.生图历史)) return [];
    return item!.图片档案!.生图历史 as 物品生图结果[];
};

const 获取物品预置图地址 = (item?: 游戏物品 | null): string => {
    if (!item) return '';
    const candidateNames = [
        (item as any)?.规范物品名称,
        (item as any)?.预设物品名称,
        (item as any)?.标准物品名称,
        (item as any)?.基础物品名称,
        (item as any)?.图片匹配名称,
        (item as any)?.名称
    ].map((value) => typeof value === 'string' ? value.trim() : '').filter(Boolean);
    for (const name of candidateNames) {
        const url = 获取预置物品图片URL(
            name,
            (item as any)?.类型 || '',
            (item as any)?.品质 || ''
        );
        if (url) return url;
    }
    return '';
};

const 规范化物品图标复用字段 = (value: unknown): string => (
    typeof value === 'string' ? value.trim().replace(/[\s\u3000]+/g, '') : ''
);

export const 获取物品图标复用Key = (item?: 游戏物品 | null): string => {
    if (!item || typeof item !== 'object') return 'unknown';
    const name = [
        (item as any).规范物品名称,
        (item as any).预设物品名称,
        (item as any).标准物品名称,
        (item as any).基础物品名称,
        (item as any).图片匹配名称,
        (item as any).名称
    ].map(规范化物品图标复用字段).find(Boolean) || '';
    const type = 规范化物品图标复用字段((item as any).类型);
    const quality = 规范化物品图标复用字段((item as any).品质);
    const visualDescription = 规范化物品图标复用字段((item as any).生图描述);
    const visualTags = Array.isArray((item as any).视觉标签)
        ? (item as any).视觉标签.map(规范化物品图标复用字段).filter(Boolean).sort().join(',')
        : 规范化物品图标复用字段((item as any).视觉标签);
    const visualKey = [name, type, quality, visualDescription, visualTags].filter(Boolean).join('|');
    if (visualKey) return visualKey;
    return 规范化物品图标复用字段((item as any).ID) || 'unknown';
};

const 物品图床字段 = [
    '图片URL',
    '图标URL',
    '图片地址',
    '图标地址',
    '图床链接',
    '图床URL',
    '远程图片URL',
    '远程图标URL',
    '封面URL',
    '图标',
    '图片'
];

export const 获取物品远程图床地址 = (item?: 游戏物品 | null): string => {
    if (!item || typeof item !== 'object') return '';
    for (const key of 物品图床字段) {
        const value = (item as any)[key];
        if (typeof value === 'string' && 是否远程图片地址(value)) {
            return value.trim();
        }
    }
    return '';
};

const 获取物品远程图床记录 = (item?: 游戏物品 | null): 物品生图结果 | null => {
    const remoteUrl = 获取物品远程图床地址(item);
    if (!remoteUrl) return null;
    return {
        id: `hosted_${remoteUrl}`,
        图片URL: remoteUrl,
        生图词组: '',
        原始描述: '',
        使用模型: 'hosted',
        生成时间: 0,
        构图: '物品图标',
        状态: 'success',
        来源: 'hosted'
    };
};

export const 获取物品已选图标记录 = (item?: 游戏物品 | null): 物品生图结果 | null => {
    if (!item) return null;

    const history = 读取物品生图历史(item);
    const selectedIconId = typeof item.图片档案?.已选图标图片ID === 'string'
        ? item.图片档案.已选图标图片ID.trim()
        : '';

    const selectedRecord = selectedIconId
        ? history.find((entry) => entry?.id === selectedIconId)
            || (item.图片档案?.最近生图结果?.id === selectedIconId ? item.图片档案.最近生图结果 || null : null)
        : null;

    if (selectedRecord?.状态 === 'success' && 获取图片展示地址(selectedRecord)) {
        return selectedRecord;
    }

    const firstIconRecord = history.find((entry) => entry?.构图 === '物品图标' && entry?.状态 === 'success' && 获取图片展示地址(entry));
    if (firstIconRecord) return firstIconRecord;

    const recentRecord = item.图片档案?.最近生图结果;
    if (recentRecord?.状态 === 'success' && 获取图片展示地址(recentRecord)) {
        return recentRecord;
    }

    const hostedRecord = 获取物品远程图床记录(item);
    if (hostedRecord) return hostedRecord;

    return history.find((entry) => entry?.状态 === 'success' && 获取图片展示地址(entry)) || null;
};

export const 获取物品已选图标地址 = (item?: 游戏物品 | null): string => {
    const record = 获取物品已选图标记录(item);
    const fromRecord = 获取图片展示地址(record);
    const presetUrl = 获取物品预置图地址(item);
    const itemName = typeof (item as any)?.名称 === 'string' ? (item as any).名称 : '';
    const hasExplicitSelectedIcon = typeof item?.图片档案?.已选图标图片ID === 'string' && item.图片档案.已选图标图片ID.trim();
    if (presetUrl && (!fromRecord || 精确匹配预置图片(itemName.trim()) || (!hasExplicitSelectedIcon && itemName.trim() !== itemName))) return presetUrl;
    if (fromRecord) return fromRecord;

    return '';
};

export const 物品已有可用图标 = (item?: 游戏物品 | null): boolean => Boolean(获取物品已选图标地址(item));

export const 合并物品图片档案 = (item: 游戏物品, result: 物品生图结果) => {
    const archive = item.图片档案 && typeof item.图片档案 === 'object' ? item.图片档案 : {};
    const history = Array.isArray(archive.生图历史) ? archive.生图历史 : [];
    const normalized: 物品生图结果 = {
        ...result,
        id: result.id || `item_img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    const mergedHistory = [normalized, ...history.filter((entry) => entry?.id !== normalized.id)].slice(0, 12);
    return {
        ...archive,
        最近生图结果: normalized,
        生图历史: mergedHistory,
        已选图标图片ID: normalized.构图 === '物品图标'
            ? normalized.id
            : archive.已选图标图片ID || normalized.id,
    };
};

// ─── 用户图库工具函数 ─────────────────────────────────────────────────

import { 保存到用户图库, 查询用户图库图片 as 查询图库数据库, 删除用户图库条目, 读取图片资源, 用户图库条目 } from '../services/dbService';

export const 提取图库物品名称 = (item: 游戏物品): string => {
    const candidates = [
        (item as any).规范物品名称,
        (item as any).预设物品名称,
        (item as any).标准物品名称,
        (item as any).基础物品名称,
        (item as any).图片匹配名称,
        (item as any).名称
    ];
    return candidates.find((v) => typeof v === 'string' && v.trim()) || '';
};

const 生成缩略图 = async (dataUrl: string, maxSize = 128): Promise<string> => {
    if (typeof document === 'undefined') return '';
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(''); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/webp', 0.7));
        };
        img.onerror = () => resolve('');
        img.src = dataUrl;
    });
};

export const 存入用户图库 = async (
    item: 游戏物品,
    record: 物品生图结果,
    mode: 题材模式类型,
    workshopModuleId: string
): Promise<string> => {
    const itemName = 提取图库物品名称(item);
    if (!itemName) throw new Error('存入用户图库失败：物品名称为空');
    const assetId = record.本地路径?.replace('wuxia-asset://', '') || '';
    const remoteUrl = record.图片URL || '';
    if (!assetId && !remoteUrl) {
        throw new Error('存入用户图库失败：图片资源引用为空');
    }
    let thumbnailDataUrl: string | undefined;
    try {
        const fullDataUrl = assetId ? await 读取图片资源(assetId) : '';
        if (fullDataUrl) {
            thumbnailDataUrl = await 生成缩略图(fullDataUrl);
        }
    } catch {
        // 缩略图生成失败不影响存入
    }
    const entry: 用户图库条目 = {
        id: `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        itemName,
        mode,
        workshopModuleId,
        assetId,
        imageUrl: remoteUrl,
        prompt: record.生图词组 || '',
        itemType: (item as any)?.类型 || '',
        quality: (item as any)?.品质 || '',
        createdAt: record.生成时间 || Date.now(),
        thumbnailDataUrl
    };
    return 保存到用户图库(entry);
};

export const 查询用户图库图片 = async (
    item: 游戏物品,
    mode: 题材模式类型,
    workshopModuleId: string
): Promise<用户图库条目 | null> => {
    const itemName = 提取图库物品名称(item);
    if (!itemName) return null;
    return 查询图库数据库(itemName, mode, workshopModuleId);
};

export const 物品已在图库中 = async (
    item: 游戏物品,
    mode: 题材模式类型,
    workshopModuleId: string
): Promise<boolean> => {
    const entry = await 查询用户图库图片(item, mode, workshopModuleId);
    return entry?.assetId != null;
};

export const 从用户图库移除 = async (
    item: 游戏物品,
    mode: 题材模式类型,
    workshopModuleId: string
): Promise<void> => {
    const entry = await 查询用户图库图片(item, mode, workshopModuleId);
    if (entry?.id) {
        await 删除用户图库条目(entry.id);
    }
};
