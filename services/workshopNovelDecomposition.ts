import { 内置小说分解创意工坊模块 } from '../data/builtinNovelDecompositionWorkshop';
import { RELEASE_INFO } from '../data/releaseInfo';
import { isNativeCapacitorEnvironment } from '../utils/nativeRuntime';

export interface 小说分解创意工坊条目 {
    id: string;
    title: string;
    workName: string;
    contributor: string;
    note: string;
    createdAt: string;
    updatedAt: string;
    fileName: string;
    size: number;
    sha256: string;
    chapterCount: number;
    segmentCount: number;
    sourceType: string;
    tags: string[];
    source?: 'builtin' | 'cloud';
    downloadUrl?: string;
}

export interface 发布小说分解创意工坊参数 {
    zipBlob: Blob;
    fileName: string;
    title: string;
    workName: string;
    contributor?: string;
    note?: string;
    chapterCount?: number;
    segmentCount?: number;
    sourceType?: string;
    tags?: string[];
}

export interface 发布小说分解创意工坊结果 {
    entry: 小说分解创意工坊条目;
    downloadUrl: string;
}

const API_PATH = '/api/workshop/novel-decomposition';
const WORKSHOP_API_FALLBACK_ERROR = '创意工坊接口没有命中服务端函数，当前请求被网站首页兜底处理。请刷新页面或更新到最新版本后重试。';

const 看起来像HTML页面 = (text: string): boolean => /^\s*<!doctype\s+html\b/i.test(text) || /^\s*<html\b/i.test(text);

const 获取创意工坊API基础地址 = (): string => {
    if (typeof window !== 'undefined' && /^https?:$/i.test(window.location.protocol) && !isNativeCapacitorEnvironment()) {
        return window.location.origin.replace(/\/+$/, '');
    }
    const configured = typeof RELEASE_INFO.websiteUrl === 'string' ? RELEASE_INFO.websiteUrl.trim() : '';
    return (configured || 'https://msjh.bacon159.pp.ua').replace(/\/+$/, '');
};

const 构建创意工坊API地址 = (search = ''): string => {
    const base = 获取创意工坊API基础地址();
    const suffix = search ? `${API_PATH}${search.startsWith('?') ? search : `?${search}`}` : API_PATH;
    return base ? `${base}${suffix}` : suffix;
};

const 规范化创意工坊下载地址 = (value: unknown, id: string): string => {
    const fallback = 构建创意工坊API地址(`action=download&id=${encodeURIComponent(id || '')}`);
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return fallback;
    try {
        return new URL(raw, 获取创意工坊API基础地址()).toString();
    } catch {
        return fallback;
    }
};

const 读取响应JSON = async (response: Response): Promise<any> => {
    const text = await response.text();
    if (看起来像HTML页面(text)) {
        return { ok: false, error: WORKSHOP_API_FALLBACK_ERROR };
    }
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        const preview = text.trim().slice(0, 200);
        return { ok: false, error: preview ? `创意工坊接口返回了非 JSON 内容：${preview}` : '创意工坊接口返回了空响应' };
    }
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
    }
    return btoa(binary);
};

export const 列出小说分解创意工坊模块 = async (): Promise<小说分解创意工坊条目[]> => {
    const response = await fetch(构建创意工坊API地址(), {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `读取创意工坊失败：${response.status}`);
    }
    if (!Array.isArray(payload?.entries)) {
        throw new Error(payload?.error || '读取创意工坊失败：服务端没有返回模块列表');
    }
    const cloudEntries = (Array.isArray(payload?.entries) ? payload.entries : [])
        .map((entry: 小说分解创意工坊条目) => ({
            ...entry,
            source: 'cloud' as const,
            downloadUrl: 规范化创意工坊下载地址(entry.downloadUrl, entry.id)
        }));
    const seen = new Set(内置小说分解创意工坊模块.map((entry) => entry.id));
    return [
        ...内置小说分解创意工坊模块,
        ...cloudEntries.filter((entry: 小说分解创意工坊条目) => !seen.has(entry.id))
    ];
};

export const 发布小说分解创意工坊模块 = async (
    params: 发布小说分解创意工坊参数
): Promise<发布小说分解创意工坊结果> => {
    const fallbackTitle = (params.title || params.workName || '未命名小说分解模块').trim();
    const response = await fetch(构建创意工坊API地址(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            fileName: params.fileName,
            title: fallbackTitle,
            workName: (params.workName || fallbackTitle).trim(),
            contributor: params.contributor || '',
            note: params.note || '',
            chapterCount: params.chapterCount || 0,
            segmentCount: params.segmentCount || 0,
            sourceType: params.sourceType || '',
            tags: params.tags || [],
            zipBase64: await blobToBase64(params.zipBlob)
        })
    });
    const payload = await 读取响应JSON(response);
    if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || `发布创意工坊失败：${response.status}`);
    }
    if (!payload?.entry || typeof payload.entry !== 'object') {
        throw new Error(payload?.error || '发布创意工坊失败：服务端没有返回模块信息');
    }
    const entry = {
        ...payload.entry,
        title: payload.entry.title || fallbackTitle,
        workName: payload.entry.workName || params.workName || fallbackTitle,
        tags: Array.isArray(payload.entry.tags) ? payload.entry.tags : []
    } as 小说分解创意工坊条目;
    return {
        entry,
        downloadUrl: 规范化创意工坊下载地址(payload.downloadUrl, entry.id || '')
    };
};

export const 下载小说分解创意工坊模块 = async (id: string): Promise<Blob> => {
    const builtin = 内置小说分解创意工坊模块.find((entry) => entry.id === id);
    const response = await fetch(builtin?.downloadUrl || 构建创意工坊API地址(`action=download&id=${encodeURIComponent(id)}`));
    if (!response.ok) {
        const payload = await 读取响应JSON(response);
        throw new Error(payload?.error || `下载创意工坊模块失败：${response.status}`);
    }
    return response.blob();
};
